import dayjs from 'dayjs';

const today = dayjs().format('YYYY-MM-DD');

const dateRanges = [
  { type: 'all', start: '1900-01-01', end: today },
  { type: '2000-2007', start: '2000-01-01', end: '2007-12-31' },
  { type: '2008-2015', start: '2008-01-01', end: '2015-12-31' },
  { type: '2016-today', start: '2016-01-01', end: today }
];

const acquisitionTypes = [
  'all',
  'majority',
  'minority'
];

const acquisitionStatus = [
  'all',
  'withdrawn/terminated',
  'completed'
];

const acquisitionsNumbers = [
  'all',
  '1',
  '2-5',
  '5-20',
  '>20'
];

const acquisitionPublicOrPrivates = [
  'all',
  'public',
  'private'
];

const acquisitionSizeByTransactionValues = [
  'all',
  '0-2%',
  '2-10%',
  '10-25%',
  '25-50%',
  '50-100%',
  '>100%'
];

const acquirerMarketCaps = [
  'all',
  '10m-50m',
  '50m-300m',
  '300m-2b',
  '2b-10b',
  '10b-200b',
  '>200b'
];

export const acquisitionDealTypeMap = {
  "All Deal Types": "all",
  "New Shareholder Gaining Majority Control": "newShareholderGainingMajorityControl",
  "Cash Deal": "cashDeal",
  "Stock Deal": "stockDeal",
  "Earnout Payment": "earnoutPayment",
  "Cross-Border": "crossBorder",
  "Terms Not Disclosed": "termsNotDisclosed",
  "Leveraged Buyout (LBO)": "lbo",
  "Reverse Merger": "reverseMerger",
  "Backdoor IPO": "backdoorIpo",
  "Corporate Divestiture": "corporateDivestiture",
  "Management Participated": "managementParticipated",
  "Bankruptcy Sale": "bankruptcySale",
  "Add-on/Bolt-on/Consolidation/Tuck-in": "addOn",
  "Minority Shareholder Increasing Ownership Stake": "minorityIncreasingStake",
  "Minority Shareholder Gaining Majority Control": "minorityGainingMajority",
  "Tender Offer": "tenderOffer"
};

export const acquisitionFilters = dateRanges.flatMap(dateRange =>
  Object.values(acquisitionDealTypeMap).flatMap((dealType) =>
    acquisitionStatus.flatMap((status) =>
      acquirerMarketCaps.flatMap((acquirerMarketCap) =>
        acquisitionSizeByTransactionValues.flatMap((sizeByTransactionValue) =>
          acquisitionPublicOrPrivates.flatMap((publicOrPrivate) =>
            acquisitionsNumbers.flatMap((acquisitionsNumber) => acquisitionTypes.map(acquisitionType => ({
              dateRange: dateRange.type,
              sizeByTransactionValue,
              publicOrPrivate,
              acquisitionsNumber,
              acquirerMarketCap,
              status,
              dealType,
              acquisitionType
            })))
          )
        )
      )
    )
  )
);

const checkBuyerMarketValueNotNull = (company) => {
  if (company.buyer.marketValue === null) {
    throw new Error(`buyer marketValue should never be null as it should have been filtered out in pre-processing.`)
  };
}

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

export const getFilterSharePriceIndexData = (companyData, sharePriceData, indexPriceData, minMarketCapForAnalyzingInM) => {
  const uniqueCompaniesAcquisitionsData = groupByBuyerIdentifier(companyData);

  const filterSharePriceIndexData = ({
    dateRange,
    status,
    acquisitionType,
    dealType,
    publicOrPrivate,
    acquirerMarketCap,
    sizeByTransactionValue,
    acquisitionsNumber
  }) => {
    const isInDateRange = company => {
      const { start, end } = dateRanges.find(x => x.type === dateRange);
      const announcedDate = new Date(company.announcedDate);

      return announcedDate >= new Date(start) && announcedDate <= new Date(end);
    };

    const isCorrectAcquisitionType = (company) => {
      if (acquisitionType === 'all') return true;

      return acquisitionType === 'minority' ? company.isMinorityAcquisition : !company.isMinorityAcquisition;
    }

    const isCorrectAcquisitionStatus = (company) => {
      if (status === 'all') return true;

      return status === 'withdrawn/terminated' ? company.isWithdrawn : !company.isWithdrawn;
    }

    const isCorrectAcquisitionPublicOrPrivate = (company) => {
      if (publicOrPrivate === 'all') return true;

      return publicOrPrivate === 'public' ? company.seller.isPublicCompany : !company.seller.isPublicCompany;
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
      checkBuyerMarketValueNotNull(company);

      if (sizeByTransactionValue === 'all') return true;
      if (company.transactionSize === null) return false;

      const transactionSizeRelativeToBuyerMarketValue = company.transactionSize / company.buyer.marketValue;
      if (transactionSizeRelativeToBuyerMarketValue < 0) return false;

      if (sizeByTransactionValue === '0-2%') return transactionSizeRelativeToBuyerMarketValue < 0.02;
      if (sizeByTransactionValue === '2-10%') return transactionSizeRelativeToBuyerMarketValue >= 0.02 && transactionSizeRelativeToBuyerMarketValue < 0.1;
      if (sizeByTransactionValue === '10-25%') return transactionSizeRelativeToBuyerMarketValue >= 0.1 && transactionSizeRelativeToBuyerMarketValue < 0.25;
      if (sizeByTransactionValue === '25-50%') return transactionSizeRelativeToBuyerMarketValue >= 0.25 && transactionSizeRelativeToBuyerMarketValue < 0.5;
      if (sizeByTransactionValue === '50-100%') return transactionSizeRelativeToBuyerMarketValue >= 0.5 && transactionSizeRelativeToBuyerMarketValue < 1;

      return true;
    }

    const isCorrectMarketCapValue = (company) => {
      checkBuyerMarketValueNotNull(company);

      if (company.buyer.marketValue < minMarketCapForAnalyzingInM) {
        throw new Error(`buyer marketValues should never be less than ${minMarketCapForAnalyzingInM}m as they should be filtered out in pre-processing to stop weird values.`)
      }

      if (acquirerMarketCap === 'all') return true;
      if (acquirerMarketCap === '10m-50m') return company.buyer.marketValue >= 10 && company.buyer.marketValue < 50;
      if (acquirerMarketCap === '50m-300m') return company.buyer.marketValue >= 50 && company.buyer.marketValue < 300;
      if (acquirerMarketCap === '300m-2b') return company.buyer.marketValue >= 300 && company.buyer.marketValue < 2000;
      if (acquirerMarketCap === '2b-10b') return company.buyer.marketValue >= 2000 && company.buyer.marketValue < 10000;
      if (acquirerMarketCap === '10b-200b') return company.buyer.marketValue >= 10000 && company.buyer.marketValue < 200000;

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
        isCorrectMarketCapValue(company) &&
        isInDateRange(company)) {

        filteredSharePriceData.push(sharePriceData[i]);
        filteredIndexPriceData.push(indexPriceData[i]);
      }
    }

    return [filteredSharePriceData, filteredIndexPriceData];
  }

  return filterSharePriceIndexData;
};