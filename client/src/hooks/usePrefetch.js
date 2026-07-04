// Start decrypting when user hovers over a card — image ready before click

import { useCallback, useRef } from 'react';
import { useDecrypt } from './useDecrypt';
import { getCachedBlob } from '../cache/blobCache';

export function usePrefetch() {
  const { decrypt } = useDecrypt();
  const timersRef = useRef(new Map()); // fileId → timeoutId

  const onMouseEnter = useCallback(
    (fileId) => {
      // Don't prefetch if already cached
      if (getCachedBlob(fileId)) return;

      // Small delay — don't trigger on fast hover-throughs
      const timer = setTimeout(() => {
        decrypt(fileId).catch(() => {}); // fire and forget, ignore errors
      }, 150); // 150ms hover = intentional

      timersRef.current.set(fileId, timer);
    },
    [decrypt]
  );

  const onMouseLeave = useCallback((fileId) => {
    const timer = timersRef.current.get(fileId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(fileId);
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}
