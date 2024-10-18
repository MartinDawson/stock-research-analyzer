import dayjs from 'dayjs';
import { parse } from 'csv-parse/sync';
import { acquisitionDealTypeMap } from './acquisitionFilters.js';

function getAcquisitionTypes(labelsString) {
  const labels = labelsString.split(',');

  return labels.map((label) => {
    return acquisitionDealTypeMap[label];
  })
}

const extractId = (field) => {
  const match = field.match(/IQ\d+/);

  return match ? match[0] : null;
};

const isValidNumber = (value) => {
  const number = parseFloat(value);

  if (number === 0) {
    return false;
  }

  return Number.isFinite(number);
};

export const processAcquisitionData = (fileContent) => {
  const records = parse(fileContent, {
    columns: true
  });

  const mappedRecords = records.map(row => {
    const buyerMarketValue = isValidNumber(row['Buyer: Market Capitalization']) ? parseFloat(row['Buyer: Market Capitalization']) : null;
    const sellerMarketValue = isValidNumber(row['Target: Market Capitalization']) ? parseFloat(row['Target: Market Capitalization']) : null;
    const transactionSize = isValidNumber(row['Total Transaction Value']) ? parseFloat(row['Total Transaction Value']) : null;

    return {
      announcedDate: dayjs(row['Announced Date MM/dd/yyyy'], 'DD/MM/YYYY').toDate(),
      isWithdrawn: row['Transaction Status'] === 'Terminated/Withdrawn',
      dealTypes: getAcquisitionTypes(row['M&A Feature Type']),
      isMinorityAcquisition: row['Transaction Type'] === 'M&A - Minority',
      transactionSize,
      buyer: {
        name: row['SPCIQ ID (Buyer/Investor)'],
        marketValue: buyerMarketValue,
        identifier: extractId(row['SPCIQ ID (Buyer/Investor)'])
      },
      seller: {
        name: row['SPCIQ ID (Target/Issuer)'],
        marketValue: sellerMarketValue,
        isPublicCompany: sellerMarketValue !== null,
        identifier: extractId(row['SPCIQ ID (Target/Issuer)'])
      },
    };
  });

  return mappedRecords;
};

