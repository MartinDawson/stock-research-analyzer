import { parentPort, workerData } from 'worker_threads';
import dayjs from 'dayjs';
import { calculateReturns } from '../analyze.js';

const { tasks, sharedData } = workerData;
const { companyData, convertedSharePriceData, convertedIndexPriceData } = sharedData;

const results = tasks.map(task => {
  const { label, dateRange, status, type, dealType } = task;

  const isInDateRange = company =>
    dayjs(company.announcedDate).isAfter(dateRange.start) &&
    dayjs(company.announcedDate).isBefore(dateRange.end);

  const isCorrectAcquisitionType = (company) => {
    if (type === 'all') {
      return true;
    }

    return type === 'minority' ? company.isMinorityAcquisition : !company.isMinorityAcquisition;
  }

  const isCorrectAcquisitionStatus = (company) => {
    if (status === 'all') {
      return true;
    }

    return status === 'withdrawn/terminated' ? company.isWithdrawn : !company.isWithdrawn;
  }

  const isCorrectDealType = (company) => {
    if (dealType === 'all') {
      return true;
    }

    return company.dealTypes.some((type) => type === dealType);
  }

  const combinedPredicate = (_, i) => {
    const company = companyData[i];

    return isCorrectAcquisitionType(companyData[i]) && isCorrectDealType(company) && isCorrectAcquisitionStatus(company) && isInDateRange(company);
  }

  const filteredSharePriceData = convertedSharePriceData.filter(combinedPredicate);
  const filteredIndexPriceData = convertedIndexPriceData.filter(combinedPredicate);

  const analysisResult = calculateReturns(filteredSharePriceData, filteredIndexPriceData);

  return { label, data: analysisResult, dataCount: filteredSharePriceData.length };
});

parentPort.postMessage(results);

