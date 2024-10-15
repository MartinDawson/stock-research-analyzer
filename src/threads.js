import { Worker } from 'worker_threads';
import os from 'os';
import { progressBar } from './progressBar.js';

const numCPUs = os.cpus().length;

export async function runOnChunkedThreads(workerScript, tasks, sharedData = {}) {
  const chunkSize = Math.ceil(tasks.length / numCPUs);
  const chunks = [];

  for (let i = 0; i < tasks.length; i += chunkSize) {
    chunks.push(tasks.slice(i, i + chunkSize));
  }

  let completedTasks = 0;

  const totalTasks = tasks.length;

  progressBar.start(totalTasks, 0, {
    speed: "N/A"
  });

  const workers = chunks.map((chunk, index) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerScript, {
        workerData: {
          tasks: chunk,
          sharedData,
          workerId: index
        }
      });

      worker.on('message', (message) => {
        if (message.type === 'progress') {
          completedTasks += message.increment;
          const speed = completedTasks / ((Date.now() - startTime) / 1000);
          progressBar.update(completedTasks, {
            speed: speed.toFixed(2)
          });
        } else if (message.type === 'result') {
          resolve(message.data);
        }
      });

      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  });

  const startTime = Date.now();
  const results = await Promise.all(workers);

  progressBar.stop();

  console.log(`\nCompleted ${completedTasks} out of ${totalTasks} tasks.`);
  console.log(`Total time: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`);

  return results.flat();
}