import dayjs from 'dayjs';

function calculateMonthlyReturns(priceData) {
  return priceData.map((prices) => {
    return prices.map((currentPrice, monthIndex) => {
      if (monthIndex === 0) {
        return null;
      }

      const previousPrice = prices[monthIndex - 1];

      if (!currentPrice || !previousPrice) return null;

      return (currentPrice / previousPrice) - 1;
    });
  });
}

function calculateAverageMonthlyReturns(returns) {
  const numMonths = returns[0].length;
  const averageReturns = [];
  const countPerMonth = [];

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

    averageReturns.push(count > 0 ? sum / count : null);
    countPerMonth.push(count);
  }

  return [averageReturns, countPerMonth];
}

function calculateCumulativeReturns(returns) {
  const numCompanies = returns.length;
  const numMonths = returns[0].length;
  const cumulativeReturns = new Array(numCompanies).fill(null).map(() => new Array(numMonths).fill(null));

  for (let ri = 0; ri < numCompanies; ri++) {
    let cumulativeReturn = 1; // Start with 1 (100%)

    for (let monthIndex = 0; monthIndex < numMonths; monthIndex++) {
      const currentReturn = returns[ri][monthIndex];
      if (currentReturn === null) {
        cumulativeReturns[ri][monthIndex] = null;
      } else {
        cumulativeReturn *= (1 + currentReturn);
        cumulativeReturns[ri][monthIndex] = cumulativeReturn - 1; // Convert back to percentage
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
      return returnValue - indexReturnValue;
    })
  );
}

const calculateReturns = (sharePriceData, indexPriceData) => {
  const shareMonthlyReturns = calculateMonthlyReturns(sharePriceData);
  const indexMonthlyReturns = calculateMonthlyReturns(indexPriceData);

  const monthlyAbnormalReturns = calculateAbnormalReturns(shareMonthlyReturns, indexMonthlyReturns);
  const cumulativeAbnormalReturns = calculateCumulativeReturns(monthlyAbnormalReturns);

  return calculateAverageMonthlyReturns(cumulativeAbnormalReturns);
}

export const analyzeData = (companyData, sharePriceData, indexPriceData) => {
  const [minDate, maxDate] = companyData.reduce((acc, data) => {
    const currentDate = dayjs(data.announcedDate);
    return [
      currentDate.isBefore(acc[0]) ? currentDate : acc[0],
      currentDate.isAfter(acc[1]) ? currentDate : acc[1]
    ];
  }, [dayjs(companyData[0].announcedDate), dayjs(companyData[0].announcedDate)]);

  console.log(`Date Range: ${minDate.format('DD/MM/YYYY')} - ${maxDate.format('DD/MM/YYYY')}`);

  const isMajorityAcquisitionPredicate = (_, i) => !companyData[i].isMinorityAcquisition

  const filteredSharePriceData = sharePriceData.filter(isMajorityAcquisitionPredicate);
  const filteredIndexPriceData = indexPriceData.filter(isMajorityAcquisitionPredicate);

  console.log('Total count of data:', filteredSharePriceData.length);

  return calculateReturns(filteredSharePriceData, filteredIndexPriceData);
}