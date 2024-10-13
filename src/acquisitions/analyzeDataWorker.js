import { parentPort, workerData } from 'worker_threads';
import dayjs from 'dayjs';
import { calculateReturns } from '../analyze.js';

const { tasks, sharedData } = workerData;
const { companyData, convertedSharePriceData, convertedIndexPriceData } = sharedData;

const results = tasks.map(task => {
  const { label, dateRange, acquisitionType } = task;

  const isInDateRange = company =>
    dayjs(company.announcedDate).isAfter(dateRange.start) &&
    dayjs(company.announcedDate).isBefore(dateRange.end);

  const isCorrectAcquisitionType = (_, i) =>
    acquisitionType === 'majority' ? !companyData[i].isMinorityAcquisition : companyData[i].isMinorityAcquisition;

  const combinedPredicate = (_, i) =>
    isCorrectAcquisitionType(_, i) && isInDateRange(companyData[i]);

  const filteredSharePriceData = convertedSharePriceData.filter(combinedPredicate);
  const filteredIndexPriceData = convertedIndexPriceData.filter(combinedPredicate);

  const analysisResult = calculateReturns(filteredSharePriceData, filteredIndexPriceData);

  return { label, data: analysisResult, dataCount: filteredSharePriceData.length };
});

parentPort.postMessage(results);

