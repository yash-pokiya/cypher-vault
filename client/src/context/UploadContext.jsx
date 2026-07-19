import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { generateFileKey, encryptFile } from '../crypto/fileEncryption';
import { generateSalt, toBase64 } from '../crypto/keyDerivation';
import { wrapFileKey } from '../crypto/keyWrapping';
import { useCryptoContext } from './CryptoContext';
import { fileAPI } from '../api/file.api';

const UploadContext = createContext(null);

export const STAGES = {
  PREPARING:  'preparing',  // 0%
  ENCRYPTING: 'encrypting', // 0-15%
  UPLOADING:  'uploading',  // 15-80% (real browser byte progress)
  STORING:    'storing',    // 80-95% (server uploading to Cloudinary)
  FINALIZING: 'finalizing', // 95-99% (saving MongoDB metadata)
  DONE:       'done',       // 100% (Upload Complete)
  CANCELLED:  'cancelled',
  ERROR:      'error',
};

export function UploadProvider({ children }) {
  const { getMasterKeyForSalt } = useCryptoContext();
  const [queue, setQueue] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const pendingNavigationRef = useRef(null);

  // Map of itemId -> AbortController
  const controllersRef = useRef(new Map());
  // Map of itemId -> lastStateUpdateTimestamp (for throttling renders)
  const lastUpdateRef = useRef(new Map());

  const updateItem = useCallback((id, updates) => {
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  // Check if any uploads are currently active
  const hasActiveUploads = queue.some((i) =>
    [STAGES.PREPARING, STAGES.ENCRYPTING, STAGES.UPLOADING, STAGES.STORING, STAGES.FINALIZING].includes(i.stage)
  );

  // ── Browser Refresh / Close Protection (beforeunload) ──
  useEffect(() => {
    if (!hasActiveUploads) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Upload in Progress. Leaving now will cancel the upload.';
      return 'Upload in Progress. Leaving now will cancel the upload.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasActiveUploads]);

  // ── Process single upload item ─────────────────────────────────
  const processItem = useCallback(
    async (item, folder = '', folderId = null) => {
      const controller = new AbortController();
      controllersRef.current.set(item.id, controller);

      try {
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');

        // Stage 1: Preparing
        updateItem(item.id, {
          stage: STAGES.PREPARING,
          progress: 0,
          loadedBytes: 0,
          totalBytes: item.size,
          speed: 0,
          remainingTime: null,
          statusMessage: 'Preparing…',
          error: null,
        });

        // Stage 2: Local Encryption
        updateItem(item.id, {
          stage: STAGES.ENCRYPTING,
          progress: 10,
          statusMessage: 'Encrypting photo locally…',
        });

        const fileBuffer = await item.file.arrayBuffer();
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');

        const fileKey    = await generateFileKey();
        const salt       = generateSalt();
        const saltB64    = toBase64(salt);

        const { ciphertext, iv } = await encryptFile(fileBuffer, fileKey);
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');

        const ivB64 = toBase64(iv);
        updateItem(item.id, { progress: 15 });

        const masterKey     = await getMasterKeyForSalt(saltB64);
        const wrappedKeyB64 = await wrapFileKey(masterKey, fileKey);
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');

        // Stage 3: Real Browser Network Upload (15% - 80%)
        updateItem(item.id, {
          stage: STAGES.UPLOADING,
          progress: 15,
          statusMessage: 'Uploading to server…',
        });

        const encBlob  = new Blob([ciphertext], { type: 'application/octet-stream' });
        const formData = new FormData();
        formData.append('file',           encBlob, item.file.name + '.enc');
        formData.append('wrappedFileKey', wrappedKeyB64);
        formData.append('iv',             ivB64);
        formData.append('salt',           saltB64);
        formData.append('mimeType',       item.file.type || 'application/octet-stream');
        formData.append('filename',       item.file.name);
        formData.append('size',           String(item.file.size));
        formData.append('folder',         folder);
        if (folderId) {
          formData.append('folderId',     folderId);
        }

        const uploadStartTime = Date.now();

        await fileAPI.upload(
          formData,
          ({ loaded, total }) => {
            const now = Date.now();
            const last = lastUpdateRef.current.get(item.id) || 0;

            const pct = total > 0 ? loaded / total : 0;
            const isBrowserUploadComplete = loaded >= total;

            if (now - last > 100 || isBrowserUploadComplete) {
              lastUpdateRef.current.set(item.id, now);

              const elapsedSec = (now - uploadStartTime) / 1000;
              const speed = elapsedSec > 0.2 ? loaded / elapsedSec : 0;
              const remainingBytes = total - loaded;
              const remainingTime = speed > 0 ? remainingBytes / speed : null;

              if (isBrowserUploadComplete) {
                // Transition to Stage 4: Server streaming to Cloudinary
                updateItem(item.id, {
                  stage: STAGES.STORING,
                  progress: 88,
                  loadedBytes: total,
                  totalBytes: total,
                  speed: 0,
                  remainingTime: null,
                  statusMessage: 'Uploading to secure cloud storage…',
                });
              } else {
                // Scale browser byte progress between 15% and 80%
                const scaledProgress = Math.min(80, 15 + Math.round(pct * 65));
                updateItem(item.id, {
                  stage: STAGES.UPLOADING,
                  progress: scaledProgress,
                  loadedBytes: loaded,
                  totalBytes: total,
                  speed,
                  remainingTime,
                  statusMessage: `Uploading to server… ${scaledProgress}%`,
                });
              }
            }
          },
          controller.signal
        );

        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');

        // Stage 5: Finalizing metadata
        updateItem(item.id, {
          stage: STAGES.FINALIZING,
          progress: 97,
          statusMessage: 'Saving encrypted metadata…',
        });

        // Stage 6: Upload Complete!
        updateItem(item.id, {
          stage: STAGES.DONE,
          progress: 100,
          loadedBytes: item.size,
          totalBytes: item.size,
          speed: 0,
          remainingTime: null,
          statusMessage: '✔ Upload Complete',
          error: null,
        });

        // Notify app components (e.g. Gallery) to reload file list
        window.dispatchEvent(new CustomEvent('vault:file-uploaded', { detail: { folder, folderId } }));

      } catch (err) {
        const isAborted =
          err.name === 'AbortError' ||
          err.name === 'CanceledError' ||
          err.code === 'ERR_CANCELED' ||
          controller.signal.aborted;

        if (isAborted) {
          updateItem(item.id, {
            stage: STAGES.CANCELLED,
            speed: 0,
            remainingTime: null,
            statusMessage: '✕ Cancelled',
            error: 'Upload cancelled',
          });
        } else {
          updateItem(item.id, {
            stage: STAGES.ERROR,
            speed: 0,
            remainingTime: null,
            statusMessage: '⚠️ Upload failed',
            error: err.message || 'Upload failed',
          });
        }
      } finally {
        controllersRef.current.delete(item.id);
        lastUpdateRef.current.delete(item.id);
      }
    },
    [getMasterKeyForSalt, updateItem]
  );

  // ── Upload multiple files ──────────────────────────────────────
  const uploadFiles = useCallback(
    (files, folder = '', folderId = null) => {
      const fileList = Array.from(files);
      const newItems = fileList.map((file) => ({
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        file,
        filename: file.name,
        size: file.size,
        stage: STAGES.PREPARING,
        progress: 0,
        loadedBytes: 0,
        totalBytes: file.size,
        speed: 0,
        remainingTime: null,
        statusMessage: 'Preparing…',
        error: null,
        folder,
        folderId,
      }));

      setQueue((q) => [...q, ...newItems]);

      // Start processing each file in background
      newItems.forEach((item) => {
        processItem(item, folder, folderId);
      });
    },
    [processItem]
  );

  // ── Cancel single upload ───────────────────────────────────────
  const cancelUpload = useCallback((id) => {
    const controller = controllersRef.current.get(id);
    if (controller) {
      controller.abort('Upload cancelled by user');
      controllersRef.current.delete(id);
    }
    updateItem(id, { stage: STAGES.CANCELLED, speed: 0, remainingTime: null, statusMessage: '✕ Cancelled', error: 'Upload cancelled' });
  }, [updateItem]);

  // ── Cancel all active uploads ──────────────────────────────────
  const cancelAllUploads = useCallback(() => {
    controllersRef.current.forEach((controller) => {
      try { controller.abort('Cancelled all uploads'); } catch { /* silent */ }
    });
    controllersRef.current.clear();

    setQueue((q) =>
      q.map((item) =>
        [STAGES.PREPARING, STAGES.ENCRYPTING, STAGES.UPLOADING, STAGES.STORING, STAGES.FINALIZING].includes(item.stage)
          ? { ...item, stage: STAGES.CANCELLED, speed: 0, remainingTime: null, statusMessage: '✕ Cancelled', error: 'Upload cancelled' }
          : item
      )
    );
  }, []);

  // ── Retry failed or cancelled upload ──────────────────────────
  const retryUpload = useCallback(
    (id) => {
      const item = queue.find((i) => i.id === id);
      if (!item) return;

      updateItem(id, {
        stage: STAGES.PREPARING,
        progress: 0,
        loadedBytes: 0,
        speed: 0,
        remainingTime: null,
        statusMessage: 'Preparing…',
        error: null,
      });
      processItem(item, item.folder, item.folderId);
    },
    [queue, updateItem, processItem]
  );

  // ── Clear completed & cancelled items ──────────────────────────
  const clearCompleted = useCallback(() => {
    setQueue((q) => q.filter((i) => i.stage !== STAGES.DONE && i.stage !== STAGES.CANCELLED));
  }, []);

  // ── Clear entire queue ─────────────────────────────────────────
  const clearQueue = useCallback(() => {
    cancelAllUploads();
    setQueue([]);
  }, [cancelAllUploads]);

  // ── Route Protection Modal Handlers ───────────────────────────
  const promptLeaveConfirmation = useCallback((onConfirm) => {
    if (hasActiveUploads) {
      pendingNavigationRef.current = onConfirm;
      setShowLeaveModal(true);
      return false; // block navigation
    }
    return true; // allow navigation
  }, [hasActiveUploads]);

  const confirmLeave = useCallback(() => {
    cancelAllUploads();
    setShowLeaveModal(false);
    if (pendingNavigationRef.current) {
      const callback = pendingNavigationRef.current;
      pendingNavigationRef.current = null;
      callback();
    }
  }, [cancelAllUploads]);

  const cancelLeave = useCallback(() => {
    pendingNavigationRef.current = null;
    setShowLeaveModal(false);
  }, []);

  return (
    <UploadContext.Provider
      value={{
        queue,
        uploadFiles,
        cancelUpload,
        cancelAllUploads,
        retryUpload,
        clearCompleted,
        clearQueue,
        hasActiveUploads,
        showLeaveModal,
        promptLeaveConfirmation,
        confirmLeave,
        cancelLeave,
        STAGES,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export const useUploadContext = () => {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUploadContext must be inside UploadProvider');
  return ctx;
};
