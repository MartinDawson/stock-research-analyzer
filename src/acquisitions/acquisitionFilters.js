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

export const getFilterSharePriceIndexData = (companyData, sharePriceData, indexPriceData) => {
  // Pre-process data
  const buyerIdentifierMap = new Map();
  const dealTypesSet = new Set();
  const processedData = [];

  // Helper function to compare dates
  const compareDates = (date1, date2) => {
    return date1.getTime() - date2.getTime();
  };

  // Single loop to process all data
  for (let i = 0; i < companyData.length; i++) {
    const company = companyData[i];
    const sharePrice = sharePriceData[i];
    const indexPrice = indexPriceData[i];

    const buyerId = company.buyer.identifier;
    if (!buyerIdentifierMap.has(buyerId)) {
      buyerIdentifierMap.set(buyerId, []);
    }
    buyerIdentifierMap.get(buyerId).push(i);

    company.dealTypes.forEach(type => dealTypesSet.add(type));

    const announcedDate = new Date(company.announcedDate);

    let transactionSizeRelative = null;
    if (company.transactionSize !== null && company.buyer.marketValue !== null) {
      transactionSizeRelative = company.transactionSize / company.buyer.marketValue;
    }

    processedData.push({
      index: i,
      announcedDate,
      isMinorityAcquisition: company.isMinorityAcquisition,
      isWithdrawn: company.isWithdrawn,
      isPublicCompany: company.isPublicCompany,
      transactionSizeRelative,
      dealTypes: company.dealTypes,
      sharePrice,
      indexPrice,
      buyerId
    });
  }

  const filterSharePriceIndexData = (filters) => {
    const { dateRange, status, type, dealType, publicOrPrivate, sizeByTransactionValue, acquisitionsNumber } = filters;
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    const filteredSharePrices = [];
    const filteredIndexPrices = [];

    for (const item of processedData) {
      // Date range check
      if (compareDates(item.announcedDate, startDate) < 0 || compareDates(item.announcedDate, endDate) > 0) {
        continue;
      }

      // Acquisition type check
      if (type !== 'all' && item.isMinorityAcquisition !== (type === 'minority')) {
        continue;
      }

      // Acquisition status check
      if (status !== 'all' && item.isWithdrawn !== (status === 'withdrawn/terminated')) {
        continue;
      }

      // Public or private check
      if (publicOrPrivate !== 'all' && item.isPublicCompany !== (publicOrPrivate === 'public')) {
        continue;
      }

      // Number of acquisitions check
      const numberOfAcquisitions = buyerIdentifierMap.get(item.buyerId).length;
      if (acquisitionsNumber !== 'all') {
        if (acquisitionsNumber === '1' && numberOfAcquisitions !== 1) continue;
        if (acquisitionsNumber === '2-5' && (numberOfAcquisitions < 2 || numberOfAcquisitions >= 5)) continue;
        if (acquisitionsNumber === '5-20' && (numberOfAcquisitions < 5 || numberOfAcquisitions >= 20)) continue;
        if (acquisitionsNumber === '>20' && numberOfAcquisitions <= 20) continue;
      }

      // Size by transaction value check
      if (sizeByTransactionValue !== 'all') {
        if (item.transactionSizeRelative === null) continue;
        if (sizeByTransactionValue === '0-2%' && (item.transactionSizeRelative < 0 || item.transactionSizeRelative >= 0.02)) continue;
        if (sizeByTransactionValue === '2-10%' && (item.transactionSizeRelative < 0.02 || item.transactionSizeRelative >= 0.1)) continue;
        if (sizeByTransactionValue === '10-25%' && (item.transactionSizeRelative < 0.1 || item.transactionSizeRelative >= 0.25)) continue;
        if (sizeByTransactionValue === '25-50%' && (item.transactionSizeRelative < 0.25 || item.transactionSizeRelative >= 0.5)) continue;
        if (sizeByTransactionValue === '50-100%' && (item.transactionSizeRelative < 0.5 || item.transactionSizeRelative >= 1)) continue;
        if (sizeByTransactionValue === '>100%' && item.transactionSizeRelative <= 1) continue;
      }

      // Deal type check
      if (dealType !== 'all' && !item.dealTypes.includes(dealType)) {
        continue;
      }

      // If we've made it here, the item passes all filters
      filteredSharePrices.push(item.sharePrice);
      filteredIndexPrices.push(item.indexPrice);
    }

    return [filteredSharePrices, filteredIndexPrices];
  };

  return filterSharePriceIndexData;
};