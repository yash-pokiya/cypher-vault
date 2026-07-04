import toast from 'react-hot-toast';

/**
 * Wraps an async operation with slow network / heavy crypto detection (>2.0s).
 * Displays a helpful notice if the operation takes longer than expected.
 */
export async function withSlowNotice(promise, customMsg) {
  let toastId = null;
  const timer = setTimeout(() => {
    toastId = toast.loading(
      customMsg || 'Still working… Secure operations may take longer because files are encrypted.',
      { duration: 5000 }
    );
  }, 2000);

  try {
    const result = await promise;
    return result;
  } finally {
    clearTimeout(timer);
    if (toastId) {
      toast.dismiss(toastId);
    }
  }
}
