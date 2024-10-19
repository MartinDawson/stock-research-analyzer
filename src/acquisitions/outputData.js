import { acquirerMarketCaps, acquisitionDealTypeMap, acquisitionPublicOrPrivates, acquisitionSizeByTransactionValues, acquisitionsNumbers, acquisitionStatus, acquisitionTypes, dateRanges } from "./acquisitionFilters.js";

function getTopReturns(returns, count, metric, ascending = true) {
  const getMetricValue = (item) => {
    const returnsSinceAcquisition = item.averageCumulativeAbnormalReturnsSinceAcquisition.slice(5);

    switch (metric) {
      case 'lastMonthSinceAcquisition':
        return returnsSinceAcquisition[returnsSinceAcquisition.length - 1] ?? 0;
      case 'peak':
        return Math.max(...returnsSinceAcquisition.filter(r => r !== null), 0);
      case 'drawdown':
        return Math.min(...returnsSinceAcquisition.filter(r => r !== null), 0);
      default:
        throw new Error('Invalid metric');
    }
  };

  const sortedReturns = [...returns].sort((a, b) => {
    const aValue = getMetricValue(a);
    const bValue = getMetricValue(b);
    return ascending ? aValue - bValue : bValue - aValue;
  });

  return sortedReturns.slice(0, count);
}

function analyzeIndividualFilterTypes(returns) {
  const results = {};

  const analyzeFilter = (filterKey, filterValue) => {
    const matchingReturn = returns.find(({ filters }) =>
      Object.entries(filters).every(([key, value]) =>
        key === filterKey ? value === filterValue : value === 'all'
      )
    );

    if (!matchingReturn) {
      console.warn(`No matching return found for ${filterKey}:${filterValue}`)

      return {
        count: 0,
        averageReturnSinceAcquisition: null
      };
    }

    const { averageCumulativeAbnormalReturnsSinceAcquisition, count: totalCount } = matchingReturn;
    const finalReturn = averageCumulativeAbnormalReturnsSinceAcquisition[averageCumulativeAbnormalReturnsSinceAcquisition.length - 1];

    return {
      count: totalCount,
      averageCumulativeAbnormalReturnSinceAcquisition: finalReturn
    };
  };

  results.dealTypes = Object.values(acquisitionDealTypeMap).map(type => ({
    type,
    ...analyzeFilter('dealType', type)
  }));

  results.acquisitionTypes = acquisitionTypes.map(type => ({
    type,
    ...analyzeFilter('acquisitionType', type)
  }));

  results.dateRanges = dateRanges.map(range => ({
    type: range.type,
    ...analyzeFilter('dateRange', range.type)
  }));

  results.sizeByTransactionValues = acquisitionSizeByTransactionValues.map(type => ({
    type,
    ...analyzeFilter('sizeByTransactionValue', type)
  }));

  results.publicOrPrivates = acquisitionPublicOrPrivates.map(type => ({
    type,
    ...analyzeFilter('publicOrPrivate', type)
  }));

  results.acquisitionsNumbers = acquisitionsNumbers.map(type => ({
    type,
    ...analyzeFilter('acquisitionsNumber', type)
  }));

  results.acquirerMarketCaps = acquirerMarketCaps.map(type => ({
    type,
    ...analyzeFilter('acquirerMarketCap', type)
  }));

  results.status = acquisitionStatus.map(type => ({
    type,
    ...analyzeFilter('status', type)
  }));

  return results;
}

const getSinceAcquisitionMapper = (month0Value) => (returnValue, index) => index >= 5 && returnValue !== null ? returnValue - month0Value : null

export function processCalculationResults(calculationResults, timeSeriesHeader, outputTopNumberCount, minAmountOfCompaniesInEachSampleSizeForTopOutput) {
  const returns = calculationResults.map(({ filters, data: { averageCumulativeReturns, averageCumulativeAbnormalReturns }, count }) => {
    const [avgCumulativeAbnormalReturns, countPerMonth] = averageCumulativeAbnormalReturns;
    const [avgCumulativeReturns] = averageCumulativeReturns;

    return {
      filters,
      months: timeSeriesHeader,
      counts: countPerMonth,
      count,
      averageCumulativeReturns: avgCumulativeReturns,
      averageCumulativeReturnsSinceAcquisition: avgCumulativeReturns.map(getSinceAcquisitionMapper(avgCumulativeReturns[5])),
      averageCumulativeAbnormalReturns: avgCumulativeAbnormalReturns,
      averageCumulativeAbnormalReturnsSinceAcquisition: avgCumulativeAbnormalReturns.map(getSinceAcquisitionMapper(avgCumulativeAbnormalReturns[5]))
    };
  });

  const typeOfAcquisition = analyzeIndividualFilterTypes(returns);
  const filteredReturns = returns.filter(({ count }) => count >= minAmountOfCompaniesInEachSampleSizeForTopOutput);

  const allAcquisitionsReturn = returns.find(({ filters }) => {
    return filters.dateRange === "all" &&
      filters.sizeByTransactionValue === "all" &&
      filters.publicOrPrivate === "all" &&
      filters.acquisitionsNumber === "all" &&
      filters.acquirerMarketCap === "all" &&
      filters.status === "all" &&
      filters.dealType === "all" &&
      filters.acquisitionType === "all";
  });

  if (!allAcquisitionsReturn) {
    throw new Error('Could not find the allAcquisitions. Did you forget to add a filter condition here?');
  }

  return {
    typeOfAcquisition,
    allAcquisitionsReturn,
    worstReturnsSinceAcquisition: getTopReturns(filteredReturns, outputTopNumberCount, 'lastMonthSinceAcquisition', true),
    bestReturnsSinceAcquisition: getTopReturns(filteredReturns, outputTopNumberCount, 'lastMonthSinceAcquisition', false),
    worstDrawdowns: getTopReturns(filteredReturns, outputTopNumberCount, 'drawdown', true),
    bestPeaks: getTopReturns(filteredReturns, outputTopNumberCount, 'peak', false),
    allReturns: returns,
  };
}