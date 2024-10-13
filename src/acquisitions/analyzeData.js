import { analyzeData } from "../analyze.js";

export const getFunctionsToAnalyze = (companyData, sharePriceData, indexPriceData) => {
  const majorityAcquisition = () => {
    const isMajorityAcquisitionPredicate = (_, i) => !companyData[i].isMinorityAcquisition
    const filteredSharePriceData = sharePriceData.filter(isMajorityAcquisitionPredicate);
    const filteredIndexPriceData = indexPriceData.filter(isMajorityAcquisitionPredicate);

    return analyzeData(companyData, filteredSharePriceData, filteredIndexPriceData);
  }

  const minorityAcquisition = () => {
    const isMinorityAcquisitionPredicate = (_, i) => companyData[i].isMinorityAcquisition
    const filteredSharePriceData = sharePriceData.filter(isMinorityAcquisitionPredicate);
    const filteredIndexPriceData = indexPriceData.filter(isMinorityAcquisitionPredicate);

    return analyzeData(companyData, filteredSharePriceData, filteredIndexPriceData);
  }

  return [
    { label: 'Majority Acquisitions', func: majorityAcquisition },
    { label: 'Minority Acquisitions', func: minorityAcquisition },
  ]
}
