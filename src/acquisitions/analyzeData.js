import { analyzeData } from "../analyze.js";
import dayjs from 'dayjs';

const today = dayjs().format('YYYY-MM-DD')

export const getFunctionsToAnalyze = (companyData, sharePriceData, indexPriceData) => {
  const dateRanges = [
    { label: 'All Time', start: '1900-01-01', end: today },
    { label: '2000-2007', start: '2000-01-01', end: '2007-12-31' },
    { label: '2008-2015', start: '2008-01-01', end: '2015-12-31' },
    { label: '2016-Today', start: '2016-01-01', end: today }
  ];

  const acquisitionTypes = [
    { label: 'Majority', predicate: (_, i) => !companyData[i].isMinorityAcquisition },
    { label: 'Minority', predicate: (_, i) => companyData[i].isMinorityAcquisition }
  ];

  const createAnalysisFunction = (predicate, dateRange) => () => {
    const isInDateRange = company =>
      dayjs(company.announcedDate).isAfter(dateRange.start) &&
      dayjs(company.announcedDate).isBefore(dateRange.end);

    const dateFilteredCompanyData = companyData.filter(isInDateRange);

    const combinedPredicate = (_, i) =>
      predicate(_, i) && isInDateRange(companyData[i]);

    const filteredSharePriceData = sharePriceData.filter(combinedPredicate);
    const filteredIndexPriceData = indexPriceData.filter(combinedPredicate);

    return analyzeData(dateFilteredCompanyData, filteredSharePriceData, filteredIndexPriceData);
  };

  return dateRanges.flatMap(dateRange =>
    acquisitionTypes.map(acquisitionType => ({
      label: `${acquisitionType.label} Acquisitions (${dateRange.label})`,
      func: createAnalysisFunction(acquisitionType.predicate, dateRange)
    }))
  );
};