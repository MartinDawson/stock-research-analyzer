export const parseArguments = () => {
  const args = process.argv.slice(2);

  const parsedArgs = {
    regionToAnalyze: args[0],
    outputTopNumberCount: 30,
    minMarketCapForAnalyzingInM: 10,
    minAmountOfCompaniesInEachSampleSizeForTopOutput: 500,
  };

  for (let i = 3; i < args.length; i += 2) {
    switch (args[i]) {
      case '--outputTopNumberCount':
        parsedArgs.outputTopNumberCount = parseInt(args[i + 1]);
        break;
      case '--minMarketCapForAnalyzingInM':
        parsedArgs.minMarketCapForAnalyzingInM = parseInt(args[i + 1]);
        break;
      case '--minAmountOfCompaniesInEachSampleSizeForTopOutput':
        parsedArgs.minAmountOfCompaniesInEachSampleSizeForTopOutput = parseInt(args[i + 1]);
        break;
    }
  }

  return parsedArgs;
}
