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
    const buyerMarketValue = row['Buyer: Market Capitalization ($M)'] === '0' ? null : parseFloat(row['Buyer: Market Capitalization ($M)']);
    const sellerMarketValue = row['Target: Market Capitalization ($M)'] === 'NA' ? null : parseFloat(row['Target: Market Capitalization ($M)']);
    const transactionSize = row['Total Transaction Value ($M)'] === 'NA' ? null : parseFloat(row['Total Transaction Value ($M)']);

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

