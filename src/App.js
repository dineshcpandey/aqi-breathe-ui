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

    // Apply filtering logic based on the realistic data structure
    return aqiData.filter(item => {
      let shouldInclude = false;

      // Air Quality filters
      if (activeFilters.airQuality && activeFilters.airQuality.length > 0) {
        activeFilters.airQuality.forEach(filter => {
          switch (filter) {
            case 'aqi':
              if (item.aqi > 150) shouldInclude = true; // Show high AQI areas
              break;
            case 'pm25':
              if (item.pm25 && item.pm25 > 100) shouldInclude = true; // Show high PM2.5 areas
              break;
            case 'rh':
              if (item.rh && item.rh < 40) shouldInclude = true; // Show low humidity (dusty conditions)
              break;
            case 'co':
              if (item.co && item.co > 2.0) shouldInclude = true; // Show high CO areas
              break;
            default:
              break;
          }
        });
      }

      // Source filters
      if (activeFilters.sources && activeFilters.sources.length > 0) {
        if (activeFilters.sources.includes(item.source)) {
          shouldInclude = true;
        }
      }

      return shouldInclude;
    });
  }, [aqiData, getActiveFilters]);

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