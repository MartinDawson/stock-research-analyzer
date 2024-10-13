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

export const acquisitionConditions = dateRanges.flatMap(dateRange =>
  acquisitionDealTypes.flatMap((dealType) =>
    acquisitionStatus.flatMap((status) =>
      acquisitionTypes.map(acquisitionType => ({
        label: `(${acquisitionType.label})/(${dealType.label})/(${status.label})/(${dateRange.label})`,
        dateRange,
        status: status.type,
        dealType: dealType.type,
        type: acquisitionType.type
      }))
    )
  )
);
