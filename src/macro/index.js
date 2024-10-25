import fs from 'fs/promises';
import path from 'path';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { rootDirPath } from '../utils.js';
import { parseArguments } from './args.js';
import {
  processRealGDP,
  processCPIH,
  processInterestRates,
  processSavingsRate,
  processIndexPrices,
  processBondYields,
  processM4MoneySupply,
  processNominalGDP,
  processPMIComposite,
  processCDS,
  processCCI
} from './processData.js';
import { calculateVelocityOfMoney } from './calculations.js';

const inputMacroPath = path.join(rootDirPath, 'data', 'input/macro');
const outputMacroPath = path.join(rootDirPath, 'data', 'output/macro');

dayjs.extend(customParseFormat);

const writeJsonToFile = async (data, filePath) => {
  const jsonString = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonString, 'utf8');
};

const main = async () => {
  const args = parseArguments();
  const regionToAnalyze = args.regionToAnalyze;
  const regionInputPath = path.join(inputMacroPath, regionToAnalyze);

  const files = {
    realGDP: await fs.readFile(path.join(regionInputPath, 'real_gdp.csv'), 'utf8'),
    nominalGDP: await fs.readFile(path.join(regionInputPath, 'nominal_gdp.csv'), 'utf8'),
    pmiComposite: await fs.readFile(path.join(regionInputPath, 'pmi_composite.csv'), 'utf8'),
    cds: await fs.readFile(path.join(regionInputPath, 'cds.csv'), 'utf8'),
    cci: await fs.readFile(path.join(regionInputPath, 'cci.csv'), 'utf8'),
    cpih: await fs.readFile(path.join(regionInputPath, 'cpih.csv'), 'utf8'),
    interestRates: await fs.readFile(path.join(regionInputPath, 'interest_rates.csv'), 'utf8'),
    savingsRate: await fs.readFile(path.join(regionInputPath, 'savings_rate.csv'), 'utf8'),
    m4MoneySupply: await fs.readFile(path.join(regionInputPath, 'm4_money_supply.csv'), 'utf8'),
    indexPrices: await fs.readFile(path.join(regionInputPath, 'small_cap_index_prices.csv'), 'utf8'),
    bondYields: await fs.readFile(path.join(regionInputPath, '10_year_government_bond_yield.csv'), 'utf8')
  };

  const processedData = {
    realGDP: processRealGDP(files.realGDP),
    nominalGDP: processNominalGDP(files.nominalGDP),
    cpih: processCPIH(files.cpih),
    pmiComposite: processPMIComposite(files.pmiComposite),
    cds: processCDS(files.cds),
    cci: processCCI(files.cci),
    interestRates: processInterestRates(files.interestRates),
    savingsRate: processSavingsRate(files.savingsRate),
    indexPrices: processIndexPrices(files.indexPrices),
    m4MoneySupply: processM4MoneySupply(files.m4MoneySupply),
    bondYields: processBondYields(files.bondYields)
  };

  processedData.velocityOfMoney = calculateVelocityOfMoney(
    processedData.nominalGDP,
    processedData.m4MoneySupply
  );

  await writeJsonToFile(
    processedData,
    path.join(outputMacroPath, `${regionToAnalyze}.json`)
  );

  process.exit(0);
};

main();