import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

const calculatePercentageChange = (data) => {
  if (data.length < 2) return [];

  return data.map((item, index) => {
    if (index === 0) return { ...item, percentageChange: 0 };
    const previousValue = data[index - 1].value;
    const currentValue = item.value;
    const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
    return { ...item, percentageChange };
  });
};

const alignDataToQuarterly = (data, getValue) => {
  const quarterlyData = {};

  data.forEach(item => {
    const date = new Date(item.date);
    const quarter = Math.floor(date.getMonth() / 3);
    const key = `${date.getFullYear()}-Q${quarter + 1}`;
    if (!quarterlyData[key]) {
      quarterlyData[key] = [];
    }
    quarterlyData[key].push(getValue(item));
  });

  return Object.entries(quarterlyData)
    .map(([date, values]) => ({
      date,
      value: values.reduce((sum, val) => sum + val, 0) / values.length
    }))
    .sort((a, b) => {
      const [yearA, qA] = a.date.split('-Q');
      const [yearB, qB] = b.date.split('-Q');
      return yearA - yearB || qA - qB;
    });
};

const calculateCorrelation = (data1, data2) => {
  if (data1.length !== data2.length) return null;

  const n = data1.length;
  const mean1 = data1.reduce((sum, val) => sum + val, 0) / n;
  const mean2 = data2.reduce((sum, val) => sum + val, 0) / n;

  const variance1 = data1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0);
  const variance2 = data2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0);

  const covariance = data1.reduce((sum, val, i) =>
    sum + ((val - mean1) * (data2[i] - mean2)), 0);

  return covariance / Math.sqrt(variance1 * variance2);
};

const MacroCharts = ({ country }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState({
    metric1: 'cpih',
    metric2: 'm4MoneySupply'
  });
  const [viewType, setViewType] = useState('absolute');
  const [lagPeriods, setLagPeriods] = useState(0);
  const [correlationValue, setCorrelationValue] = useState(null);

  useEffect(() => {
    fetch(`output/macro/${country.toLowerCase()}.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(jsonData => {
        setData(jsonData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError(error.message);
        setIsLoading(false);
      });
  }, [country]);

  useEffect(() => {
    if (!data) return;

    // Get aligned data
    const metric1Data = alignDataToQuarterly(
      data[selectedMetrics.metric1],
      item => selectedMetrics.metric1 === 'indexPrices' ? item.ftseAllShare : item.value
    );

    const metric2Data = alignDataToQuarterly(
      data[selectedMetrics.metric2],
      item => selectedMetrics.metric2 === 'indexPrices' ? item.ftseAllShare : item.value
    );

    if (!metric1Data.length || !metric2Data.length) {
      setCorrelations([]);
      setCorrelationValue(null);
      return;
    }

    // Calculate percentage changes
    const processedMetric1 = viewType === 'percentage' ? calculatePercentageChange(metric1Data) : metric1Data;
    const processedMetric2 = viewType === 'percentage' ? calculatePercentageChange(metric2Data) : metric2Data;

    if (viewType === 'absolute') {
      // For absolute values, create pairs directly
      const correlationPairs = processedMetric1
        .filter((d1) => {
          const d2 = processedMetric2.find(x => x.date === d1?.date);

          return d2 && d1.value !== null && d2.value !== null;
        })
        .map((d1) => {
          const value2 = processedMetric2.find(x => x.date === d1?.date).value;

          return {
            date: d1.date,
            value1: d1.value,
            value2
          }
        });

      const correlation = calculateCorrelation(
        correlationPairs.map(p => p.value1),
        correlationPairs.map(p => p.value2)
      );

      setCorrelationValue(correlation);
      setCorrelations(correlationPairs);
    } else {
      // For percentage changes with lag
      if (processedMetric2.length <= lagPeriods) {
        setCorrelations([]);
        setCorrelationValue(null);
        return;
      }

      const laggedMetric2 = processedMetric2.slice(lagPeriods);
      const trimmedMetric1 = processedMetric1.slice(0, processedMetric2.length - lagPeriods);

      const correlationPairs = trimmedMetric1
        .filter((d1) => {
          const d2 = laggedMetric2.find(x => x.date === d1?.date);

          return d2 &&
            d1.percentageChange !== null &&
            !isNaN(d1.percentageChange) &&
            d2.percentageChange !== null &&
            !isNaN(d2.percentageChange);
        })
        .map((d1) => {
          const value2 = laggedMetric2.find(x => x.date === d1?.date)?.percentageChange;

          return {
            date: d1.date,
            value1: d1.percentageChange,
            value2
          }
        });

      if (correlationPairs.length < 2) {
        setCorrelations([]);
        setCorrelationValue(null);
        return;
      }

      const correlation = calculateCorrelation(
        correlationPairs.map(p => p.value1),
        correlationPairs.map(p => p.value2)
      );

      setCorrelationValue(correlation);
      setCorrelations(correlationPairs);
    }
  }, [data, selectedMetrics, viewType, lagPeriods]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data || !correlations.length) return <div>No data available</div>;

  const metricLabels = {
    interestRates: 'Interest Rates',
    indexPrices: 'FTSE All Share',
    m4MoneySupply: 'M4 Money Supply',
    velocityOfMoney: 'Velocity of Money',
    pmiComposite: 'PMI Composite',
    cds: 'CDS',
    cci: 'CCI',
    cpih: 'CPIH',
    realGDP: 'Real GDP',
    savingsRate: 'Savings Rate',
    bondYields: '10Y Bond Yields'
  };

  return (
    <div className="w-full p-4">
      <h1 className="text-2xl font-bold mb-4">Macro Economic Correlations</h1>

      <div className="mb-4 flex gap-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">View Type</h3>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="view-type"
                value="absolute"
                checked={viewType === 'absolute'}
                onChange={(e) => setViewType(e.target.value)}
              />
              <span className="ml-2">Absolute Values</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="view-type"
                value="percentage"
                checked={viewType === 'percentage'}
                onChange={(e) => setViewType(e.target.value)}
              />
              <span className="ml-2">{'Quarterly'} Changes</span>
            </label>
          </div>
        </div>

        {viewType === 'percentage' && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Lag Quarters</h3>
            <input
              type="number"
              className="px-4 py-2 border rounded w-24"
              value={lagPeriods}
              onChange={(e) => setLagPeriods(parseInt(e.target.value) || 0)}
              min="0"
              max={16}
            />
          </div>
        )}

        {correlationValue !== null && (
          <div className="ml-8">
            <h3 className="text-sm font-semibold mb-2">Correlation Coefficient</h3>
            <div className="text-lg">{correlationValue.toFixed(3)}</div>
          </div>
        )}
      </div>

      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Time Series Comparison</h2>
        {viewType === 'percentage' && (
          <p className="text-sm text-gray-600 mb-2">
            Showing {metricLabels[selectedMetrics.metric2]} lagged by {lagPeriods} quarters
          </p>
        )}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={correlations} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                yAxisId="left"
                label={{
                  value: metricLabels[selectedMetrics.metric1],
                  angle: -90,
                  position: 'insideLeft'
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{
                  value: `${metricLabels[selectedMetrics.metric2]}${viewType === 'percentage' ?
                    ` (Lagged ${lagPeriods} 'Q')` : ''}`,
                  angle: 90,
                  position: 'insideRight'
                }}
              />
              <Tooltip
                formatter={(value) => viewType === 'percentage' ? `${value.toFixed(2)}%` : value.toFixed(2)}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="value1"
                stroke="#8884d8"
                name={metricLabels[selectedMetrics.metric1]}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="value2"
                stroke="#82ca9d"
                name={`${metricLabels[selectedMetrics.metric2]}${viewType === 'percentage' ?
                  ` (Lagged ${lagPeriods} 'Q')` : ''}`}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Correlation Scatter Plot</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="value1"
                name={metricLabels[selectedMetrics.metric1]}
                label={{
                  value: metricLabels[selectedMetrics.metric1],
                  position: 'bottom'
                }}
              />
              <YAxis
                type="number"
                dataKey="value2"
                name={metricLabels[selectedMetrics.metric2]}
                label={{
                  value: `${metricLabels[selectedMetrics.metric2]}${viewType === 'percentage' ?
                    ` (Lagged ${lagPeriods} 'Q')` : ''}`,
                  angle: -90,
                  position: 'insideLeft'
                }}
              />
              <Tooltip
                formatter={(value) => viewType === 'percentage' ? `${value.toFixed(2)}%` : value.toFixed(2)}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter name="Values" data={correlations} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Select Metrics to Compare</h2>
        <div className="flex gap-4">
          <select
            className="px-4 py-2 border rounded"
            value={selectedMetrics.metric1}
            onChange={(e) => setSelectedMetrics(prev => ({ ...prev, metric1: e.target.value }))}
          >
            {Object.entries(metricLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            className="px-4 py-2 border rounded"
            value={selectedMetrics.metric2}
            onChange={(e) => setSelectedMetrics(prev => ({ ...prev, metric2: e.target.value }))}
          >
            {Object.entries(metricLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default MacroCharts;