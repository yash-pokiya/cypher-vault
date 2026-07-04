import { useState, useCallback } from 'react';
import { generateFileKey, encryptFile } from '../crypto/fileEncryption';
import { generateSalt, toBase64 } from '../crypto/keyDerivation';
import { wrapFileKey } from '../crypto/keyWrapping';
import { useCryptoContext } from '../context/CryptoContext';
import { fileAPI } from '../api/file.api';

export const STAGES = {
  QUEUED:     'queued',
  ENCRYPTING: 'encrypting',
  UPLOADING:  'uploading',
  DONE:       'done',
  ERROR:      'error',
};

export const useEncryptedUpload = () => {
  const { getMasterKeyForSalt } = useCryptoContext();
  const [queue, setQueue] = useState([]);

  const updateItem = useCallback((id, updates) =>
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...updates } : item))),
  []);

  const uploadFiles = useCallback(
    async (files, folder = '', folderId = null) => {
      const items = Array.from(files).map((file) => ({
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        file,
        stage: STAGES.QUEUED,
        progress: 0,
        error: null,
      }));

      setQueue((q) => [...q, ...items]);

      for (const item of items) {
        try {
          // ── Stage 1: Encrypt in browser ──────────────────────────────────
          updateItem(item.id, { stage: STAGES.ENCRYPTING, progress: 10 });

          const fileBuffer = await item.file.arrayBuffer();
          const fileKey    = await generateFileKey();
          const salt       = generateSalt();
          const saltB64    = toBase64(salt);

          const { ciphertext, iv } = await encryptFile(fileBuffer, fileKey);
          const ivB64 = toBase64(iv);

          updateItem(item.id, { progress: 50 });

          const masterKey    = await getMasterKeyForSalt(saltB64);
          const wrappedKeyB64 = await wrapFileKey(masterKey, fileKey);

          // ── Stage 2: Upload encrypted blob ────────────────────────────────
          updateItem(item.id, { stage: STAGES.UPLOADING, progress: 0 });

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

          await fileAPI.upload(formData, (pct) => updateItem(item.id, { progress: pct }));

          updateItem(item.id, { stage: STAGES.DONE, progress: 100 });
        } catch (err) {
          updateItem(item.id, { stage: STAGES.ERROR, error: err.message || 'Upload failed' });
        }
      }
    },
    [getMasterKeyForSalt, updateItem]
  );

  const clearQueue     = useCallback(() => setQueue([]), []);
  const clearCompleted = useCallback(() =>
    setQueue((q) => q.filter((i) => i.stage !== STAGES.DONE)), []);

  return { queue, uploadFiles, clearQueue, clearCompleted, STAGES };
};
