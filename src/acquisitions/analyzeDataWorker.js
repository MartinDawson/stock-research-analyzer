import { parentPort, workerData } from 'worker_threads';
import dayjs from 'dayjs';
import { calculateReturns } from '../analyze.js';

const groupByBuyerIdentifier = (records) => {
  return records.reduce((grouped, row) => {
    const buyerId = row.buyer.identifier;

    if (!grouped[buyerId]) {
      grouped[buyerId] = [];
    }

    grouped[buyerId].push(row);

    return grouped;
  }, {});
}

const { tasks, sharedData } = workerData;
const { companyData, convertedSharePriceData, convertedIndexPriceData } = sharedData;
const uniqueCompaniesAcquisitionsData = groupByBuyerIdentifier(companyData);

const results = tasks.map(task => {
  const { label, dateRange, status, type, dealType, publicOrPrivate, sizeByTransactionValue, acquisitionsNumber } = task;

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

  const isCorrectAcquisitionPublicOrPrivate = (company) => {
    if (publicOrPrivate === 'all') {
      return true;
    }

    return publicOrPrivate === 'public' ? company.isPublicCompany : !company.isPublicCompany;
  }

  const isCorrectNumberOfAcquisitions = (company) => {
    const identifier = company.buyer.identifier;
    const numberOfAcquisitions = uniqueCompaniesAcquisitionsData[identifier].length;

    if (acquisitionsNumber === '1') {
      return numberOfAcquisitions === 1;
    }

    if (acquisitionsNumber === '2-5') {
      return numberOfAcquisitions >= 2 && numberOfAcquisitions < 5;
    }

    if (acquisitionsNumber === '5-20') {
      return numberOfAcquisitions >= 5 && numberOfAcquisitions < 20;
    }

    return true;
  }

  const isCorrectSizeByTransactionValue = (company) => {
    const transactionSizeRelativeToBuyerMarketValue = company.transactionSize / buyerMarketValue;

    if (sizeByTransactionValue === '0-2%') {
      return transactionSizeRelativeToBuyerMarketValue < 0.02;
    }

    if (sizeByTransactionValue === '2-10%') {
      return transactionSizeRelativeToBuyerMarketValue >= 0.02 && transactionSizeRelativeToBuyerMarketValue < 0.1;
    }

    if (sizeByTransactionValue === '10-25%') {
      return transactionSizeRelativeToBuyerMarketValue >= 0.1 && transactionSizeRelativeToBuyerMarketValue < 0.25;
    }

    if (sizeByTransactionValue === '25-50%') {
      return transactionSizeRelativeToBuyerMarketValue >= 0.25 && transactionSizeRelativeToBuyerMarketValue < 0.5;
    }

    return true;
  }

  const isCorrectDealType = (company) => {
    if (dealType === 'all') {
      return true;
    }

    return company.dealTypes.some((type) => type === dealType);
  }

  const combinedPredicate = (_, i) => {
    const company = companyData[i];

    return isCorrectAcquisitionType(company) &&
      isCorrectDealType(company) &&
      isCorrectAcquisitionStatus(company) &&
      isCorrectNumberOfAcquisitions(company) &&
      isCorrectAcquisitionPublicOrPrivate(company) &&
      isCorrectSizeByTransactionValue(company) &&
      isInDateRange(company);
  }

  const filteredSharePriceData = convertedSharePriceData.filter(combinedPredicate);
  const filteredIndexPriceData = convertedIndexPriceData.filter(combinedPredicate);

  const analysisResult = calculateReturns(filteredSharePriceData, filteredIndexPriceData);

  return { label, data: analysisResult, dataCount: filteredSharePriceData.length };
});

parentPort.postMessage(results);

