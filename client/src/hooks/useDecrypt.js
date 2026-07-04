import { useState, useCallback } from 'react';
import { getMasterKey, restoreMasterKeyFromSession } from '../crypto/keyStorage';
import { unwrapFileKey } from '../crypto/keyWrapping';
import { exportFileKeyAsJwk } from '../crypto/fileEncryption';
import { decryptInWorker } from '../workers/decryptWorkerPool';
import { getCachedMeta, setCachedMeta } from '../cache/metadataCache';
import { getCachedBlob, setCachedBlob } from '../cache/blobCache';
import { fileAPI } from '../api/file.api';

// Track in-flight decrypts — prevent duplicate requests for same image
const _inFlight = new Map(); // fileId → Promise<objectUrl>

export function useDecrypt() {
  const [decryptingIds, setDecryptingIds] = useState(new Set());
  const [decryptError, setDecryptError] = useState(null);


  const decrypt = useCallback(async (fileId) => {
    setDecryptError(null);

    // ── CACHE HIT: already decrypted this session ─────────────
    const cachedUrl = getCachedBlob(fileId);
    if (cachedUrl) {
      const meta = getCachedMeta(fileId);
      return {
        objectUrl: cachedUrl,
        mimeType: meta?.mimeType,
        filename: meta?.filename,
        size: meta?.size,
        revoke: () => {}, // Managed by blobCache
      };
    }

    // ── DEDUPLICATE: if already decrypting this file, wait for it ──
    if (_inFlight.has(fileId)) {
      const objectUrl = await _inFlight.get(fileId);
      const meta = getCachedMeta(fileId);
      return {
        objectUrl,
        mimeType: meta?.mimeType,
        filename: meta?.filename,
        size: meta?.size,
        revoke: () => {},
      };
    }

    // ── START DECRYPT ─────────────────────────────────────────
    const promise = (async () => {
      setDecryptingIds((prev) => new Set(prev).add(fileId));

      try {
        // Try in-memory first, then fall back to sessionStorage restore
        let masterKey = getMasterKey();
        if (!masterKey) {
          masterKey = await restoreMasterKeyFromSession();
        }
        if (!masterKey) throw new Error('Vault is locked. Please unlock first.');

        // STEP 1: Metadata (cached or fetch)
        let meta = getCachedMeta(fileId);
        let signedUrl = meta?.signedUrl;

        if (!meta || !signedUrl) {
          // Fetch from backend — returns wrappedFileKey, iv, salt, signedUrl
          const { data: res } = await fileAPI.getMetadata(fileId);
          const freshMeta = res.file || res.data?.file || res.data || res;
          setCachedMeta(fileId, freshMeta);
          meta = freshMeta;
          signedUrl = freshMeta.signedUrl;
        }

        // STEP 2: Unwrap FileKey — fast (~10ms), stays on main thread
        const fileKey = await unwrapFileKey(masterKey, meta.wrappedFileKey);

        // STEP 3: Export FileKey as JWK for worker transfer
        const fileKeyJwk = await exportFileKeyAsJwk(fileKey);

        // STEP 4: Fetch encrypted blob without custom headers to avoid CORS preflight errors
        const response = await fetch(signedUrl);

        if (!response.ok) {
          throw new Error(`Blob fetch failed: ${response.status}`);
        }

        const encryptedBuffer = await response.arrayBuffer();

        // STEP 5: Decrypt in Web Worker — UI stays responsive
        const decryptedBuffer = await decryptInWorker({
          fileId,
          encryptedBuffer, // transferred (zero copy)
          fileKeyJwk,
          ivBase64: meta.iv,
        });

        // STEP 6: Create ObjectURL from decrypted bytes
        const blob = new Blob([decryptedBuffer], { type: meta.mimeType || 'image/jpeg' });
        const objectUrl = URL.createObjectURL(blob);

        // STEP 7: Cache the result
        setCachedBlob(fileId, objectUrl, decryptedBuffer.byteLength);

        return objectUrl;
      } catch (err) {
        const isBadKey = err.name === 'OperationError' || err.message?.includes('OperationError');
        const msg = isBadKey
          ? 'Decryption failed — this file may have been encrypted with a different vault password.'
          : err.message || 'Decryption failed';
        setDecryptError(msg);
        throw new Error(msg);
      } finally {
        setDecryptingIds((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });
        _inFlight.delete(fileId);
      }
    })();

    _inFlight.set(fileId, promise);
    const objectUrl = await promise;
    const meta = getCachedMeta(fileId);
    return {
      objectUrl,
      mimeType: meta?.mimeType,
      filename: meta?.filename,
      size: meta?.size,
      revoke: () => {},
    };
  }, []);

  const isDecrypting = useCallback(
    (fileId) => decryptingIds.has(fileId),
    [decryptingIds]
  );

  return {
    decrypt,
    isDecrypting,
    decrypting: decryptingIds.size > 0,
    decryptError,
  };
}
