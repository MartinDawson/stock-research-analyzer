import React, { useState } from 'react';
import MacroCharts from './MacroCharts';

const MacroDashboard = () => {
  const [activeCountry, setActiveCountry] = useState('uk');

  return (
    <div className="w-full p-4">
      <h1 className="text-3xl font-bold mb-6">Macro Dashboard</h1>

      <div className="mb-6">
        <button
          className={`px-6 py-2 mr-4 rounded text-lg ${activeCountry === 'us' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveCountry('us')}
        >
          United States
        </button>
        <button
          className={`px-6 py-2 rounded text-lg ${activeCountry === 'uk' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveCountry('uk')}
        >
          United Kingdom
        </button>
      </div>

      <MacroCharts country={activeCountry} />
    </div>
  );
};

export default MacroDashboard;