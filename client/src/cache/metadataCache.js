// In-memory cache for file metadata + signed URLs
// Lives in module scope — cleared on page unload automatically
// No localStorage, no sessionStorage — pure JS Map

const _metaCache = new Map();
// Structure: fileId → { wrappedFileKey, iv, salt, signedUrl, signedUrlExpiry, mimeType, filename }

const SIGNED_URL_TTL_MS = 50 * 60 * 1000; // 50 min (Cloudinary signs for 60min, refresh at 50)

export function getCachedMeta(fileId) {
  const entry = _metaCache.get(fileId);
  if (!entry) return null;

  // Check if signedUrl is still valid (50 min TTL)
  if (Date.now() > entry.signedUrlExpiry) {
    // Signed URL expired — keep crypto fields, clear URL so it refreshes
    const { signedUrl, signedUrlExpiry, ...rest } = entry;
    _metaCache.set(fileId, { ...rest, signedUrl: null, signedUrlExpiry: 0 });
    return { ...rest, signedUrl: null };
  }

  return entry;
}

export function setCachedMeta(fileId, meta) {
  _metaCache.set(fileId, {
    ...meta,
    signedUrlExpiry: Date.now() + SIGNED_URL_TTL_MS,
  });
}

export function invalidateMeta(fileId) {
  _metaCache.delete(fileId);
}

export function clearAllMeta() {
  _metaCache.clear();
}
