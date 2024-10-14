export const parseArguments = () => {
  const args = process.argv.slice(2);

  const parsedArgs = {
    companyDataFile: args[0],
    sharePriceDataFile: args[1],
    indexPriceDataFile: args[2],
    outputTopNumberCount: 30,
    minMarketCapForAnalyzingInM: 10,
    minAmountOfCompaniesInEachSampleSize: 500,
  };

  for (let i = 3; i < args.length; i += 2) {
    switch (args[i]) {
      case '--outputTopNumberCount':
        parsedArgs.outputTopNumberCount = parseInt(args[i + 1]);
        break;
      case '--minMarketCapForAnalyzingInM':
        parsedArgs.minMarketCapForAnalyzingInM = parseInt(args[i + 1]);
        break;
      case '--minAmountOfCompaniesInEachSampleSize':
        parsedArgs.minAmountOfCompaniesInEachSampleSize = parseInt(args[i + 1]);
        break;
    }
  }

  return parsedArgs;
}
