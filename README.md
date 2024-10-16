# stock-research-analyzer

Pre-requirements to run:

- Node (tested on node 20.x)
- Git

## To Run

- Git clone git@github.com:MartinDawson/stock-research-analyzer.git
- In your terminal do `cd stock-research-analyzer`
- `npm install`

Then you can run the scripts in `package.json` `scripts` sections.

For example to acquisitions, run:

`npm run analyze`

It will take a few minutes to run, depending on the power of your PC and how many cores you have.

It will output the result in `./data/output` with the top highlights & `./data/outputRaw` with the entire dump for every combination.

## Why?

It's important to understand with data and testing how shareholder value is created & destroyed in the long run, this repo will have lots of these research tests & results in. Acquisitions are a prime example of destruction, see Aswath Damodaran's video here: https://youtu.be/LzWrsLhXPa0?t=616

I wanted to go further than Aswath Damodaran does and test every combination so we can see exactly when to sell and buy companies.

There will be more to come such as how shareholder compensation affects prices, if you have any ideas just ask me and I will consider it as well.

I tried it in Excel first but the logic needed is far too complex and much easier to do in code.

## Results
### Acquisitions
TODO

## Data validation
The most important thing in analysis is clean data or the results are useless. I've taken great care in cleaning the data and validating it by doing the following:

- Using S&PCapitalIQPro which doesn't have survivorship bias in the results & has high quality data.
- Ran the `cleanData.js` functions before processing which does the following for share price & index data:

1. Converts `''` & `0` to `null` values in.
2. Checks if any percentageChange between 2 numbers is `> 1000%` & `< 100%`, if it is it sets the entire row to be null values as this is most likely bad data rather than a real Month-On-Month change of share prices.
3. Filters out companies that have <$10m in marketCap size (`minMarketCapForAnalyzingInM` in the args). This is needed to stop nano-caps which have ridicilous % changes sometimes Month-On-Month. These don't really reflect true shareholder value either, just liquidity issues & pumps/dumps a lot of times.
4. A bunch of tests in `acquisitionFilters.test.js` & `calculate.test.js`. You can verify them with `npm run test`.

I also tested using `math.js` to remove any chance of [`numerical instability`](https://en.wikipedia.org/wiki/Numerical_stability) when calculating cumulative Month-On-Month changes in share prices, however the slowdown in processing speed wasn't worth the tiny bit extra in precision. The small floating point errors don't effect the results either so it was redundant.

## Source Data
Source data in `./data/input/*` is in csv format and from S&PCapitalIQPro.

If you want to put your own data here you will need an S&PCapitalIQPro license or equivalent.

Here's an example of the S&PCapitalIQPro transactions screener criteria I ran to get the data for US acquisitions if you want to do the same:

Transactions: New Screen
Screening Criteria: 
1                 Actual Acquirer Country/Region In USA
2    And     Actual Acquirer Ticker Is Not NA 
3    And     Transaction Type In Acquisition of Whole Company (incl. Majority Stake);Acquisition of Minority Stake
4    And     Announced Date (mm/dd/yyyy) Between 07/31/2000 - 10/06/2024

And for the 'Display' columns that were exported I had the following:

- Target/Issuer Name
- MI Transaction ID
- "Announced Date MM/dd/yyyy"
- Transaction Type
- M&A Feature Type
- Transaction Status
- "Total Transaction Value ($M)"
- "SPCIQ ID (Buyer/Investor)"
- "SPCIQ ID (Target/Issuer)"
- "Target: Market Capitalization ($M)"

Then I clicked 'export' to export to csv in S&PCapitalIQ Pro. Note how the `"Buyer: Market Capitalization ($M)"` column is missing from the above, this is because S&PCapitalIQ display columns did not contain this information. So after I exported the results I had to open it in Excel and add this column manually to the end: "Buyer: Market Capitalization ($M)".

The value in each row for this is this formula: `=CIQ(Identifier,"IQ_MARKETCAP",Date)` to get the market cap value (requires S&PCapitalIQPro excel license.)


## Arguments
You can run the script with different values for arguments too, i.e here's the command that's run by default:

```bash
node ./src/acquisitions/index.js us --outputTopNumberCount 30 --minMarketCapForAnalyzingInM 10 --minAmountOfCompaniesInEachSampleSize 500"
```

`outputTopNumberCount` -> Default 30: number of results to output for the `./data/output/acquisitionsTopUS.json` file: `worstReturnsSinceAcquisition`, `bestReturnsSinceAcquisition`, `worstDrawdowns`, `bestPeaks`.

Note: `allReturns` always returns everything that matches your other params anyway and ignores this flag.

`minMarketCapForAnalyzingInM` -> Default 10: this is recommended because really small nano caps < $10m in marketcap have some ridicilous percentage changes, you can increase this though if you want only larger market caps in your analysis.

`minAmountOfCompaniesInEachSampleSize` -> Default 500: this determines how much the sample sizes of `worstReturnsSinceAcquisition`, `bestReturnsSinceAcquisition`, `bestPeaks` and `worstDrawdowns` need to have a minimum of. If you didn't have this then the top results in these arrays would be ones with really low sample sizes and useless for drawing any conclusions on.

In the `returns.json` the sample size counts are shown for each month as well so you can see if the values are too small, i.e:

```json
  "counts": [
        0, 697, 695, 693, 693, 689, 688, 685, 679, 677, 672, 666, 657, 649, 643, 637, 633, 626, 619, 609, 
      607, 596, 586, 575, 570, 561, 555, 542, 525, 513, 491, 453, 419, 386, 348
  ], 
```