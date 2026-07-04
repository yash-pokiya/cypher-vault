// This file runs in a separate thread — UI never freezes during decrypt

self.onmessage = async (event) => {
  const { fileId, encryptedBuffer, fileKeyJwk, ivBase64 } = event.data;

  try {
    // Re-import FileKey from JWK (CryptoKey can't be transferred between threads)
    const fileKey = await crypto.subtle.importKey(
      'jwk',
      fileKeyJwk,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Convert IV from base64 safely
    let cleanIv = (ivBase64 || '').trim().replace(/-/g, '+').replace(/_/g, '/');
    const mod = cleanIv.length % 4;
    if (mod === 2) cleanIv += '==';
    else if (mod === 3) cleanIv += '=';
    const iv = Uint8Array.from(atob(cleanIv), (c) => c.charCodeAt(0));

    // Decrypt — this is the heavy operation, now off main thread
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      fileKey,
      encryptedBuffer
    );

    // Transfer the buffer back (zero-copy — no cloning)
    self.postMessage(
      { fileId, success: true, buffer: decryptedBuffer },
      [decryptedBuffer] // transferable — moves ownership, no copy
    );
  } catch (err) {
    self.postMessage({ fileId, success: false, error: err.message });
  }
};
