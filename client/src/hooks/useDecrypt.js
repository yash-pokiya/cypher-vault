import { useState, useCallback } from 'react';
import { unwrapFileKey } from '../crypto/keyWrapping';
import { decryptFile } from '../crypto/fileEncryption';
import { fromBase64 } from '../crypto/keyDerivation';
import { useCryptoContext } from '../context/CryptoContext';
import { fileAPI } from '../api/file.api';

export const useDecrypt = () => {
  const { getMasterKeyForSalt } = useCryptoContext();
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState(null);

  /**
   * Full decrypt pipeline for a single file.
   * Returns { objectUrl, mimeType, filename, size, revoke }.
   * Caller MUST call revoke() when done to free the object URL.
   */
  const decrypt = useCallback(
    async (fileId) => {
      setDecrypting(true);
      setDecryptError(null);

      try {
        // 1. Fetch metadata + 1-hour signed Cloudinary URL from backend
        const { data: metaRes } = await fileAPI.getMetadata(fileId);
        const meta = metaRes.data?.file || metaRes.data;

        // 2. Download encrypted blob via signed URL — no auth header needed
        //    (signature is embedded in the URL)
        const blobRes = await fetch(meta.signedUrl);
        if (!blobRes.ok) throw new Error(`Download failed: ${blobRes.status}`);
        const encryptedBuffer = await blobRes.arrayBuffer();

        // 3. Derive MasterKey for this file's salt (cached after first call)
        const masterKey = await getMasterKeyForSalt(meta.salt);

        // 4. Unwrap FileKey — throws if wrong password (AES-KW fails)
        const fileKey = await unwrapFileKey(masterKey, meta.wrappedFileKey);

        // 5. Decrypt — throws DOMException if GCM auth tag invalid
        const iv        = fromBase64(meta.iv);
        const plaintext = await decryptFile(encryptedBuffer, fileKey, iv);

        // 6. Create ephemeral object URL — never persisted
        const blob      = new Blob([plaintext], { type: meta.mimeType });
        const objectUrl = URL.createObjectURL(blob);

        return {
          objectUrl,
          mimeType:  meta.mimeType,
          filename:  meta.filename,
          size:      meta.size,
          revoke:    () => URL.revokeObjectURL(objectUrl),
        };
      } catch (err) {
        const msg = err.message || 'Decryption failed';
        setDecryptError(msg);
        throw new Error(msg);
      } finally {
        setDecrypting(false);
      }
    },
    [getMasterKeyForSalt]
  );

  return { decrypt, decrypting, decryptError };
};
