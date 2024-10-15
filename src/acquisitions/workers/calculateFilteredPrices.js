import { parentPort, workerData } from 'worker_threads';
import { getFilterSharePriceIndexData } from '../acquisitionFilters.js';

const { tasks, sharedData } = workerData;
const { companyData, sharePriceData, indexPriceData } = sharedData;
const filterSharePriceIndexData = getFilterSharePriceIndexData(companyData, sharePriceData, indexPriceData);

const results = tasks.map((filters) => {
  const [filteredSharePriceData, filteredIndexPriceData] = filterSharePriceIndexData(filters);
  const count = filteredSharePriceData.length;

  return {
    filters,
    sharePriceData: filteredSharePriceData,
    indexPriceData: filteredIndexPriceData,
    count
  }
})

parentPort.postMessage(results);

