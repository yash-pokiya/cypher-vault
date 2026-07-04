// Pool of 2 workers — handles concurrent decrypts without thread explosion

const POOL_SIZE = 2;
const _workers = [];
const _queue = []; // { resolve, reject, payload }
const _busy = new Set(); // worker indices currently working

// Initialize workers
for (let i = 0; i < POOL_SIZE; i++) {
  const worker = new Worker(
    new URL('./decrypt.worker.js', import.meta.url),
    { type: 'module' }
  );

  worker.onmessage = (e) => {
    const { fileId, success, buffer, error } = e.data;
    _busy.delete(i);

    // Find and resolve the pending promise for this fileId
    const idx = _queue.findIndex((item) => item.payload.fileId === fileId);
    if (idx !== -1) {
      const [task] = _queue.splice(idx, 1);
      success ? task.resolve(buffer) : task.reject(new Error(error));
    }

    // Process next item in queue if any
    _processQueue();
  };

  _workers.push(worker);
}

function _processQueue() {
  if (_queue.length === 0) return;

  // Find a free worker
  const freeWorkerIdx = _workers.findIndex((_, i) => !_busy.has(i));
  if (freeWorkerIdx === -1) return; // all busy

  const task = _queue.shift();
  _busy.add(freeWorkerIdx);

  _workers[freeWorkerIdx].postMessage(
    task.payload,
    [task.payload.encryptedBuffer] // transfer ownership
  );
}

// Export: send decrypt job to worker pool
export function decryptInWorker(payload) {
  return new Promise((resolve, reject) => {
    _queue.push({ resolve, reject, payload });
    _processQueue();
  });
}
