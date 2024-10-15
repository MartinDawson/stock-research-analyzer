function createConsolidatedReturns(filters, avgCumulativeAbnormalReturns, countPerMonth, timeSeriesHeader) {
  const month0Value = avgCumulativeAbnormalReturns[5];

  return {
    filters,
    months: timeSeriesHeader,
    counts: countPerMonth,
    averageCumulativeAbnormalReturns: avgCumulativeAbnormalReturns.map(returnValue =>
      returnValue !== null ? Number((returnValue * 100).toFixed(2)) : null
    ),
    averageCumulativeAbnormalReturnsSinceAcquisition: avgCumulativeAbnormalReturns.map((returnValue, index) =>
      index >= 5 && returnValue !== null ? Number(((returnValue - month0Value) * 100).toFixed(2)) : null
    )
  };
}

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

function analyzeTypeOfAcquisition(returns) {
  const filterReturns = {};
  const filterCounts = {};

  returns.forEach(item => {
    const filters = item.filters;
    const finalReturn = item.averageCumulativeAbnormalReturnsSinceAcquisition[item.averageCumulativeAbnormalReturnsSinceAcquisition.length - 1];

    if (finalReturn !== null) {
      Object.entries(filters).forEach(([filterType, filterValue]) => {
        const filterKey = `${filterType}:${filterValue}`;
        if (!filterReturns[filterKey]) {
          filterReturns[filterKey] = [];
          filterCounts[filterKey] = 0;
        }
        filterReturns[filterKey].push(finalReturn);
        filterCounts[filterKey]++;
      });
    }
  });

  const averageReturns = Object.entries(filterReturns).map(([filterKey, returns]) => {
    const averageReturnSinceAcquisition = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    return {
      filter: filterKey,
      averageReturnSinceAcquisition: Number(averageReturnSinceAcquisition.toFixed(2)),
      count: filterCounts[filterKey]
    };
  });

  averageReturns.sort((a, b) => b.averageReturnSinceAcquisition - a.averageReturnSinceAcquisition);

  return averageReturns;
}

export function processCalculationResults(calculationResults, timeSeriesHeader, outputTopNumberCount, minAmountOfCompaniesInEachSampleSizeForTopOutput) {
  const returns = calculationResults.map(({ filters, data, count }) => {
    const [avgCumulativeAbnormalReturns, countPerMonth] = data;
    const returnsObject = createConsolidatedReturns(filters, avgCumulativeAbnormalReturns, countPerMonth, timeSeriesHeader);

    return {
      ...returnsObject,
      count
    }
  });

  const typeOfAcquisition = analyzeTypeOfAcquisition(returns);
  const filteredReturns = returns.filter(({ count }) => count >= minAmountOfCompaniesInEachSampleSizeForTopOutput);

  const allAcquisitionsReturn = filteredReturns.find(({ filters }) => {
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