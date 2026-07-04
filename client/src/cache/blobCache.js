// Stores decrypted image blobs as ObjectURLs in memory
// Max 50 entries — LRU eviction to prevent memory bloat
// Clears automatically on logout

const MAX_ENTRIES = 50;
const _cache = new Map(); // fileId → { objectUrl, size, lastAccessed }

export function getCachedBlob(fileId) {
  const entry = _cache.get(fileId);
  if (!entry) return null;
  entry.lastAccessed = Date.now(); // update LRU
  return entry.objectUrl;
}

export function setCachedBlob(fileId, objectUrl, size = 0) {
  // Evict oldest entry if at capacity
  if (_cache.size >= MAX_ENTRIES) {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [key, val] of _cache) {
      if (val.lastAccessed < oldestTime) {
        oldestTime = val.lastAccessed;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      // Revoke the ObjectURL before evicting — prevent memory leak
      URL.revokeObjectURL(_cache.get(oldestKey).objectUrl);
      _cache.delete(oldestKey);
    }
  }

  _cache.set(fileId, { objectUrl, size, lastAccessed: Date.now() });
}

export function invalidateBlob(fileId) {
  const entry = _cache.get(fileId);
  if (entry) {
    URL.revokeObjectURL(entry.objectUrl);
    _cache.delete(fileId);
  }
}

export function clearAllBlobs() {
  for (const entry of _cache.values()) {
    URL.revokeObjectURL(entry.objectUrl);
  }
  _cache.clear();
}
