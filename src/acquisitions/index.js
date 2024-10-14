import fs from 'fs/promises';
import dayjs from 'dayjs';
import { Formatter, FracturedJsonOptions } from 'fracturedjsonjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { convertAndFilterOutBadPriceData } from '../cleanData.js';
import { processAcquisitionData } from './processData.js';
import { runOnChunkedThreads } from '../main.js';
import { extractColumnHeaderAndData, processTimeseriesData } from '../data.js';
import { acquisitionLabelFilters } from './acquisitionFilters.js';
import { processCalculationResults } from './outputData.js';

dayjs.extend(customParseFormat);

const cols = 35;

const checkArrayLengths = (companyData, sharePriceData, indexPriceData) => {
  if (companyData.length !== sharePriceData.length
    || companyData.length !== indexPriceData.length
    || sharePriceData.length !== indexPriceData.length) {
    throw new Error(`Array lengths are not equal. companyData: ${companyData.length}, sharePriceData: ${sharePriceData.length}, indexPriceData: ${indexPriceData.length}`);
  }
}

const main = async () => {
  const fileContent = await fs.readFile(process.argv[2], 'utf8');
  const companyData = await processAcquisitionData(fileContent);
  const sharePriceData = await processTimeseriesData(process.argv[3], cols)
  const indexPriceData = await processTimeseriesData(process.argv[4], cols)

  const [timeSeriesHeader, newSharePriceData] = extractColumnHeaderAndData(sharePriceData);
  const [_, newIndexPriceData] = extractColumnHeaderAndData(indexPriceData);

  checkArrayLengths(companyData, newSharePriceData, newIndexPriceData);

  const convertedSharePriceData = convertAndFilterOutBadPriceData(newSharePriceData);
  const convertedIndexPriceData = convertAndFilterOutBadPriceData(newIndexPriceData);

  const filterResults = await runOnChunkedThreads(
    './src/acquisitions/workers/calculateFilteredPrices.js',
    acquisitionLabelFilters,
    { companyData, sharePriceData: convertedSharePriceData, indexPriceData: convertedIndexPriceData }
  );

  const calculationResults = await runOnChunkedThreads(
    './src/acquisitions/workers/calculateReturns.js',
    filterResults,
  );

  const allData = processCalculationResults(calculationResults, timeSeriesHeader);
  const filePath = './data/out/all_data.json';

  const options = new FracturedJsonOptions();

  options.MaxTotalLineLength = 120;
  options.MaxInlineComplexity = Infinity; // This should keep arrays on one line

  const formatter = new Formatter();

  formatter.Options = options;

  const jsonString = formatter.Serialize(allData);

  await fs.writeFile(filePath, jsonString);

  console.log(`Data has been written to ${filePath}`);
};

main();