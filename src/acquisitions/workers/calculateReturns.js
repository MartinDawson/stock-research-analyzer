import { parentPort, workerData } from 'worker_threads';
import { calculateReturns } from '../../calculate.js';

const { tasks } = workerData;

const results = tasks.map((task, i) => {
  const { sharePriceData, indexPriceData, ...newTask } = task;
  const data = calculateReturns(sharePriceData, indexPriceData);

  return { ...newTask, data };
});

parentPort.postMessage(results);

