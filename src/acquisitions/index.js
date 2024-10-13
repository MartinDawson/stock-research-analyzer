import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { convertAndFilterPriceData } from '../cleanData.js';
import { processAcquisitionData } from './processData.js';
import { runOnChunkedThreads } from '../main.js';
import { extractColumnHeaderAndData, processTimeseriesData } from '../data.js';
import { acquisitionConditions } from './acquisitionConditions.js';

dayjs.extend(customParseFormat);

const cols = 35;

function checkArrayLengths(companyData, sharePriceData, indexPriceData) {
  if (companyData.length !== sharePriceData.length
    || companyData.length !== indexPriceData.length
    || sharePriceData.length !== indexPriceData.length) {
    throw new Error(`Array lengths are not equal. companyData: ${companyData.length}, sharePriceData: ${sharePriceData.length}, indexPriceData: ${indexPriceData.length}`);
  }
}

const main = async () => {
  const companyData = await processAcquisitionData(process.argv[2]);
  const sharePriceData = await processTimeseriesData(process.argv[3], cols)
  const indexPriceData = await processTimeseriesData(process.argv[4], cols)

  const [timeSeriesHeader, newSharePriceData] = extractColumnHeaderAndData(sharePriceData);
  const [_, newIndexPriceData] = extractColumnHeaderAndData(indexPriceData);

  checkArrayLengths(companyData, newSharePriceData, newIndexPriceData);

  const convertedSharePriceData = convertAndFilterPriceData(newSharePriceData);
  const convertedIndexPriceData = convertAndFilterPriceData(newIndexPriceData);

  const results = await runOnChunkedThreads(
    './src/acquisitions/analyzeDataWorker.js',
    acquisitionConditions,
    { companyData, convertedSharePriceData, convertedIndexPriceData }
  );

  results.forEach(({ label, data, dataCount }) => {
    const [avgCumulativeAbnormalReturns, countPerMonth] = data;
    const month0Value = avgCumulativeAbnormalReturns[5];

    console.log('Total count of data:', dataCount);

    const tableData = avgCumulativeAbnormalReturns.map((returnValue, index) => ({
      Month: timeSeriesHeader[index],
      Count: countPerMonth[index],
      'Avg Cumulative Abnormal Return': returnValue !== null
        ? `${(returnValue * 100).toFixed(2)}%`
        : 'N/A',
      'Max Drawdown Since Acquisition Announcement': index >= 5 ? `${((returnValue - month0Value) * 100).toFixed(2)}%` : 'N/A',
    }));

    console.log(label);
    console.table(tableData);
  });
};

main();