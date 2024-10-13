import dayjs from 'dayjs';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { acquisitionDealTypes } from './acquisitionConditions.js';

function getAcquisitionTypes(data) {
  const findType = ({ label, type }) => {
    const index = data.indexOf(label);

    return index !== -1 ? type : null;
  };

  return acquisitionDealTypes.map(findType).filter(Boolean);
}

const extractId = (field) => {
  const match = field.match(/IQ\d+/);

  return match ? match[0] : null;
};

export const processAcquisitionData = async (inputFile) => {
  const fileContent = await fs.readFile(inputFile, 'utf8');
  const records = parse(fileContent, {
    columns: true
  });

  const mappedRecords = records.map(row => {
    const buyerMarketValue = 0;
    const sellerMarketValue = 0;

    return {
      announcedDate: dayjs(row['Announced Date MM/dd/yyyy'], 'DD/MM/YYYY').toDate(),
      isWithdrawn: row['Transaction Status'] === 'Terminated/Withdrawn',
      dealTypes: getAcquisitionTypes(row['M&A Feature Type']),
      isMinorityAcquisition: row['Transaction Type'] === 'M&A - Minority',
      transactionSize: row['Total Transaction Value ($M)'],
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

