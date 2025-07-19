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
    // Use filters directly instead of getActiveFilters to avoid stale closure issues
    const activeFilters = {
      airQuality: Object.keys(filters.airQuality).filter(key => filters.airQuality[key]),
      sources: Object.keys(filters.sources).filter(key => filters.sources[key])
    };

    // Debug logging
    console.log('=== FILTERING DEBUG ===');
    console.log('Raw filters state:', filters);
    console.log('Active filters:', activeFilters);
    console.log('Total data points:', aqiData.length);

    // Check if any filters are actually active
    const hasAirQualityFilters = activeFilters.airQuality && activeFilters.airQuality.length > 0;
    const hasSourceFilters = activeFilters.sources && activeFilters.sources.length > 0;
    const hasAnyFilters = hasAirQualityFilters || hasSourceFilters;

    if (!hasAnyFilters) {
      console.log('No active filters - showing 0 points');
      return [];
    }

    console.log('Has air quality filters:', hasAirQualityFilters, activeFilters.airQuality);
    console.log('Has source filters:', hasSourceFilters, activeFilters.sources);

    // Apply filtering logic
    const filtered = aqiData.filter(item => {
      let shouldInclude = false;

      // Air Quality filters
      if (hasAirQualityFilters) {
        activeFilters.airQuality.forEach(filter => {
          switch (filter) {
            case 'aqi':
              if (item.aqi >= 150) {
                shouldInclude = true;
                console.log(`Including ${item.station} for AQI filter (${item.aqi})`);
              }
              break;
            case 'pm25':
              if (item.pm25 && item.pm25 >= 75) {
                shouldInclude = true;
                console.log(`Including ${item.station} for PM2.5 filter (${item.pm25})`);
              }
              break;
            case 'rh':
              if (item.rh && item.rh <= 45) {
                shouldInclude = true;
                console.log(`Including ${item.station} for RH filter (${item.rh})`);
              }
              break;
            case 'co':
              if (item.co && item.co >= 1.5) {
                shouldInclude = true;
                console.log(`Including ${item.station} for CO filter (${item.co})`);
              }
              break;
            default:
              break;
          }
        });
      }

      // Source filters
      if (hasSourceFilters) {
        if (activeFilters.sources.includes(item.source)) {
          shouldInclude = true;
          console.log(`Including ${item.station} for source filter (${item.source})`);
        }
      }

      return shouldInclude;
    });

    console.log('Filtered data points:', filtered.length);
    console.log('Filtered stations:', filtered.map(item => item.station));
    console.log('=== END FILTERING DEBUG ===');

    return filtered;
  }, [aqiData, filters]); // Use filters directly instead of getActiveFilters

  // Debug: Log when filtered data changes
  React.useEffect(() => {
    console.log('Filtered AQI data changed:', filteredAqiData.length, 'points');

    // Auto-enable AQI layer when there are filtered results
    if (filteredAqiData.length > 0 && !showAQILayer) {
      console.log('Auto-enabling AQI layer since we have filtered data');
      setShowAQILayer(true);
    }
  }, [filteredAqiData, showAQILayer]);

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