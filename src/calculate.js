import * as math from 'mathjs';

function roundToDecimal(number, decimalPlaces) {
  return math.round(number, decimalPlaces);
}

function calculateMonthlyReturns(priceData) {
  return priceData.map((prices) => {
    return prices.map((currentPrice, monthIndex) => {
      if (monthIndex === 0) {
        return null;
      }

      const previousPrice = prices[monthIndex - 1];

      if (!currentPrice || !previousPrice) return null;

      return roundToDecimal(math.number(math.subtract(math.divide(currentPrice, previousPrice), 1)), 10);
    });
  });
}

function calculateAverageMonthlyReturns(returns) {
  const numMonths = returns[0].length;
  const averageReturns = [];
  const countPerMonth = [];

  for (let monthIndex = 0; monthIndex < numMonths; monthIndex++) {
    let sum = math.bignumber(0);
    let count = 0;

    for (let ri = 0; ri < returns.length; ri++) {
      const returnValue = returns[ri][monthIndex];
      if (returnValue !== null) {
        sum = math.add(sum, math.bignumber(returnValue));
        count++;
      }
    }

    averageReturns.push(count > 0 ? math.number(math.divide(sum, count)) : null);
    countPerMonth.push(count);
  }

  return [averageReturns, countPerMonth];
}

function calculateCumulativeReturns(returns) {
  const numCompanies = returns.length;
  const numMonths = returns[0].length;
  const cumulativeReturns = new Array(numCompanies).fill(null).map(() => new Array(numMonths).fill(null));

  for (let ri = 0; ri < numCompanies; ri++) {
    let cumulativeReturn = math.bignumber(1); // Start with 1 (100%)

    for (let monthIndex = 0; monthIndex < numMonths; monthIndex++) {
      const currentReturn = returns[ri][monthIndex];
      if (currentReturn === null) {
        cumulativeReturns[ri][monthIndex] = null;
      } else {
        cumulativeReturn = math.multiply(cumulativeReturn, math.add(1, math.bignumber(currentReturn)));
        // Round to 10 decimal places to ensure consistent precision
        cumulativeReturns[ri][monthIndex] = roundToDecimal(math.number(math.subtract(cumulativeReturn, 1)), 10);
      }
    }
  }

  return cumulativeReturns;
}

function calculateAbnormalReturns(shareReturns, indexReturns) {
  return shareReturns.map((row, ri) =>
    row.map((returnValue, monthIndex) => {
      const indexReturnValue = indexReturns[ri][monthIndex];
      if (returnValue === null || indexReturnValue === null) return null;
      return math.number(math.subtract(math.bignumber(returnValue), math.bignumber(indexReturnValue)));
    })
  );
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