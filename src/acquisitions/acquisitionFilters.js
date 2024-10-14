import dayjs from 'dayjs';

const today = dayjs().format('YYYY-MM-DD');

const dateRanges = [
  { label: 'All Time', start: '1900-01-01', end: today },
  { label: '2000-2007', start: '2000-01-01', end: '2007-12-31' },
  { label: '2008-2015', start: '2008-01-01', end: '2015-12-31' },
  { label: '2016-Today', start: '2016-01-01', end: today }
];

const acquisitionTypes = [
  { label: 'All Majority/Minority', type: 'all' },
  { label: 'Majority', type: 'majority' },
  { label: 'Minority', type: 'minority' }
];

const acquisitionStatus = [
  { label: 'All Withdrawn/Terminated/Completed', type: 'all' },
  { label: 'Withdrawn/Terminated', type: 'withdrawn/terminated' },
  { label: 'Completed', type: 'completed' }
];

const acquisitionsNumbers = [
  { label: 'All Acquisition Numbers', type: 'all' },
  { label: '1', type: '1' },
  { label: '2-5', type: '2-5' },
  { label: '5-20', type: '5-20' },
  { label: '>20', type: '>20' },
];

const acquisitionPublicOrPrivate = [
  { label: 'All Public/Private', type: 'all' },
  { label: 'Public', type: 'public' },
  { label: 'Private', type: 'private' },
];

const acquisitionSizeByTransactionValue = [
  { label: 'All Transaction sizes', type: 'all' },
  { label: '0-2%', type: '0-2%' },
  { label: '2-10%', type: '2-10%' },
  { label: '10-25%', type: '10-25%' },
  { label: '25-50%', type: '25-50%' },
  { label: '50-100%', type: '50-100%' },
  { label: '>100%', type: '>100%' },
];

export const acquisitionDealTypes = [
  { label: "All Deal Types", type: "all" },
  { label: "New Shareholder Gaining Majority Control", type: "newShareholderMajority" },
  { label: "Cash Deal", type: "cashDeal" },
  { label: "Stock Deal", type: "stockDeal" },
  { label: "Earnout Payment", type: "earnoutPayment" },
  { label: "Cross-Border", type: "crossBorder" },
  { label: "Terms Not Disclosed", type: "termsNotDisclosed" },
  { label: "Leveraged Buyout (LBO)", type: "lbo" },
  { label: "Reverse Merger", type: "reverseMerger" },
  { label: "Backdoor IPO", type: "backdoorIpo" },
  { label: "Corporate Divestiture", type: "corporateDivestiture" },
  { label: "Management Participated", type: "managementParticipated" },
  { label: "Bankruptcy Sale", type: "bankruptcySale" },
  { label: "Add-on/Bolt-on/Consolidation/Tuck-in", type: "addOn" },
  { label: "Minority Shareholder Increasing Ownership Stake", type: "minorityIncreasingStake" },
  { label: "Minority Shareholder Gaining Majority Control", type: "minorityGainingMajority" },
  { label: "Tender Offer", type: "tenderOffer" }
];

export const acquisitionLabelFilters = dateRanges.flatMap(dateRange =>
  acquisitionDealTypes.flatMap((dealType) =>
    acquisitionStatus.flatMap((status) =>
      acquisitionSizeByTransactionValue.flatMap((sizeByTransactionValue) =>
        acquisitionPublicOrPrivate.flatMap((publicOrPrivate) =>
          acquisitionsNumbers.flatMap((acquisitionsNumber) => acquisitionTypes.map(acquisitionType => ({
            label: `(${publicOrPrivate.label})/(${sizeByTransactionValue.label})/(${acquisitionType.label})/(${acquisitionsNumber.label})/(${dealType.label})/(${status.label})/(${dateRange.label})`,
            filters: {
              dateRange,
              sizeByTransactionValue: sizeByTransactionValue.type,
              publicOrPrivate: publicOrPrivate.type,
              acquisitionsNumber: acquisitionsNumber.type,
              status: status.type,
              dealType: dealType.type,
              type: acquisitionType.type
            }
          })))
        )
      )
    )
  )
);

const groupByBuyerIdentifier = (records) => {
  return records.reduce((grouped, row) => {
    const buyerId = row.buyer.identifier;
    if (!grouped[buyerId]) {
      grouped[buyerId] = [];
    }
    grouped[buyerId].push(row);
    return grouped;
  }, {});
}

export const getFilterSharePriceIndexData = (companyData, sharePriceData, indexPriceData) => {
  const uniqueCompaniesAcquisitionsData = groupByBuyerIdentifier(companyData);

  const filterSharePriceIndexData = (filters) => {
    const { dateRange, status, type, dealType, publicOrPrivate, sizeByTransactionValue, acquisitionsNumber } = filters;

    const isInDateRange = company => {
      const announcedDate = new Date(company.announcedDate);
      return announcedDate > new Date(dateRange.start) && announcedDate < new Date(dateRange.end);
    };

    const isCorrectAcquisitionType = (company) => {
      if (type === 'all') return true;
      return type === 'minority' ? company.isMinorityAcquisition : !company.isMinorityAcquisition;
    }

    const isCorrectAcquisitionStatus = (company) => {
      if (status === 'all') return true;
      return status === 'withdrawn/terminated' ? company.isWithdrawn : !company.isWithdrawn;
    }

    const isCorrectAcquisitionPublicOrPrivate = (company) => {
      if (publicOrPrivate === 'all') return true;
      return publicOrPrivate === 'public' ? company.isPublicCompany : !company.isPublicCompany;
    }

    const isCorrectNumberOfAcquisitions = (company) => {
      const identifier = company.buyer.identifier;
      const numberOfAcquisitions = uniqueCompaniesAcquisitionsData[identifier].length;

      if (acquisitionsNumber === '1') return numberOfAcquisitions === 1;
      if (acquisitionsNumber === '2-5') return numberOfAcquisitions >= 2 && numberOfAcquisitions < 5;
      if (acquisitionsNumber === '5-20') return numberOfAcquisitions >= 5 && numberOfAcquisitions < 20;
      return true;
    }

    const isCorrectSizeByTransactionValue = (company) => {
      if (sizeByTransactionValue === 'all') return true;
      if (company.transactionSize === null || company.buyer.marketValue === null) return false;

      const transactionSizeRelativeToBuyerMarketValue = company.transactionSize / company.buyer.marketValue;
      if (transactionSizeRelativeToBuyerMarketValue < 0) return false;

      if (sizeByTransactionValue === '0-2%') return transactionSizeRelativeToBuyerMarketValue < 0.02;
      if (sizeByTransactionValue === '2-10%') return transactionSizeRelativeToBuyerMarketValue >= 0.02 && transactionSizeRelativeToBuyerMarketValue < 0.1;
      if (sizeByTransactionValue === '10-25%') return transactionSizeRelativeToBuyerMarketValue >= 0.1 && transactionSizeRelativeToBuyerMarketValue < 0.25;
      if (sizeByTransactionValue === '25-50%') return transactionSizeRelativeToBuyerMarketValue >= 0.25 && transactionSizeRelativeToBuyerMarketValue < 0.5;
      if (sizeByTransactionValue === '50-100%') return transactionSizeRelativeToBuyerMarketValue >= 0.5 && transactionSizeRelativeToBuyerMarketValue < 1;
      return true;
    }

    const isCorrectDealType = (company) => {
      if (dealType === 'all') return true;
      return company.dealTypes.some((type) => type === dealType);
    }

    const filteredSharePriceData = [];
    const filteredIndexPriceData = [];

    for (let i = 0; i < companyData.length; i++) {
      const company = companyData[i];

      if (isCorrectAcquisitionType(company) &&
        isCorrectDealType(company) &&
        isCorrectAcquisitionStatus(company) &&
        isCorrectNumberOfAcquisitions(company) &&
        isCorrectAcquisitionPublicOrPrivate(company) &&
        isCorrectSizeByTransactionValue(company) &&
        isInDateRange(company)) {

        filteredSharePriceData.push(sharePriceData[i]);
        filteredIndexPriceData.push(indexPriceData[i]);
      }
    }

    return [filteredSharePriceData, filteredIndexPriceData];
  }

  return filterSharePriceIndexData;
};