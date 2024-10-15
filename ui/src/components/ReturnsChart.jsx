import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReturnsChart = () => {
  const [chartData, setChartData] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/output/acquisitions/us/topReturns.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const months = data.worstReturnsSinceAcquisition[0].months;
        const processedData = months.map((month, i) => {
          const dataPoint = { month };
          data.worstReturnsSinceAcquisition.forEach((dataset, index) => {
            dataPoint[`returns${index}`] = dataset.averageCumulativeAbnormalReturnsSinceAcquisition[i];
          });
          return dataPoint;
        }).filter(item => Object.values(item).some(val => val !== null && val !== undefined));

        setChartData(processedData);
        setDatasets(data.worstReturnsSinceAcquisition);
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

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#001CCE', '#00B3E6', '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D', '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A'];

  return (
    <div className="w-full h-screen flex flex-col">
      <h2 className="text-xl font-bold mb-4">Worst Returns Since Acquisition</h2>
      <div className="flex-grow flex">
        <div className="w-3/4 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottomRight', offset: -10 }} />
              <YAxis label={{ value: 'Average Cumulative Abnormal Returns', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {datasets.map((dataset, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={`returns${index}`}
                  stroke={colors[index % colors.length]}
                  name={dataset.label}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/4 h-full overflow-y-auto p-4 bg-gray-100">
          <h3 className="font-bold mb-2">Legend</h3>
          {datasets.map((dataset, index) => (
            <div key={index} className="flex items-center mb-2">
              <div className="w-4 h-4 mr-2" style={{ backgroundColor: colors[index % colors.length] }}></div>
              <span className="text-sm">{dataset.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReturnsChart;