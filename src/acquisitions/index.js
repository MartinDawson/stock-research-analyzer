import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { convertAndFilterPriceData } from '../cleanData.js';
import { processData, processTimeseriesData } from './processData.js';
import { analyzeData } from './analysis.js';
import { extractColumnHeaderAndData } from '../data.js';

dayjs.extend(customParseFormat);

function checkArrayLengths(companyData, sharePriceData, indexPriceData) {
  if (companyData.length !== sharePriceData.length
    || companyData.length !== indexPriceData.length
    || sharePriceData.length !== indexPriceData.length) {
    throw new Error(`Array lengths are not equal. companyData: ${companyData.length}, sharePriceData: ${sharePriceData.length}, indexPriceData: ${indexPriceData.length}`);
  }
}

const main = async () => {
  const companyData = await processData(process.argv[2]);
  const sharePriceData = await processTimeseriesData(process.argv[3])
  const indexPriceData = await processTimeseriesData(process.argv[4])

  const [timeSeriesHeader, newSharePriceData] = extractColumnHeaderAndData(sharePriceData);
  const [_, newIndexPriceData] = extractColumnHeaderAndData(indexPriceData);

  checkArrayLengths(companyData, newSharePriceData, newIndexPriceData);

  const convertedSharePriceData = convertAndFilterPriceData(newSharePriceData);
  const convertedIndexPriceData = convertAndFilterPriceData(newIndexPriceData);

  // Filter out minority acquisitions
  // const filteredData = companyData.filter(data => !data.isMinorityAcquisition);

  const [avgCumulativeAbnormalReturns, countPerMonth] = analyzeData(companyData, convertedSharePriceData, convertedIndexPriceData);

  const tableData = avgCumulativeAbnormalReturns.map((returnValue, index) => ({
    Month: timeSeriesHeader[index],
    Count: countPerMonth[index],
    'Avg Cumulative Abnormal Return': returnValue !== null
      ? `${(returnValue * 100).toFixed(2)}%`
      : 'N/A'
  }));

  console.table(tableData);
};

main();