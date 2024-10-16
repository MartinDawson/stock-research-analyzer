import { parentPort, workerData } from 'worker_threads';
import { getFilterSharePriceIndexData } from '../acquisitionFilters.js';

const { tasks, sharedData } = workerData;
const { companyData, sharePriceData, indexPriceData } = sharedData;
const filterSharePriceIndexData = getFilterSharePriceIndexData(companyData, sharePriceData, indexPriceData);

const results = [];

for (const filters of tasks) {
  const [filteredSharePriceData, filteredIndexPriceData] = filterSharePriceIndexData(filters);
  const count = filteredSharePriceData.length;

  results.push({
    filters,
    sharePriceData: filteredSharePriceData,
    indexPriceData: filteredIndexPriceData,
    count
  });

  parentPort.postMessage({ type: 'progress', increment: 1 });
}

parentPort.postMessage({ type: 'result', data: results });