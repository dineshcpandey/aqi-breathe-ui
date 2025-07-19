import React, { useState } from 'react';
import Header from './components/Header/Header';
import MapContainer from './components/MapContainer/MapContainer';
import { sampleAQIData } from './utils/constants';
import './App.css';

function App() {
  const [aqiData, setAqiData] = useState(sampleAQIData);
  const [selectedMapStyle, setSelectedMapStyle] = useState('osm');
  const [showAQILayer, setShowAQILayer] = useState(false);

  const addAQIData = (newData) => {
    setAqiData(prevData => [...prevData, ...newData]);
  };

  return (
    <div className="app">
      <Header />
      <MapContainer
        aqiData={aqiData}
        selectedMapStyle={selectedMapStyle}
        showAQILayer={showAQILayer}
        onMapStyleChange={setSelectedMapStyle}
        onAQIToggle={setShowAQILayer}
        onAddAQIData={addAQIData}
      />
    </div>
  );
}

export default App;