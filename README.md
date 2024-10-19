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
First of all, correlation does not equal causation, however we can see the following from the output graphs:

### Overall

- US companies destroyed value overall after they announced the acquisition. They stock prices dropped by -8.18% by month 20 and then started rebounding but by month 29 they were still down by -5.07%.

Possible causes of the rebound could be that managament have impaired and written off goodwill related to the acquisition by this point and realised they have overpaid or most of the acquisition related distractions on business performance has passed at this point.

- UK companies actually created value overall. Modest in the first 20 months, beating the FTSE All Share Index by 3% but by month 29 the gain over the index from these compaies was 10.20%. TODO: Add why.

Note: The UK has a lower total sample size of 10k~ companies, whereas the US has 40k~ companies, however 10k should still be more than enough.

### By Type of Acquisition

I won't go through all of these, you can see the output chart for yourself, however I will comment on the main patterns.

In both the US and UK their was a very similar pattern.

- Bankruptcy acquisitions were by far the most profitable, resulting in an average abnormal cumulative return since acquisition of 52.77% over 29 months. This makes sense because when companies go bankrupt they do firesales on their assets which means the acquirers can buy them for cheap, including the entire business. The sample size was only 112 companies though so take this with more of a grain of salt.

- LBO was the second most profitable acquisition type for both US and UK which was very surprising to see. It seems that loading up on debt and acquiring a company seems to produce good returns above the SPX & ASX indexes. Maybe this is because the acquiring company quickly sells down the debt and steamlines the business after by selling non-core assets? I'm not sure but the sample size of 2669 is large and so this is quite clear.

- Management Participated acquisitions seem to do decend as well, giving 8.22% abnormal returns for US and 32% for UK. This might be explained by management putting their own money in as part of the deal so they are more incentivized or confident that the acquisition is correct. Note the small sample size for US companies of 120 and UK of 149 though.

- Larger cap acquirers seem to perform significantly better than smaller cap acquirers. TODO: Double check data seems wrong for >$200b.

- Companies that do multiple acquisitions still destroy value, but they destroy much less value than companies that do a single acquisition. You can see companies that did a single acquisition had a -60% return for the US and -15% for the UK. This had a large sample size of 3355 as well.

Maybe single acquirers are less experienced on what to look for or more likely to overpay?

- Cash deals give signifcantly higher returns than stock deals do. US companies cash deals gave 5.55% whereas the stock deals gave -45.29% since the acquisition announcements. A massive difference. This might be explained by acquiring companies being more likely to issue stock for acquisitions if they think their company is overvalued. An overvalued acquirer is going to drop more than a non-overvalued one in the long term. The sample size for cash deals was 16561 and for stock it was 3859 for the US, both very large sample sizes.

- Companies that have acquired others from 2016 - Today have performed signficantly worse for the US than they did from 2000-2007. Whereas the opposite happened for UK companies. I have no real explanation for why this could be.

- Smaller acquisitions relative to the acquirers market cap destroyed less value than larger acquisitions. If you see the size of 2-10% they returned -8.5% for US companies whereas 50-100% returned -15%. The sample sizes for these are large as well.

- Minority acquisitions did not do any better than majority acquisitions which is also surprising. Note the sample size of 3k whereas majority had a 40k sample size.

- Withdrawn & terminated acquisitions surprisingly destroy an insane amount of value still as well. This might be because of the costs and distraction that happens when pursuing the acquisition.

- Reverse mergers and backdoor ipos seem to be insanely value destructive for US and UK companies and should never be done in any circumstance.

So in summary, we can have some actions that investors should always take if they hold companies that acquirer other companies:

1. If the company is a US company and is NOT doing an acquisition of a bankrupt company or an LBO then you should immediately sell the acquiring company as it will likely destroy shareholder value.

2. If the company is a UK company then you will want to look at the chart and see what combination the acquisition deal is being done in.

You can also see the other tab charts for more information on the best and worst combinations.

For exmaple if you click on 'Worst returns since acquisition' for US companies you can see that the worst possible combination is this one:

```json
{"dateRange":"2016-today","sizeByTransactionValue":"all","publicOrPrivate":"private","acquisitionsNumber":"all","acquirerMarketCap":"all","status":"completed","dealType":"stockDeal","acquisitionType":"majority"} (Count: 598)
```

If you want to see which specific combination your companies acquisition will return, you can check out the `outputRaw/acquisitions/${region}.json` file to see the entire dump of all combinations and find the same combination that matches your company.

Note: If their is a small `count` number then that's because the sample size is very small for that combination and shouldn't be relied upon.

In the above charts I threw away combinations that had < 500 sample size so that we could get relevant results.

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
- "Total Transaction Value"
- "SPCIQ ID (Buyer/Investor)"
- "SPCIQ ID (Target/Issuer)"
- "Target: Market Capitalization"

Then I clicked 'export' to export to csv in S&PCapitalIQ Pro. Note how the `"Buyer: Market Capitalization"` column is missing from the above, this is because S&PCapitalIQ display columns did not contain this information. So after I exported the results I had to open it in Excel and add this column manually to the end: "Buyer: Market Capitalization".

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