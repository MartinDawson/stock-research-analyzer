import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { sentenceCase } from "change-case";

function customSentenceCase(str) {
  const parts = str.split(/([^a-zA-Z0-9]+)/);
  return parts.map((part, index) => {
    if (/[a-zA-Z0-9]/.test(part)) {
      return index === 0 ? sentenceCase(part) : part.toLowerCase();
    }
    return part;
  }).join('');
}

const AcquisitionCharts = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetch('/output/acquisitionsTopUS.json')
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
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const chartTypes = [
    { name: 'Type of Acquisition', key: 'typeOfAcquisition' },
    { name: 'Worst Returns', key: 'worstReturnsSinceAcquisition' },
    { name: 'Best Returns', key: 'bestReturnsSinceAcquisition' },
    { name: 'Worst Drawdowns', key: 'worstDrawdowns' },
    { name: 'Best Peaks', key: 'bestPeaks' }
  ];

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#001CCE', '#00B3E6', '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D', '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A'];

  const renderChart = (chartData, chartType) => {
    if (!chartData || chartData.length === 0) return <div>No data available</div>;

    if (chartType === 'typeOfAcquisition') {
      const sortedData = [...chartData].sort((a, b) => b.averageReturnSinceAcquisition - a.averageReturnSinceAcquisition).map((datum) => {
        return {
          ...datum,
          label: customSentenceCase(datum.filter)
        }
      });

      return (
        <div className="w-full h-[800px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="label"
                type="category"
                tick={{ angle: 0, textAnchor: 'end', fontSize: 12 }}
                width={400}
                interval={0}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageReturnSinceAcquisition" fill="#8884d8" name="Avg Return Since Acquisition" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    // For other chart types
    const xAxisKey = 'months';
    const yAxisKey = 'averageCumulativeAbnormalReturnsSinceAcquisition';

    const processedData = chartData[0][xAxisKey].map((x, i) => {
      const point = { [xAxisKey]: x };
      chartData.forEach((dataset, index) => {
        point[`data${index}`] = dataset[yAxisKey][i];
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
              <XAxis dataKey={xAxisKey} />
              <YAxis />
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