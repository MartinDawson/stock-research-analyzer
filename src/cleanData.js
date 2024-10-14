const checkIfDataIsValid = (records) => {
  records.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      if (cell === 0) {
        throw new Error(`Cell value of 0 is not valid for indexes ${ri}:${ci}. Must be null or a non-zero number.`);
      }

      if (cell !== null && !Number.isFinite(cell)) {
        throw new Error(`Cell value type is not valid for indexes ${ri}:${ci}. Must be null or a number.`);
      }
    });
  });
};

const convertEmptyData = (records) => {
  return records.map((row) => {
    return row.map((cell) => {
      if (cell === '' || cell === 0) {
        return null;
      }
      return cell;
    });
  });
};

const convertBadPriceData = (records) => {
  checkIfDataIsValid(records);

  return records.map((row) => {
    let shouldNullify = false;

    for (let ci = 1; ci < row.length; ci++) {
      const prevValue = row[ci - 1];
      const currentValue = row[ci];

      if (prevValue === null || currentValue === null) {
        continue;
      }

      const percentageChange = (currentValue - prevValue) / prevValue * 100;

      // Probably a bad data issue if percentage change monthly is > 1000% so remove the entire row.
      // Same when it's less than 100%
      if (percentageChange > 1000 || percentageChange < -100) {
        shouldNullify = true;
        break;
      }
    }

    if (shouldNullify) {
      return row.map(() => null);
    }
    return row;
  });
};

export const filterOutCompaniesAndPricesWhereMarketCapIsTooSmall = (companyData, sharePriceData, indexPriceData, minMarketCapForAnalyzingInM) => {
  const filteredIndices = companyData.reduce((indices, company, index) => {
    if (company.buyer.marketValue !== null && company.buyer.marketValue >= minMarketCapForAnalyzingInM) {
      indices.push(index);
    }
    return indices;
  }, []);

  const filteredCompanyData = filteredIndices.map(index => companyData[index]);
  const filteredSharePriceData = filteredIndices.map(index => sharePriceData[index]);
  const filteredIndexPriceData = filteredIndices.map(index => indexPriceData[index]);

  return [filteredCompanyData, filteredSharePriceData, filteredIndexPriceData];
}

export const convertBadPriceDataToNull = (records) => {
  const convertedNonEmptyData = convertEmptyData(records)
  const convertedData = convertBadPriceData(convertedNonEmptyData);

  return convertedData;
}