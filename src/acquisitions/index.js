import fs from 'fs/promises';
import dayjs from 'dayjs';
import { Formatter, FracturedJsonOptions } from 'fracturedjsonjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { convertBadPriceDataToNull, filterOutCompaniesAndPricesWhereMarketCapIsTooSmall } from '../cleanData.js';
import { processAcquisitionData } from './processData.js';
import { runOnChunkedThreads } from '../main.js';
import { extractColumnHeaderAndData, processTimeseriesData } from '../data.js';
import { acquisitionLabelFilters } from './acquisitionFilters.js';
import { processCalculationResults } from './outputData.js';
import { colsInData } from '../consts.js';
import { parseArguments } from '../args.js'

dayjs.extend(customParseFormat);

const checkArrayLengths = (companyData, sharePriceData, indexPriceData) => {
  if (companyData.length !== sharePriceData.length
    || companyData.length !== indexPriceData.length
    || sharePriceData.length !== indexPriceData.length) {
    throw new Error(`Array lengths are not equal. companyData: ${companyData.length}, sharePriceData: ${sharePriceData.length}, indexPriceData: ${indexPriceData.length}`);
  }
}

const main = async () => {
  const args = parseArguments();
  const fileContent = await fs.readFile(args.companyDataFile, 'utf8');
  const companyData = await processAcquisitionData(fileContent);
  const sharePriceData = await processTimeseriesData(args.sharePriceDataFile, colsInData)
  const indexPriceData = await processTimeseriesData(args.indexPriceDataFile, colsInData)

  const [timeSeriesHeader, newSharePriceData] = extractColumnHeaderAndData(sharePriceData);
  const [_, newIndexPriceData] = extractColumnHeaderAndData(indexPriceData);

  checkArrayLengths(companyData, newSharePriceData, newIndexPriceData);

  const [filteredCompanyData, filteredSharePriceData, filteredIndexPriceData] = filterOutCompaniesAndPricesWhereMarketCapIsTooSmall(companyData, newSharePriceData, newIndexPriceData, args.minMarketCapForAnalyzingInM);
  const convertedSharePriceData = convertBadPriceDataToNull(filteredSharePriceData);
  const convertedIndexPriceData = convertBadPriceDataToNull(filteredIndexPriceData);

  const filterResults = (await runOnChunkedThreads(
    './src/acquisitions/workers/calculateFilteredPrices.js',
    acquisitionLabelFilters,
    { companyData: filteredCompanyData, sharePriceData: convertedSharePriceData, indexPriceData: convertedIndexPriceData }
  )).filter(({ count }) => count >= args.minAmountOfCompaniesInEachSampleSize);

  const calculationResults = await runOnChunkedThreads(
    './src/acquisitions/workers/calculateReturns.js',
    filterResults,
  );

  const allData = processCalculationResults(calculationResults, timeSeriesHeader, args.outputTopNumberCount);
  const filePath = './data/out/all_data.json';

  const options = new FracturedJsonOptions();

  options.MaxTotalLineLength = 120;
  options.MaxInlineComplexity = Infinity;

  const formatter = new Formatter();

  formatter.Options = options;

  const jsonString = formatter.Serialize(allData);

  await fs.writeFile(filePath, jsonString);

  console.log(`Data has been written to ${filePath}`);
};

main();