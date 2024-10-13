import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';

export const extractColumnHeaderAndData = (records) => {
  const [header, ...data] = records;

  return [header, data]
}

export const processTimeseriesData = async (inputFile, numberOfCols) => {
  const fileContent = await fs.readFile(inputFile, 'utf8');
  const records = parse(fileContent, {
    cast: true,
  });
  const slicedRecords = records.map(row => row.slice(0, numberOfCols));

  return slicedRecords;
}

