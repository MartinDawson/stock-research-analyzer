import { parentPort, workerData } from 'worker_threads';
import { getFilterSharePriceIndexData } from '../acquisitionFilters.js';

const minAmountOfCompaniesInEachSampleSize = 2000;

const { tasks, sharedData } = workerData;
const { companyData, sharePriceData, indexPriceData } = sharedData;
const filterSharePriceIndexData = getFilterSharePriceIndexData(companyData, sharePriceData, indexPriceData);

const results = tasks.map(({ label, filters }) => {
  const [filteredSharePriceData, filteredIndexPriceData] = filterSharePriceIndexData(filters);
  const count = filteredSharePriceData.length;

  return {
    label,
    sharePriceData: filteredSharePriceData,
    indexPriceData: filteredIndexPriceData,
    count
  }
}).filter(({ count }) => count >= minAmountOfCompaniesInEachSampleSize)

parentPort.postMessage(results);

