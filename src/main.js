import { Worker } from 'worker_threads';
import os from 'os';

const numCPUs = os.cpus().length;

export async function runOnChunkedThreads(workerScript, tasks, sharedData = {}) {
  const chunkSize = Math.ceil(tasks.length / numCPUs);
  const chunks = [];

  for (let i = 0; i < tasks.length; i += chunkSize) {
    chunks.push(tasks.slice(i, i + chunkSize));
  }

  const workers = chunks.map((chunk) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerScript, {
        workerData: {
          tasks: chunk,
          sharedData
        }
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  });

  const results = await Promise.all(workers);
  return results.flat();
}
