import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { sentenceCase } from "change-case";
import { customSentenceCase, formatPercentage } from '../utils';

const AcquisitionCharts = ({ country }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [returnType, setReturnType] = useState('abnormal');

  useEffect(() => {
    fetch(`output/acquisitions/${country.toLowerCase()}.json`)
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const chartTypes = Object.keys(data).filter(key => key !== 'allAcquisitionsReturn').map((key) => ({
    name: sentenceCase(key), key
  }));

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#001CCE', '#00B3E6', '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D', '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A'];

  const getReturnKey = () => returnType === 'abnormal' ? 'averageCumulativeAbnormalReturnsSinceAcquisition' : 'averageCumulativeReturnsSinceAcquisition';

  const renderAllAcquisitionsChart = (allAcquisitionsData) => {
    if (!allAcquisitionsData) return null;

    const returnKey = getReturnKey();
    const chartData = allAcquisitionsData.months.map((month, index) => ({
      month,
      returns: allAcquisitionsData[returnKey][index],
      count: allAcquisitionsData.counts[index],
    })).filter(item => item.returns !== null);

    return (
      <div className="w-full mb-8">
        <h2 className="text-xl font-semibold mb-2">All Acquisitions Returns</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                label={{ value: 'Months Since Acquisition', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                tickFormatter={formatPercentage}
                label={{ value: `Cumulative ${returnType === 'abnormal' ? 'Abnormal ' : ''}Returns`, angle: -90, position: 'insideLeft', offset: 10 }}
              />
              <Tooltip
                formatter={(value, name) => [formatPercentage(value), 'Returns']}
                labelFormatter={(value) => `Month: ${value}`}
              />
              <Legend />
              <Bar dataKey="returns" fill="#8884d8" name={`Cumulative ${returnType === 'abnormal' ? 'Abnormal ' : ''}Returns`} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2">Total Sample Size: {allAcquisitionsData.count}</p>
      </div>
    );
  };

  const renderChart = (chartData, chartType) => {
    if (!chartData) {
      return <div>No data available</div>;
    }

    const returnKey = getReturnKey();

    if (chartType === 'typeOfAcquisition') {
      const dataArray = Object.entries(chartData).flatMap(([key, value]) =>
        value.map(item => ({
          ...item,
          category: key
        }))
      );

      const sortedData = dataArray
        .sort((a, b) => b[returnKey] - a[returnKey])
        .map((datum) => ({
          ...datum,
          label: customSentenceCase(`${datum.category} ${datum.type}`)
        }));

      return (
        <div className="w-full h-[800px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatPercentage} />
              <YAxis
                dataKey="label"
                type="category"
                tick={{ angle: 0, textAnchor: 'end', fontSize: 12 }}
                width={400}
                interval={0}
              />
              <Tooltip formatter={formatPercentage} />
              <Legend />
              <Bar dataKey="averageCumulativeAbnormalReturnSinceAcquisition" fill="#8884d8" name="Avg Abnormal returns Since Acquisition" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    // For other chart types
    const xAxisKey = 'months';

    const processedData = chartData[0][xAxisKey].map((x, i) => {
      const point = { [xAxisKey]: x };
      chartData.forEach((dataset, index) => {
        point[`data${index}`] = dataset[returnKey][i];
      });
      return point;
    }).filter(item => Object.values(item).some(val => val !== null && val !== undefined));

    const CustomizedLegend = ({ payload }) => (
      <div className="mt-4 max-h-60 overflow-y-auto">
        <ul className="list-none p-0">
          {payload.map((entry, index) => (
            <li key={`item-${index}`} className="inline-flex items-center mr-4 mb-2">
              <svg width="10" height="10" className="mr-1">
                <rect width="10" height="10" fill={entry.color} />
              </svg>
              <span className="text-sm">{entry.value} (Count: {entry.count})</span>
            </li>
          ))}
        </ul>
      </div>
    );

    return (
      <div className="w-full">
        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisKey}
                label={{ value: 'Months Since Acquisition', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                tickFormatter={formatPercentage}
                label={{ value: `Cumulative ${returnType === 'abnormal' ? 'Abnormal ' : ''}Returns`, angle: -90, position: 'insideLeft' }}
              />
              {chartData.map((dataset, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={`data${index}`}
                  stroke={colors[index % colors.length]}
                  name={dataset.filters ? JSON.stringify(dataset.filters) : `Dataset ${index + 1}`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <CustomizedLegend payload={chartData.map((dataset, index) => ({
          count: dataset.count,
          value: dataset.filters ? JSON.stringify(dataset.filters) : `Dataset ${index + 1}`,
          color: colors[index % colors.length]
        }))} />
      </div>
    );
  };

  return (
    <div className="w-full p-4">
      <h1 className="text-2xl font-bold mb-4">Acquisition Performance Charts</h1>

      <div className="mb-4">
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="return-type"
              value="abnormal"
              checked={returnType === 'abnormal'}
              onChange={(e) => setReturnType(e.target.value)}
            />
            <span className="ml-2">Abnormal Returns</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="return-type"
              value="absolute"
              checked={returnType === 'absolute'}
              onChange={(e) => setReturnType(e.target.value)}
            />
            <span className="ml-2">Absolute Returns</span>
          </label>
        </div>
      </div>

      {renderAllAcquisitionsChart(data?.allAcquisitionsReturn)}

      <div className="mb-4">
        {chartTypes.map((type, index) => (
          <button
            key={type.key}
            className={`px-4 py-2 mr-2 rounded ${activeTab === index ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab(index)}
          >
            {type.name}
          </button>
        ))}
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">{chartTypes[activeTab].name}</h2>
        {renderChart(data[chartTypes[activeTab].key], chartTypes[activeTab].key)}
      </div>
    </div>
  );
};

export default AcquisitionCharts;