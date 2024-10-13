import dayjs from 'dayjs';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';

function getAcquisitionTypes(data) {
  const types = [
    "New Shareholder Gaining Majority Control",
    "Cash Deal",
    "Stock Deal",
    "Earnout Payment",
    "Cross-Border",
    "Terms Not Disclosed",
    "Leveraged Buyout (LBO)",
    "Reverse Merger",
    "Backdoor IPO",
    "Corporate Divestiture",
    "Management Participated",
    "Bankruptcy Sale",
    "Add-on/Bolt-on/Consolidation/Tuck-in",
    "Minority Shareholder Increasing Ownership Stake",
    "Minority Shareholder Gaining Majority Control",
    "Tender Offer"
  ];

  const findType = (type) => {
    const index = data.indexOf(type);

    return index !== -1 ? type : null;
  };

  return types.map(findType).filter(Boolean);
}

const extractId = (field) => {
  const match = field.match(/IQ\d+/);

  return match ? match[0] : null;
};

export const processData = async (inputFile) => {
  const fileContent = await fs.readFile(inputFile, 'utf8');
  const records = parse(fileContent, {
    columns: true
  });

  const mappedRecords = records.map(row => {
    // const announcedDate = dayjs(row['Announced Date MM/dd/yyyy'], 'DD/MM/YYYY');
    const buyerMarketValue = 0;
    const sellerMarketValue = 0;
    // const dateFormat = 'YYYY-MM-DD'

    return {
      // startDate: announcedDate.subtract(5, 'month').format(dateFormat),
      // endDate: announcedDate.add(30, 'month').format(dateFormat),
      announcedDate: dayjs(row['Announced Date MM/dd/yyyy'], 'DD/MM/YYYY').toDate(),
      transactionStatus: row['Transaction Status'],
      type: getAcquisitionTypes(row['M&A Feature Type']),
      isMinorityAcquisition: row['Transaction Type'] === 'M&A - Minority',
      buyer: {
        name: row['SPCIQ ID (Buyer/Investor)'],
        marketValue: buyerMarketValue,
        isPublicCompany: buyerMarketValue !== 0,
        identifier: extractId(row['SPCIQ ID (Buyer/Investor)'])
      },
      seller: {
        name: row['SPCIQ ID (Seller)'],
        marketValue: sellerMarketValue,
        isPublicCompany: sellerMarketValue !== 0,
        identifier: extractId(row['SPCIQ ID (Seller)'])
      },
      transactionSizeRelativeToBuyerMarketCap: row['Total Transaction Value ($M)'] / buyerMarketValue,
    };
  });

  const addCountOfTransactionsPerBuyer = (records) => {
    const transactionCounts = {};

    records.forEach(record => {
      const buyerId = record.buyer.identifier;

      if (buyerId in transactionCounts) {
        transactionCounts[buyerId] += 1;
      } else {
        transactionCounts[buyerId] = 1;
      }
    });

    return records.map(record => ({
      ...record,
      transactionCount: transactionCounts[record.buyer.identifier]
    }));
  };

  return addCountOfTransactionsPerBuyer(mappedRecords);
};

export const processTimeseriesData = async (inputFile) => {
  const fileContent = await fs.readFile(inputFile, 'utf8');
  const records = parse(fileContent, {
    cast: true,
  });
  const slicedRecords = records.map(row => row.slice(0, 35));

  return slicedRecords;
}

