import React, { useState } from 'react';
import Header from './components/Header/Header';
import MapContainer from './components/MapContainer/MapContainer';
import FilterPane from './components/FilterPane/FilterPane';
import { useFilters } from './hooks/useFilters';
import { anandViharAQIData } from './utils/dummyData';
import './App.css';

function App() {
  const [aqiData, setAqiData] = useState(anandViharAQIData);
  const [selectedMapStyle, setSelectedMapStyle] = useState('osm');
  const [showAQILayer, setShowAQILayer] = useState(false); // Let user control this manually

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

    // Debug logging
    console.log('Active filters:', activeFilters);
    console.log('Total data points:', aqiData.length);

    // If no filters are active, return empty array (show nothing)
    if (Object.keys(activeFilters).length === 0 ||
      ((!activeFilters.airQuality || activeFilters.airQuality.length === 0) &&
        (!activeFilters.sources || activeFilters.sources.length === 0))) {
      console.log('No active filters - showing 0 points');
      return [];
    }

    // Apply filtering logic based on the realistic data structure
    const filtered = aqiData.filter(item => {
      let shouldInclude = false;

      // Air Quality filters - if ANY air quality filter is active, check thresholds
      if (activeFilters.airQuality && activeFilters.airQuality.length > 0) {
        activeFilters.airQuality.forEach(filter => {
          switch (filter) {
            case 'aqi':
              if (item.aqi >= 150) shouldInclude = true; // Show unhealthy and above
              break;
            case 'pm25':
              if (item.pm25 && item.pm25 >= 75) shouldInclude = true; // Show high PM2.5 areas
              break;
            case 'rh':
              if (item.rh && item.rh <= 45) shouldInclude = true; // Show low humidity (dusty conditions)
              break;
            case 'co':
              if (item.co && item.co >= 1.5) shouldInclude = true; // Show elevated CO areas
              break;
            default:
              break;
          }
        });
      }

      // Source filters - if ANY source filter is active, include matching sources
      if (activeFilters.sources && activeFilters.sources.length > 0) {
        if (activeFilters.sources.includes(item.source)) {
          shouldInclude = true;
        }
      }

      return shouldInclude;
    });

    console.log('Filtered data points:', filtered.length);
    return filtered;
  }, [aqiData, getActiveFilters]);

  // Note: User has manual control over AQI layer visibility via the toggle button

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