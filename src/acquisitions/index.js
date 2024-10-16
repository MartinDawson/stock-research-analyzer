import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import JSONStream from 'jsonstream';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { processAcquisitionData } from './processData.js';
import { colsInData } from '../consts.js';
import { parseArguments } from '../args.js'
import { rootDirPath } from '../utils.js';
import { analyzeAcquisitions } from './analyzeAcquisitions.js';
import { processTimeseriesData } from '../data.js';

const inputAcquisitionsPath = path.join(rootDirPath, 'data', 'input/acquisitions');
const outputAcquisitionsPath = path.join(rootDirPath, 'data', 'output/acquisitions');
const outputRawAcquisitionsPath = path.join(rootDirPath, 'data', 'outputRaw/acquisitions');

dayjs.extend(customParseFormat);

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

  const { allReturns, ...topReturns } = await analyzeAcquisitions(companyData, sharePriceData, indexPriceData, args);

  const allReturnsFilePath = `${outputRawAcquisitionsPath}/${regionToAnalyze}.json`;
  const topReturnsFilePath = `${outputAcquisitionsPath}/${regionToAnalyze}.json`;

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