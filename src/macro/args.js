export const parseArguments = () => {
  const args = process.argv.slice(2);

  const parsedArgs = {
    regionToAnalyze: args[0],
  };

  return parsedArgs;
}
