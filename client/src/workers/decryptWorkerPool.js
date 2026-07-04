// Pool of Web Workers — handles concurrent decrypts without thread explosion

const POOL_SIZE = 2;
const _workers = [];
const _queue = []; // tasks waiting for worker: { resolve, reject, payload }
const _activeTasks = new Map(); // workerIndex -> task

for (let i = 0; i < POOL_SIZE; i++) {
  const worker = new Worker(
    new URL('./decrypt.worker.js', import.meta.url),
    { type: 'module' }
  );

  worker.onmessage = (e) => {
    const { success, buffer, error } = e.data;
    const task = _activeTasks.get(i);
    _activeTasks.delete(i);

    if (task) {
      if (success) {
        task.resolve(buffer);
      } else {
        task.reject(new Error(error || 'Worker decryption failed'));
      }
    }

    _processQueue();
  };

  worker.onerror = (err) => {
    const task = _activeTasks.get(i);
    _activeTasks.delete(i);
    if (task) {
      task.reject(new Error(err.message || 'Worker error'));
    }
    _processQueue();
  };

  _workers.push(worker);
}

function _processQueue() {
  if (_queue.length === 0) return;

  // Find a free worker (worker not currently processing a task)
  const freeWorkerIdx = _workers.findIndex((_, i) => !_activeTasks.has(i));
  if (freeWorkerIdx === -1) return; // all workers busy

  const task = _queue.shift();
  _activeTasks.set(freeWorkerIdx, task);

  try {
    _workers[freeWorkerIdx].postMessage(
      task.payload,
      [task.payload.encryptedBuffer] // transfer ownership
    );
  } catch (err) {
    _activeTasks.delete(freeWorkerIdx);
    task.reject(err);
    _processQueue();
  }
}

// Export: send decrypt job to worker pool
export function decryptInWorker(payload) {
  return new Promise((resolve, reject) => {
    _queue.push({ resolve, reject, payload });
    _processQueue();
  });
}
