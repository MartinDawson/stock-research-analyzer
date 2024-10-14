function createConsolidatedReturns(label, avgCumulativeAbnormalReturns, countPerMonth, timeSeriesHeader) {
  const month0Value = avgCumulativeAbnormalReturns[5];

  return {
    label,
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

export function processCalculationResults(calculationResults, timeSeriesHeader, outputTopNumberCount) {
  const returns = calculationResults.map(({ label, data }) => {
    const [avgCumulativeAbnormalReturns, countPerMonth] = data;
    return createConsolidatedReturns(label, avgCumulativeAbnormalReturns, countPerMonth, timeSeriesHeader);
  });

  return {
    allReturns: returns,
    worstReturnsSinceAcquisition: getTopReturns(returns, outputTopNumberCount, 'lastMonthSinceAcquisition', true),
    bestReturnsSinceAcquisition: getTopReturns(returns, outputTopNumberCount, 'lastMonthSinceAcquisition', false),
    worstDrawdowns: getTopReturns(returns, outputTopNumberCount, 'drawdown', true),
    bestPeaks: getTopReturns(returns, outputTopNumberCount, 'peak', false)
  };
}