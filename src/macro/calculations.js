// Calculate velocity of money (V = PY/M)

import dayjs from "dayjs";

// We need to match quarterly GDP with quarterly average M4
export const calculateVelocityOfMoney = (nominalGDP, m4MoneySupply) => {
  const velocityData = [];
  let currentQuarter = null;
  let quarterlyM4Sum = 0;
  let quarterlyM4Count = 0;

  // First, process M4 data to get quarterly averages
  for (let i = 0; i < m4MoneySupply.length; i++) {
    const date = dayjs(m4MoneySupply[i].date);
    const thisQuarter = `${date.year()}-Q${Math.floor(date.month() / 3) + 1}`;

    // If we're in a new quarter, calculate velocity for the previous quarter
    if (currentQuarter && thisQuarter !== currentQuarter && quarterlyM4Count > 0) {
      const avgM4 = quarterlyM4Sum / quarterlyM4Count;

      // Find matching GDP for this quarter
      const gdpEntry = nominalGDP.find(gdp => {
        const gdpDate = dayjs(gdp.date);
        const gdpQuarter = `${gdpDate.year()}-Q${Math.floor(gdpDate.month() / 3) + 1}`;
        return gdpQuarter === currentQuarter;
      });

      if (gdpEntry) {
        const velocity = gdpEntry.value / avgM4;
        velocityData.push({
          date: dayjs(gdpEntry.date).toDate(),
          value: velocity
        });
      }

      // Reset for new quarter
      quarterlyM4Sum = m4MoneySupply[i].value;
      quarterlyM4Count = 1;
    } else {
      quarterlyM4Sum += m4MoneySupply[i].value;
      quarterlyM4Count++;
    }

    currentQuarter = thisQuarter;
  }

  // Sort by date
  return velocityData.sort((a, b) => a.date - b.date);
};