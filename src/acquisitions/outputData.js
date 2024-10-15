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

function analyzeFilters(returns) {
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

  // Sort by average return (descending order)
  averageReturns.sort((a, b) => b.averageReturnSinceAcquisition - a.averageReturnSinceAcquisition);

  return averageReturns;
}

export function processCalculationResults(calculationResults, timeSeriesHeader, outputTopNumberCount) {
  const returns = calculationResults.map(({ filters, data }) => {
    const [avgCumulativeAbnormalReturns, countPerMonth] = data;
    return createConsolidatedReturns(filters, avgCumulativeAbnormalReturns, countPerMonth, timeSeriesHeader);
  });

  const filterAnalysis = analyzeFilters(returns);

  return {
    filterAnalysis: filterAnalysis,
    worstReturnsSinceAcquisition: getTopReturns(returns, outputTopNumberCount, 'lastMonthSinceAcquisition', true),
    bestReturnsSinceAcquisition: getTopReturns(returns, outputTopNumberCount, 'lastMonthSinceAcquisition', false),
    worstDrawdowns: getTopReturns(returns, outputTopNumberCount, 'drawdown', true),
    bestPeaks: getTopReturns(returns, outputTopNumberCount, 'peak', false),
    allReturns: returns,
  };
}