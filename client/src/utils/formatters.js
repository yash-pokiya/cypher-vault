/**
 * Format a byte count to a human-readable string.
 * @param {number} bytes
 * @returns {string} e.g. "4.2 MB"
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Format an ISO date string to a short readable date.
 * @param {string} iso
 * @returns {string} e.g. "Jul 3, 2025"
 */
export const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Truncate a string to maxLen characters, appending '…' if truncated.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export const truncate = (str, maxLen = 40) =>
  str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
