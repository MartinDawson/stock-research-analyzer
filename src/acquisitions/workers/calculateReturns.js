import { parentPort, workerData } from 'worker_threads';
import { calculateReturns } from '../../calculate.js';

const { tasks } = workerData;

const results = [];

for (const task of tasks) {
  const { sharePriceData, indexPriceData, ...newTask } = task;
  const data = calculateReturns(sharePriceData, indexPriceData);

  results.push({ ...newTask, data });

  parentPort.postMessage({ type: 'progress', increment: 1 });
}

parentPort.postMessage({ type: 'result', data: results });