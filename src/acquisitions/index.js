import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import JSONStream from 'jsonstream';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { convertBadPriceDataToNull, filterOutCompaniesAndPricesWhereMarketCapIsTooSmall } from '../cleanData.js';
import { processAcquisitionData } from './processData.js';
import { runOnChunkedThreads } from '../threads.js';
import { extractColumnHeaderAndData, processTimeseriesData } from '../data.js';
import { acquisitionFilters } from './acquisitionFilters.js';
import { processCalculationResults } from './outputData.js';
import { colsInData } from '../consts.js';
import { parseArguments } from '../args.js'
import { rootDirPath } from '../utils.js';

const inputAcquisitionsPath = path.join(rootDirPath, 'data', 'input/acquisitions');
const outputAcquisitionsPath = path.join(rootDirPath, 'data', 'output/acquisitions');
const outputRawAcquisitionsPath = path.join(rootDirPath, 'data', 'outputRaw/acquisitions');

const workerFolderPath = path.join(rootDirPath, 'src/acquisitions/workers');

dayjs.extend(customParseFormat);

const checkArrayLengths = (companyData, sharePriceData, indexPriceData) => {
  if (companyData.length !== sharePriceData.length
    || companyData.length !== indexPriceData.length
    || sharePriceData.length !== indexPriceData.length) {
    throw new Error(`Array lengths are not equal. companyData: ${companyData.length}, sharePriceData: ${sharePriceData.length}, indexPriceData: ${indexPriceData.length}`);
  }
}

// Needed due to the output being large to stop out of memory errors
const streamJsonToFile = async (data, filePath) => {
  const readableStream = Readable.from([data]);
  const jsonStringify = JSONStream.stringify();

  let fileHandle;
  try {
    fileHandle = await fs.open(filePath, 'w');
    const writeStream = createWriteStream(null, { fd: fileHandle.fd });

    await pipeline(
      readableStream,
      jsonStringify,
      writeStream
    );
    fileHandle = null;
  } finally {
    if (fileHandle) {
      await fileHandle.close();
    }
  }
};

const writeJsonToFile = async (data, filePath) => {
  const jsonString = JSON.stringify(data, null, 2);

  await fs.writeFile(filePath, jsonString, 'utf8');
};

const main = async () => {
  const args = parseArguments();
  const regionToAnalyze = args.regionToAnalyze;

  const inputCompanyDataFile = `${inputAcquisitionsPath}/${regionToAnalyze}/companies_data.csv`;
  const fileContent = await fs.readFile(inputCompanyDataFile, 'utf8');
  const companyData = await processAcquisitionData(fileContent);

  const sharePriceDataPath = `${inputAcquisitionsPath}/${regionToAnalyze}/acquirer_share_prices.csv`;
  const sharePriceData = await processTimeseriesData(sharePriceDataPath, colsInData)

  const indexPriceDataPath = `${inputAcquisitionsPath}/${regionToAnalyze}/acquirer_index_prices.csv`;
  const indexPriceData = await processTimeseriesData(indexPriceDataPath, colsInData)

  const [timeSeriesHeader, newSharePriceData] = extractColumnHeaderAndData(sharePriceData);
  const [_, newIndexPriceData] = extractColumnHeaderAndData(indexPriceData);

  checkArrayLengths(companyData, newSharePriceData, newIndexPriceData);

  const [filteredCompanyData, filteredSharePriceData, filteredIndexPriceData] = filterOutCompaniesAndPricesWhereMarketCapIsTooSmall(companyData, newSharePriceData, newIndexPriceData, args.minMarketCapForAnalyzingInM);
  const convertedSharePriceData = convertBadPriceDataToNull(filteredSharePriceData);
  const convertedIndexPriceData = convertBadPriceDataToNull(filteredIndexPriceData);

  const filterResults = (await runOnChunkedThreads(
    `${workerFolderPath}/calculateFilteredPrices.js`,
    acquisitionFilters,
    { companyData: filteredCompanyData, sharePriceData: convertedSharePriceData, indexPriceData: convertedIndexPriceData, minMarketCapForAnalyzingInM: args.minMarketCapForAnalyzingInM }
  ))

  const filteredResultsWithData = filterResults.filter(({ count }) => count != 0);

  const calculationResults = await runOnChunkedThreads(
    `${workerFolderPath}/calculateReturns.js`,
    filteredResultsWithData,
  );

  const { allReturns, ...topReturns } = processCalculationResults(calculationResults, timeSeriesHeader, args.outputTopNumberCount, args.minAmountOfCompaniesInEachSampleSizeForTopOutput);
  const allReturnsFilePath = `${outputRawAcquisitionsPath}/acquisitions_${regionToAnalyze}.json`;
  const topReturnsFilePath = `${outputAcquisitionsPath}/acquisitions_${regionToAnalyze}.json`;

  console.log(`Streaming output for all raw returns to ${allReturnsFilePath} & top returns to ${topReturnsFilePath}`);

  // Use streamJsonToFile for allReturns (large dataset)
  // Use writeJsonToFile for topReturns (small object)
  await Promise.all([
    streamJsonToFile(allReturns, allReturnsFilePath),
    writeJsonToFile(topReturns, topReturnsFilePath)
  ]);

  console.log(`Data has been written to ${allReturnsFilePath} & ${topReturnsFilePath}`);

  process.exit(0);
};

main();