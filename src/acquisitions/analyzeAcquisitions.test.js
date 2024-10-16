import { describe, expect, it } from "vitest";
import { analyzeAcquisitions } from "./analyzeAcquisitions";

const companyData = [
  {
    announcedDate: "2006-09-18T23:00:00.000Z",
    isWithdrawn: false,
    dealTypes: [
      "crossBorder",
      "newShareholderGainingMajorityControl",
      "termsNotDisclosed",
    ],
    isMinorityAcquisition: false,
    transactionSize: null,
    buyer: {
      name: "Fortress Investment Group LLC (IQ666715)",
      marketValue: 20,
      identifier: "IQ666715",
    },
    seller: {
      name: "\"Ihr Platz\" GmbH + Co. KG (IQ6655484)",
      marketValue: null,
      isPublicCompany: false,
      identifier: "IQ6655484",
    },
  },
  {
    announcedDate: "2021-08-10T23:00:00.000Z",
    isWithdrawn: false,
    dealTypes: [
      "crossBorder",
      "newShareholderGainingMajorityControl",
    ],
    isMinorityAcquisition: false,
    transactionSize: 228.09,
    buyer: {
      name: "Kalera Public Limited Company (IQ653145451)",
      marketValue: 20,
      identifier: "IQ653145451",
    },
    seller: {
      name: "&ever GmbH (IQ1677022701)",
      marketValue: null,
      isPublicCompany: false,
      identifier: "IQ1677022701",
    },
  },
  {
    announcedDate: "2012-12-27T00:00:00.000Z",
    isWithdrawn: false,
    dealTypes: [
      "newShareholderGainingMajorityControl",
    ],
    isMinorityAcquisition: false,
    transactionSize: 18.18,
    buyer: {
      name: "Sapient Corp. (IQ97870)",
      marketValue: 1455.27755,
      identifier: "IQ97870",
    },
    seller: {
      name: "(m)PHASIZE, LLC (IQ225963780)",
      marketValue: null,
      isPublicCompany: false,
      identifier: "IQ225963780",
    },
  },
]

const sharePriceData = [
  [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
  [19.67101, 18.7809, 18.997, 17.54979, 15.75735, 12.54899, 11.5964, 14.25557, 14.74368, 12.17607, 10.5612, 10.03246, 9.49017, 8.4859, 10.0891, 9.90252, 8.65342, 8.33032, 7.059, 7.37507, 3.4417, 2.14228, 0.70239, 1.05358, 0.87798, "", "", "", "", "", "", "", "", "", ""],
  [1001, 1002, 1004, 1004.63, 1005, 1010, 1011, 1015, 1018, 590, 270, 197, 133, 7.8, 15, 7.3, 6.25, 4.66, 3.4, 0.1992, 0.136, 0.1674, 0.0005, 0.0005, 0.0005, 0.0005, 0.0005, 0.0001, 0.0001, "", "", "", "", "", ""],
  [9.96, 10.11, 10.66, 10.28, 10.59, 10.56, 12.11, 11.22, 12.19, 11.67, 12.891, 13.06, 13.7, 14.965, 15.6, 15.81, 15.73, 17.36, 16.03, 17.41, 17.06, 16.27, 16.45, 16.245, 14.76, 14.51, 14, 17.32, 24.7, 24.88, 24.86, 24.98, "", "", ""]
];

const indexPriceData = [
  [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
  [1310.61196, 1270.08986, 1270.20438, 1276.66035, 1303.81846, 1335.84699, 1377.94257, 1400.63436, 1418.30049, 1438.24289, 1406.81901, 1420.86377, 1482.36732, 1530.62116, 1503.3486, 1455.27478, 1473.98791, 1526.74673, 1549.37732, 1481.14316, 1468.35517, 1378.54729, 1330.63295, 1322.70344, 1385.58652, 1400.37668, 1280.00123, 1267.38091, 1282.82797, 1166.36142, 968.75377, 896.23714, 903.25492, 825.88165, 735.09218],
  [3972.89221, 4181.1749, 4204.11055, 4297.49663, 4395.26397, 4522.68012, 4307.53875, 4605.37665, 4567.00149, 4766.18297, 4515.54758, 4373.93915, 4530.41345, 4131.92641, 4132.14778, 3785.38485, 4130.28577, 3954.999, 3585.6241, 3871.97722, 4080.10655, 3839.49659, 4076.60382, 3970.15344, 4109.31244, 4169.4814, 4179.82546, 4450.38131, 4588.96114, 4507.66179, 4288.05412, 4193.80096, 4567.79864, 4769.82941, 4845.64718],
  [1379.32392, 1406.57567, 1440.6745, 1412.15797, 1416.18157, 1426.18798, 1498.11093, 1514.67827, 1569.18587, 1597.56567, 1630.74189, 1606.27761, 1685.72502, 1632.97115, 1681.54666, 1756.54463, 1805.81269, 1848.35652, 1782.58697, 1859.44937, 1872.33518, 1883.95013, 1923.57266, 1960.23124, 1930.67387, 2003.3677, 1972.28515, 2018.0545, 2067.56204, 2058.90238, 1994.99041, 2104.50325, 2067.88724, 2085.51365, 2107.38958]
];

function calculateCumulativeAbnormalReturns(sharePrices, indexPrices) {
  const returns = [];
  let cumulative = 1;
  for (let i = 0; i < sharePrices.length; i++) {
    if (sharePrices[i] === "" || indexPrices[i] === "") {
      returns.push(null);
    } else {
      const shareReturn = i === 0 ? 0 : (sharePrices[i] / sharePrices[i - 1]) - 1;
      const indexReturn = i === 0 ? 0 : (indexPrices[i] / indexPrices[i - 1]) - 1;
      const abnormalReturn = shareReturn - indexReturn;
      cumulative *= (1 + abnormalReturn);
      returns.push(cumulative - 1);
    }
  }
  return returns;
}

function calculateAverageCumulativeAbnormalReturns(sharePriceData, indexPriceData) {
  const cumulativeReturnsArray = [];
  for (let i = 1; i < sharePriceData.length; i++) {
    const cumulativeReturns = calculateCumulativeAbnormalReturns(sharePriceData[i], indexPriceData[i]);
    cumulativeReturnsArray.push(cumulativeReturns);
  }

  const averageReturns = [];
  for (let i = 0; i < cumulativeReturnsArray[0].length; i++) {
    const validReturns = cumulativeReturnsArray.map(returns => returns[i]).filter(val => val !== null);
    const average = validReturns.length > 0 ? validReturns.reduce((sum, val) => sum + val, 0) / validReturns.length : null;
    averageReturns.push(average);
  }

  return averageReturns;
}

function calculateAverageCumulativeAbnormalReturnsSinceAcquisition(sharePriceData, indexPriceData) {
  const cumulativeReturnsArray = [];
  for (let i = 1; i < sharePriceData.length; i++) {
    const cumulativeReturns = calculateCumulativeAbnormalReturns(sharePriceData[i], indexPriceData[i]);
    cumulativeReturnsArray.push(cumulativeReturns);
  }

  const averageReturns = [];
  for (let i = 0; i < cumulativeReturnsArray[0].length; i++) {
    const validReturns = cumulativeReturnsArray.map(returns => returns[i]).filter(val => val !== null);
    const average = validReturns.length > 0 ? validReturns.reduce((sum, val) => sum + val, 0) / validReturns.length : null;
    averageReturns.push(average);
  }

  // Adjust returns to be relative to the acquisition date (index 5)
  const month0Value = averageReturns[5];
  return averageReturns.map((returnValue, index) =>
    index >= 5 && returnValue !== null ? returnValue - month0Value : null
  );
}

describe('Cumulative Abnormal Returns Calculations', () => {
  it('abnormal returns from the start for all companies', async () => {
    const { allAcquisitionsReturn } = await analyzeAcquisitions(companyData, sharePriceData, indexPriceData, {
      minMarketCapForAnalyzingInM: 10,
      outputTopNumberCount: 30,
      minAmountOfCompaniesInEachSampleSizeForTopOutput: 500
    });

    const averageCumulativeAbnormalReturns = calculateAverageCumulativeAbnormalReturns(sharePriceData, indexPriceData);

    allAcquisitionsReturn.averageCumulativeAbnormalReturns.forEach((value, index) => {
      expect(value).toBeCloseTo(averageCumulativeAbnormalReturns[index], 4);
    });
  })

  it('abnormal returns from the announcement date of acquisition for all companies', async () => {
    const { allAcquisitionsReturn } = await analyzeAcquisitions(companyData, sharePriceData, indexPriceData, {
      minMarketCapForAnalyzingInM: 10,
      outputTopNumberCount: 30,
      minAmountOfCompaniesInEachSampleSizeForTopOutput: 500
    });

    const averageCumulativeAbnormalReturnsSinceAcquisition = calculateAverageCumulativeAbnormalReturnsSinceAcquisition(sharePriceData, indexPriceData);

    allAcquisitionsReturn.averageCumulativeAbnormalReturnsSinceAcquisition.forEach((value, index) => {
      expect(value).toBeCloseTo(averageCumulativeAbnormalReturnsSinceAcquisition[index], 4);
    });
  })
});