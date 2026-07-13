import { useState, useEffect, useCallback, useRef } from 'react';
import { getMasterKey, restoreMasterKeyFromSession } from '../crypto/keyStorage';
import { unwrapFileKey } from '../crypto/keyWrapping';
import { exportFileKeyAsJwk } from '../crypto/fileEncryption';
import { decryptInWorker } from '../workers/decryptWorkerPool';
import { getCachedMeta, setCachedMeta } from '../cache/metadataCache';
import { getCachedBlob, setCachedBlob } from '../cache/blobCache';
import { fileAPI } from '../api/file.api';

const MAX_CONCURRENT = 3;

/**
 * Auto-decrypts all file thumbnails in background when vault is unlocked.
 * Returns a reactive map of { fileId → objectUrl } that updates progressively.
 */
export function useBatchDecrypt(files, isVaultUnlocked) {
  const [thumbnails, setThumbnails] = useState({});    // { fileId: objectUrl }
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const abortRef = useRef(false);
  const queueRef = useRef(null);

  // Populate thumbnails from cache immediately
  useEffect(() => {
    const cached = {};
    for (const file of files) {
      const url = getCachedBlob(file._id);
      if (url) cached[file._id] = url;
    }
    if (Object.keys(cached).length > 0) {
      setThumbnails(prev => ({ ...prev, ...cached }));
    }
  }, [files]);

  // Decrypt a single file — returns objectUrl or null on failure
  const decryptOne = useCallback(async (fileId) => {
    // Already cached?
    const cachedUrl = getCachedBlob(fileId);
    if (cachedUrl) return cachedUrl;

    try {
      let masterKey = getMasterKey();
      if (!masterKey) masterKey = await restoreMasterKeyFromSession();
      if (!masterKey) return null;

      // Fetch metadata
      let meta = getCachedMeta(fileId);
      let signedUrl = meta?.signedUrl;

      if (!meta || !signedUrl) {
        const { data: res } = await fileAPI.getMetadata(fileId);
        const freshMeta = res.file || res.data?.file || res.data || res;
        setCachedMeta(fileId, freshMeta);
        meta = freshMeta;
        signedUrl = freshMeta.signedUrl;
      }

      // Unwrap file key
      const fileKey = await unwrapFileKey(masterKey, meta.wrappedFileKey);
      const fileKeyJwk = await exportFileKeyAsJwk(fileKey);

      // Fetch encrypted blob
      const response = await fetch(signedUrl);
      if (!response.ok) return null;
      const encryptedBuffer = await response.arrayBuffer();

      // Decrypt in worker
      const decryptedBuffer = await decryptInWorker({
        fileId,
        encryptedBuffer,
        fileKeyJwk,
        ivBase64: meta.iv,
      });

      // Create blob URL & cache
      const blob = new Blob([decryptedBuffer], { type: meta.mimeType || 'image/jpeg' });
      const objectUrl = URL.createObjectURL(blob);
      setCachedBlob(fileId, objectUrl, decryptedBuffer.byteLength);
      return objectUrl;
    } catch {
      return null; // Silent fail — show lock icon instead
    }
  }, []);

  // Run batch decrypt with concurrency limit
  useEffect(() => {
    if (!isVaultUnlocked || files.length === 0) return;

    abortRef.current = false;

    // Find files that need decrypting (not already cached)
    const toDecrypt = files.filter(f => !getCachedBlob(f._id));
    if (toDecrypt.length === 0) {
      setProgress({ done: files.length, total: files.length });
      return;
    }

    setProgress({ done: files.length - toDecrypt.length, total: files.length });

    // Concurrent queue
    let idx = 0;
    let doneCount = files.length - toDecrypt.length;

    const runNext = async () => {
      while (idx < toDecrypt.length && !abortRef.current) {
        const current = idx++;
        const file = toDecrypt[current];

        const objectUrl = await decryptOne(file._id);
        if (abortRef.current) return;

        if (objectUrl) {
          setThumbnails(prev => ({ ...prev, [file._id]: objectUrl }));
        }
        doneCount++;
        setProgress({ done: doneCount, total: files.length });
      }
    };

    // Start MAX_CONCURRENT workers
    const workers = [];
    for (let i = 0; i < Math.min(MAX_CONCURRENT, toDecrypt.length); i++) {
      workers.push(runNext());
    }

    queueRef.current = Promise.all(workers);

    return () => {
      abortRef.current = true;
    };
  }, [files, isVaultUnlocked, decryptOne]);

  return { thumbnails, progress };
}
