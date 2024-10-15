import { describe, it, expect } from 'vitest';
import { getFilterSharePriceIndexData } from './acquisitionFilters';

describe('getFilterSharePriceIndexData', () => {
  const mockCompanyData = [
    {
      buyer: { identifier: 'buyer1', marketValue: 1000 },
      seller: { isPublicCompany: true },
      announcedDate: '1995-01-01',
      isMinorityAcquisition: false,
      isWithdrawn: false,
      transactionSize: 100,
      dealTypes: ['cashDeal']
    },
    {
      buyer: { identifier: 'buyer2', marketValue: 2000 },
      seller: { isPublicCompany: false },
      announcedDate: '2017-06-01',
      isMinorityAcquisition: true,
      isWithdrawn: true,
      isPublicCompany: false,
      transactionSize: 300,
      dealTypes: ['stockDeal', 'crossBorder']
    },
    {
      buyer: { identifier: 'buyer3', marketValue: 5000 },
      seller: { isPublicCompany: true },
      announcedDate: '2020-01-01',
      isMinorityAcquisition: false,
      isWithdrawn: false,
      transactionSize: 1250,
      dealTypes: ['lbo', 'cashDeal']
    },
    {
      buyer: { identifier: 'buyer4', marketValue: 10000 },
      seller: { isPublicCompany: false },
      announcedDate: '2023-06-01',
      isMinorityAcquisition: false,
      isWithdrawn: false,
      transactionSize: 6000,
      dealTypes: ['reverseMerger', 'stockDeal']
    },
    {
      buyer: { identifier: 'buyer3', marketValue: 5500 },
      seller: { isPublicCompany: true },
      announcedDate: '2023-06-01',
      isMinorityAcquisition: false,
      isWithdrawn: false,
      transactionSize: 50,
      dealTypes: ['bankruptcySale']
    },
  ];

  const mockSharePriceData = [
    [100, 110, 120],
    [200, 210, 220],
    [300, 310, 320],
    [400, 410, 420],
    [350, 350, 350],
  ];

  const mockIndexPriceData = [
    [1000, 1100, 1200],
    [2000, 2100, 2200],
    [3000, 3100, 3200],
    [4000, 4100, 4200],
    [3500, 3500, 3500]
  ];

  const filterFunction = getFilterSharePriceIndexData(mockCompanyData, mockSharePriceData, mockIndexPriceData);

  it('should filter by date range', () => {
    const filters = {
      dateRange: '2016-today',
      status: 'all',
      acquisitionType: 'all',
      dealType: 'all',
      publicOrPrivate: 'all',
      sizeByTransactionValue: 'all',
      acquisitionsNumber: 'all'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([[200, 210, 220], [300, 310, 320], [400, 410, 420], [350, 350, 350]]);
    expect(filteredIndexPrices).toEqual([[2000, 2100, 2200], [3000, 3100, 3200], [4000, 4100, 4200], [3500, 3500, 3500]]);
  });

  it('should filter by acquisition type', () => {
    const filters = {
      dateRange: 'all',
      status: 'all',
      acquisitionType: 'minority',
      dealType: 'all',
      publicOrPrivate: 'all',
      sizeByTransactionValue: 'all',
      acquisitionsNumber: 'all'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([[200, 210, 220]]);
    expect(filteredIndexPrices).toEqual([[2000, 2100, 2200]]);
  });

  it('should filter by acquisition status', () => {
    const filters = {
      dateRange: 'all',
      status: 'withdrawn/terminated',
      acquisitionType: 'all',
      dealType: 'all',
      publicOrPrivate: 'all',
      sizeByTransactionValue: 'all',
      acquisitionsNumber: 'all'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([[200, 210, 220]]);
    expect(filteredIndexPrices).toEqual([[2000, 2100, 2200]]);
  });

  it('should filter by public or private', () => {
    const filters = {
      dateRange: 'all',
      status: 'all',
      acquisitionType: 'all',
      dealType: 'all',
      publicOrPrivate: 'public',
      sizeByTransactionValue: 'all',
      acquisitionsNumber: 'all'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([[100, 110, 120], [300, 310, 320], [350, 350, 350]]);
    expect(filteredIndexPrices).toEqual([[1000, 1100, 1200], [3000, 3100, 3200], [3500, 3500, 3500]]);
  });

  it('should filter by deal type', () => {
    const filters = {
      dateRange: 'all',
      status: 'all',
      acquisitionType: 'all',
      dealType: 'cashDeal',
      publicOrPrivate: 'all',
      sizeByTransactionValue: 'all',
      acquisitionsNumber: 'all'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([[100, 110, 120], [300, 310, 320]]);
    expect(filteredIndexPrices).toEqual([[1000, 1100, 1200], [3000, 3100, 3200]]);
  });

  it('should filter by transaction size', () => {
    const filters = {
      dateRange: 'all',
      status: 'all',
      acquisitionType: 'all',
      dealType: 'all',
      publicOrPrivate: 'all',
      sizeByTransactionValue: '10-25%',
      acquisitionsNumber: 'all'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([[100, 110, 120], [200, 210, 220]]);
    expect(filteredIndexPrices).toEqual([[1000, 1100, 1200], [2000, 2100, 2200]]);
  });

  it('should return empty arrays when no data matches the filters', () => {
    const filters = {
      dateRange: '2016-today',
      status: 'all',
      acquisitionType: 'all',
      dealType: 'minorityGainingMajority',
      publicOrPrivate: 'all',
      sizeByTransactionValue: 'all',
      acquisitionsNumber: 'all'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([]);
    expect(filteredIndexPrices).toEqual([]);
  });

  it('should filter by date range and deal type', () => {
    const filters = {
      dateRange: '2016-today',
      status: 'all',
      acquisitionType: 'all',
      dealType: 'stockDeal',
      publicOrPrivate: 'all',
      sizeByTransactionValue: 'all',
      acquisitionsNumber: 'all'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([[200, 210, 220], [400, 410, 420]]);
    expect(filteredIndexPrices).toEqual([[2000, 2100, 2200], [4000, 4100, 4200]]);
  });

  it('should filter by acquisition type and public/private status', () => {
    const filters = {
      dateRange: 'all',
      status: 'all',
      acquisitionType: 'majority',
      dealType: 'all',
      publicOrPrivate: 'public',
      sizeByTransactionValue: 'all',
      acquisitionsNumber: 'all'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([[100, 110, 120], [300, 310, 320], [350, 350, 350]]);
    expect(filteredIndexPrices).toEqual([[1000, 1100, 1200], [3000, 3100, 3200], [3500, 3500, 3500]]);
  });

  it('should filter by transaction size and acquisition status', () => {
    const filters = {
      dateRange: 'all',
      status: 'completed',
      acquisitionType: 'all',
      dealType: 'all',
      publicOrPrivate: 'all',
      sizeByTransactionValue: '50-100%',
      acquisitionsNumber: 'all'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([[400, 410, 420]]);
    expect(filteredIndexPrices).toEqual([[4000, 4100, 4200]]);
  });

  it('should filter by multiple deal types', () => {
    const filters = {
      dateRange: 'all',
      status: 'all',
      acquisitionType: 'all',
      dealType: 'cashDeal',
      publicOrPrivate: 'all',
      sizeByTransactionValue: 'all',
      acquisitionsNumber: 'all'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([[100, 110, 120], [300, 310, 320]]);
    expect(filteredIndexPrices).toEqual([[1000, 1100, 1200], [3000, 3100, 3200]]);
  });

  it('should filter by acquisition number and date range', () => {
    const filters = {
      dateRange: '2016-today',
      status: 'all',
      acquisitionType: 'all',
      dealType: 'all',
      publicOrPrivate: 'all',
      sizeByTransactionValue: 'all',
      acquisitionsNumber: '2-5'
    };
    const [filteredSharePrices, filteredIndexPrices] = filterFunction(filters);
    expect(filteredSharePrices).toEqual([[300, 310, 320], [350, 350, 350]]);
    expect(filteredIndexPrices).toEqual([[3000, 3100, 3200], [3500, 3500, 3500]]);
  });
});