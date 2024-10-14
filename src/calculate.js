function roundToDecimal(number, decimalPlaces) {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(number * factor) / factor;
}

function calculateMonthlyReturns(priceData) {
  return priceData.map(prices => {
    const returns = new Array(prices.length);
    returns[0] = null;
    for (let i = 1; i < prices.length; i++) {
      if (!prices[i] || !prices[i - 1]) {
        returns[i] = null;
      } else {
        returns[i] = roundToDecimal(prices[i] / prices[i - 1] - 1, 10);
      }
    }
    return returns;
  });
}

function calculateAverageMonthlyReturns(returns) {
  const numMonths = returns[0].length;
  const averageReturns = new Array(numMonths);
  const countPerMonth = new Array(numMonths);

  for (let monthIndex = 0; monthIndex < numMonths; monthIndex++) {
    let sum = 0;
    let count = 0;

    for (let ri = 0; ri < returns.length; ri++) {
      const returnValue = returns[ri][monthIndex];
      if (returnValue !== null) {
        sum += returnValue;
        count++;
      }
    }

    averageReturns[monthIndex] = count > 0 ? roundToDecimal(sum / count, 10) : null;
    countPerMonth[monthIndex] = count;
  }

  return [averageReturns, countPerMonth];
}

function calculateAbnormalReturns(shareReturns, indexReturns) {
  return shareReturns.map((row, ri) =>
    row.map((returnValue, monthIndex) => {
      const indexReturnValue = indexReturns[ri][monthIndex];
      if (returnValue === null || indexReturnValue === null) return null;
      return roundToDecimal(returnValue - indexReturnValue, 10);
    })
  );
}


function calculateCumulativeReturns(returns) {
  const numCompanies = returns.length;
  const numMonths = returns[0].length;
  const cumulativeReturns = new Array(numCompanies);

  for (let ri = 0; ri < numCompanies; ri++) {
    let cumulativeReturn = 1;
    cumulativeReturns[ri] = new Array(numMonths);

    for (let monthIndex = 0; monthIndex < numMonths; monthIndex++) {
      const currentReturn = returns[ri][monthIndex];
      if (currentReturn === null) {
        cumulativeReturns[ri][monthIndex] = null;
      } else {
        cumulativeReturn *= (1 + currentReturn);
        cumulativeReturns[ri][monthIndex] = roundToDecimal(cumulativeReturn - 1, 10);
      }
    }
  }

  return cumulativeReturns;
}

function calculateReturns(sharePriceData, indexPriceData) {
  if (sharePriceData.length === 0 || indexPriceData.length === 0) {
    return [[], []];
  }

  const shareMonthlyReturns = calculateMonthlyReturns(sharePriceData);
  const indexMonthlyReturns = calculateMonthlyReturns(indexPriceData);

  const monthlyAbnormalReturns = calculateAbnormalReturns(shareMonthlyReturns, indexMonthlyReturns);
  const cumulativeAbnormalReturns = calculateCumulativeReturns(monthlyAbnormalReturns);

  return calculateAverageMonthlyReturns(cumulativeAbnormalReturns);
}

export { calculateReturns, calculateMonthlyReturns, calculateAverageMonthlyReturns, calculateCumulativeReturns, calculateAbnormalReturns };