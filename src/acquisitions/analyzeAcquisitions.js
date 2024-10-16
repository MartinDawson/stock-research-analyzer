import path from 'path';
import { convertBadPriceDataToNull, filterOutCompaniesAndPricesWhereMarketCapIsTooSmall } from '../cleanData.js';
import { runOnChunkedThreads } from '../threads.js';
import { extractColumnHeaderAndData } from '../data.js';
import { acquisitionFilters } from './acquisitionFilters.js';
import { processCalculationResults } from './outputData.js';
import { rootDirPath } from '../utils.js';

const workerFolderPath = path.join(rootDirPath, 'src/acquisitions/workers');

const checkArrayLengths = (companyData, sharePriceData, indexPriceData) => {
  if (companyData.length !== sharePriceData.length
    || companyData.length !== indexPriceData.length
    || sharePriceData.length !== indexPriceData.length) {
    throw new Error(`Array lengths are not equal. companyData: ${companyData.length}, sharePriceData: ${sharePriceData.length}, indexPriceData: ${indexPriceData.length}`);
  }
}

export const analyzeAcquisitions = async (companyData, sharePriceData, indexPriceData, {
  minMarketCapForAnalyzingInM,
  outputTopNumberCount,
  minAmountOfCompaniesInEachSampleSizeForTopOutput,
}) => {
  const [timeSeriesHeader, newSharePriceData] = extractColumnHeaderAndData(sharePriceData);
  const [_, newIndexPriceData] = extractColumnHeaderAndData(indexPriceData);

  checkArrayLengths(companyData, newSharePriceData, newIndexPriceData);

  const [filteredCompanyData, filteredSharePriceData, filteredIndexPriceData] = filterOutCompaniesAndPricesWhereMarketCapIsTooSmall(companyData, newSharePriceData, newIndexPriceData, minMarketCapForAnalyzingInM);
  const convertedSharePriceData = convertBadPriceDataToNull(filteredSharePriceData);
  const convertedIndexPriceData = convertBadPriceDataToNull(filteredIndexPriceData);

  const filterResults = (await runOnChunkedThreads(
    `${workerFolderPath}/calculateFilteredPrices.js`,
    [acquisitionFilters[0]],
    { companyData: filteredCompanyData, sharePriceData: convertedSharePriceData, indexPriceData: convertedIndexPriceData }
  ))

  const filteredResultsWithData = filterResults.filter(({ count }) => count != 0);

  const calculationResults = await runOnChunkedThreads(
    `${workerFolderPath}/calculateReturns.js`,
    filteredResultsWithData,
  );

  const processedCalculationResults = processCalculationResults(calculationResults, timeSeriesHeader, outputTopNumberCount, minAmountOfCompaniesInEachSampleSizeForTopOutput);

  return processedCalculationResults;
}
