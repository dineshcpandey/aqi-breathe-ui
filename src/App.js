import React, { useState } from 'react';
import Header from './components/Header/Header';
import MapContainer from './components/MapContainer/MapContainer';
import FilterPane from './components/FilterPane/FilterPane';
import { useFilters } from './hooks/useFilters';
//import { sampleAQIData } from './utils/constants';
import { anandViharAQIData } from './utils/dummyData';
import './App.css';

export const sampleAQIData = anandViharAQIData;

function App() {
  const [aqiData, setAqiData] = useState(sampleAQIData);
  const [selectedMapStyle, setSelectedMapStyle] = useState('osm');
  const [showAQILayer, setShowAQILayer] = useState(false);

  const {
    filters,
    isFilterPaneVisible,
    handleFilterChange,
    toggleFilterPane,
    getActiveFilters
  } = useFilters();

  const addAQIData = (newData) => {
    setAqiData(prevData => [...prevData, ...newData]);
  };

  // Filter data based on active filters
  const filteredAqiData = React.useMemo(() => {
    const activeFilters = getActiveFilters();

    // If no filters are active, return all data
    if (Object.keys(activeFilters).length === 0) {
      return aqiData;
    }

    // Apply filtering logic here based on your data structure
    return aqiData.filter(item => {
      // Example filtering logic - customize based on your data structure
      if (activeFilters.airQuality) {
        // Filter based on AQI thresholds, PM2.5 values, etc.
        if (activeFilters.airQuality.includes('aqi') && item.aqi > 100) return true;
        if (activeFilters.airQuality.includes('pm25') && item.pm25 > 35) return true;
      }

      if (activeFilters.sources) {
        // Filter based on pollution sources
        if (activeFilters.sources.includes('vehicle') && item.source === 'vehicle') return true;
        if (activeFilters.sources.includes('construction') && item.source === 'construction') return true;
        if (activeFilters.sources.includes('dust') && item.source === 'dust') return true;
      }

      return false;
    });
  }, [aqiData, filters]);

  return (
    <div className="app">
      <Header />

      <FilterPane
        filters={filters}
        onFilterChange={handleFilterChange}
        isVisible={isFilterPaneVisible}
        onToggleVisibility={toggleFilterPane}
      />

      <MapContainer
        aqiData={filteredAqiData}
        selectedMapStyle={selectedMapStyle}
        showAQILayer={showAQILayer}
        onMapStyleChange={setSelectedMapStyle}
        onAQIToggle={setShowAQILayer}
        onAddAQIData={addAQIData}
        filtersVisible={isFilterPaneVisible}
      />
    </div>
  );
}

export default App;
