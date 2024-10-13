import dayjs from 'dayjs';

const today = dayjs().format('YYYY-MM-DD');

const dateRanges = [
  { label: 'All Time', start: '1900-01-01', end: today },
  { label: '2000-2007', start: '2000-01-01', end: '2007-12-31' },
  { label: '2008-2015', start: '2008-01-01', end: '2015-12-31' },
  { label: '2016-Today', start: '2016-01-01', end: today }
];

const acquisitionTypes = [
  { label: 'Majority', type: 'majority' },
  { label: 'Minority', type: 'minority' }
];

export const acquisitionConditions = dateRanges.flatMap(dateRange =>
  acquisitionTypes.map(acquisitionType => ({
    label: `${acquisitionType.label} Acquisitions (${dateRange.label})`,
    dateRange,
    acquisitionType: acquisitionType.type
  }))
);
