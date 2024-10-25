import dayjs from 'dayjs';
import { parse } from 'csv-parse/sync';

export const START_DATE = '1988-01-01';

const isValidNumber = (value) => {
  const number = parseFloat(value);
  return Number.isFinite(number);
};

const convertToDecimal = (value) => {
  return parseFloat(value) / 100;
};

const parseDateFormats = (dateStr) => {
  // Handle DD MMM YY format (e.g., "01 Aug 24")
  const shortYearMatch = dateStr.match(/(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2})/i);
  if (shortYearMatch) {
    const day = shortYearMatch[1];
    const month = shortYearMatch[2];
    let year = parseInt(shortYearMatch[3]);
    // Convert 2-digit year to 4-digit year
    year = year + (year >= 50 ? 1900 : 2000);
    const monthMap = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    return dayjs(`${year}-${monthMap[month.toLowerCase()]}-${day}`);
  }

  // Handle YYYY MMM format (e.g., "1989 JAN")
  const monthMatch = dateStr.match(/(\d{4})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/);
  if (monthMatch) {
    const year = monthMatch[1];
    const month = monthMatch[2];
    const monthMap = {
      'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    };
    return dayjs(`${year}-${monthMap[month]}-01`);
  }

  // Handle YYYY Q[Q] format (e.g., "1988 Q1")
  const quarterMatch = dateStr.match(/(\d{4})\s*Q(\d)/);
  if (quarterMatch) {
    const year = quarterMatch[1];
    const quarter = quarterMatch[2];
    const monthMap = { '1': '01', '2': '04', '3': '07', '4': '10' };
    return dayjs(`${year}-${monthMap[quarter]}-01`);
  }

  // Try other common formats
  const formats = [
    'YYYY-MM-DD',
    'M/D/YYYY',
    'DD/MM/YYYY',
    'YYYY MMM'
  ];

  for (const format of formats) {
    const parsed = dayjs(dateStr, format);
    if (parsed.isValid()) {
      return parsed;
    }
  }

  return null;
};

const fillMonthlyGaps = (data) => {
  if (!data.length) return [];

  // Sort data by date first
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

  const filledData = [];
  let currentDate = dayjs(sortedData[0].date);
  const endDate = dayjs(sortedData[sortedData.length - 1].date);

  let lastKnownRate = sortedData[0].value;
  let dataIndex = 0;

  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'month')) {
    // Check if we have a rate change for this month
    while (dataIndex < sortedData.length &&
      dayjs(sortedData[dataIndex].date).isSame(currentDate, 'month')) {
      lastKnownRate = sortedData[dataIndex].value;
      dataIndex++;
    }

    filledData.push({
      date: currentDate.startOf('month').toDate(),
      value: lastKnownRate
    });

    currentDate = currentDate.add(1, 'month');
  }

  return filledData;
};

export const processInterestRates = (content) => {
  const records = parse(content, { columns: true });
  const startDate = dayjs(START_DATE);

  // First process the raw data
  const processedRates = records
    .filter(row => {
      const date = parseDateFormats(row.Date);
      return date && date.isAfter(startDate);
    })
    .map(row => ({
      date: parseDateFormats(row.Date).toDate(),
      value: isValidNumber(row.Rate) ? convertToDecimal(row.Rate) : null
    }))
    .filter(item => item.value !== null)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Then fill in the gaps
  return fillMonthlyGaps(processedRates);
};

export const processCCI = (content) => {
  const records = parse(content, { columns: true });
  const startDate = dayjs(START_DATE).valueOf();

  return records
    .filter(row => {
      const date = parseDateFormats(row.Date);
      return date && date.valueOf() >= startDate;
    })
    .map(row => ({
      date: parseDateFormats(row.Date).toDate(),
      value: isValidNumber(row['Consumer Confidence Index (OECD)']) ?
        parseFloat(row['Consumer Confidence Index (OECD)']) : null
    }))
    .sort((a, b) => a.date - b.date);
};

export const processPMIComposite = (content) => {
  const records = parse(content, { columns: true });
  const startDate = dayjs(START_DATE).valueOf();

  return records
    .filter(row => {
      const date = parseDateFormats(row.Date);
      return date && date.valueOf() >= startDate;
    })
    .map(row => ({
      date: parseDateFormats(row.Date).toDate(),
      value: isValidNumber(row.PMI) ? parseFloat(row.PMI) : null
    }))
    .sort((a, b) => a.date - b.date);
};

export const processCDS = (content) => {
  const records = parse(content, { columns: true });
  const startDate = dayjs(START_DATE).valueOf();

  return records
    .filter(row => {
      const date = parseDateFormats(row.Date);
      return date && date.valueOf() >= startDate;
    })
    .map(row => ({
      date: parseDateFormats(row.Date).toDate(),
      value: isValidNumber(row.CDS) ? parseFloat(row.CDS) : null
    }))
    .sort((a, b) => a.date - b.date);
};

export const processM4MoneySupply = (content) => {
  const records = parse(content, { columns: true });
  const startDate = dayjs(START_DATE).valueOf();

  return records
    .filter(row => {
      const date = parseDateFormats(row.Date);
      return date && date.valueOf() >= startDate;
    })
    .map(row => ({
      date: parseDateFormats(row.Date).toDate(),
      value: isValidNumber(row.Supply) ? parseFloat(row.Supply) : null
    }))
    .sort((a, b) => a.date - b.date);
};

export const processNominalGDP = (content) => {
  const records = parse(content, { columns: true });
  const startDate = dayjs(START_DATE).valueOf();

  return records
    .filter(row => {
      const date = parseDateFormats(row.Date);
      return date && date.valueOf() >= startDate;  // Compare timestamps
    })
    .map(row => ({
      date: parseDateFormats(row.Date).toDate(),
      value: isValidNumber(row['Nominal GDP']) ? parseFloat(row['Nominal GDP']) : null
    }))
    .sort((a, b) => a.date - b.date);
};

export const processRealGDP = (content) => {
  const records = parse(content, { columns: true });
  const startDate = dayjs(START_DATE).valueOf();

  return records
    .filter(row => {
      const date = parseDateFormats(row.Date);
      return date && date.valueOf() >= startDate;  // Compare timestamps
    })
    .map(row => ({
      date: parseDateFormats(row.Date).toDate(),
      value: isValidNumber(row['Real GDP']) ? parseFloat(row['Real GDP']) : null
    }))
    .sort((a, b) => a.date - b.date);
};

export const processCPIH = (content) => {
  const records = parse(content, { columns: true });
  const startDate = dayjs(START_DATE).valueOf();

  return records
    .filter(row => {
      const date = parseDateFormats(row.Date);
      return date && date.valueOf() >= startDate;
    })
    .map(row => ({
      date: parseDateFormats(row.Date).toDate(),
      value: isValidNumber(row.CPIH) ? parseFloat(row.CPIH) : null
    }))
    .sort((a, b) => a.date - b.date);
};

export const processSavingsRate = (content) => {
  const records = parse(content, { columns: true });
  const startDate = dayjs(START_DATE).valueOf();

  return records
    .filter(row => {
      const date = parseDateFormats(row.Date);
      return date && date.valueOf() >= startDate;
    })
    .map(row => ({
      date: parseDateFormats(row.Date).toDate(),
      value: isValidNumber(row['Household Savings Percentage']) ?
        convertToDecimal(row['Household Savings Percentage']) : null
    }))
    .sort((a, b) => a.date - b.date);
};

export const processIndexPrices = (content) => {
  const records = parse(content, { columns: true });
  const startDate = dayjs(START_DATE).valueOf();

  return records
    .filter(row => {
      const [dateStr] = Object.values(row); // Get first column value as date
      const date = parseDateFormats(dateStr);
      return date && date.valueOf() >= startDate;
    })
    .map(row => {
      const [dateStr, allShare, smallCap] = Object.values(row);
      return {
        date: parseDateFormats(dateStr).toDate(),
        ftseAllShare: isValidNumber(allShare) ? parseFloat(allShare) : null,
        ftseSmallCap: isValidNumber(smallCap) ? parseFloat(smallCap) : null
      };
    })
    .sort((a, b) => a.date - b.date);
};

export const processBondYields = (content) => {
  const records = parse(content, { columns: true });
  const startDate = dayjs(START_DATE).valueOf();

  return records
    .filter(row => {
      const date = parseDateFormats(row.Date);
      return date && date.valueOf() >= startDate;
    })
    .map(row => ({
      date: parseDateFormats(row.Date).toDate(),
      value: isValidNumber(row.Yield) ? convertToDecimal(row.Yield) : null
    }))
    .sort((a, b) => a.date - b.date);
};