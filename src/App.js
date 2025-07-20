import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import MapContainer from './components/MapContainer/MapContainer';
import FilterPane from './components/FilterPane/FilterPane';
import { useFilters } from './hooks/useFilters';
import { generateSampleSourceGridData, applyAirQualityThresholds, getSourceStatistics } from './utils/sourceBasedGridGenerator';
import './App.css';

function App() {
  // Source-based grid data instead of point data
  const [sourceGridData, setSourceGridData] = useState(null);
  const [selectedMapStyle, setSelectedMapStyle] = useState('osm');
  const [showDataLayer, setShowDataLayer] = useState(false);

  const {
    filters,
    isFilterPaneVisible,
    handleFilterChange,
    toggleFilterPane,
    getActiveFilters
  } = useFilters();

  // Load source-based grid data on component mount
  useEffect(() => {
    console.log('Loading source-based grid data...');
    const data = generateSampleSourceGridData();
    setSourceGridData(data);

    console.log(`Generated ${data.grids.length} grid cells with source contributions`);
    console.log('Grid data metadata:', data.metadata);
  }, []);

  // Process filtered data based on active filters
  const { filteredGridData, activeSourceFilters, activeAirQualityFilters, sourceStats } = React.useMemo(() => {
    if (!sourceGridData) {
      return {
        filteredGridData: null,
        activeSourceFilters: [],
        activeAirQualityFilters: [],
        sourceStats: {}
      };
    }

    const activeFilters = getActiveFilters();

    // Get active source filters
    const activeSources = activeFilters.sources || [];
    const activeAirQuality = activeFilters.airQuality || [];

    console.log('=== FILTERING DEBUG ===');
    console.log('Active source filters:', activeSources);
    console.log('Active air quality filters:', activeAirQuality);
    console.log('Total grid cells:', sourceGridData.grids.length);

    if (activeSources.length === 0) {
      console.log('No source filters active - showing 0 grids');
      return {
        filteredGridData: { ...sourceGridData, grids: [] },
        activeSourceFilters: [],
        activeAirQualityFilters: activeAirQuality,
        sourceStats: {}
      };
    }

    // Apply air quality thresholds first
    let filteredGrids = applyAirQualityThresholds(sourceGridData.grids, activeAirQuality);

    console.log(`After air quality thresholds: ${filteredGrids.length} grids`);

    // Calculate source statistics
    const stats = getSourceStatistics(filteredGrids, activeSources);

    console.log('Source statistics:', stats);
    console.log('=== END FILTERING DEBUG ===');

    return {
      filteredGridData: { ...sourceGridData, grids: filteredGrids },
      activeSourceFilters: activeSources,
      activeAirQualityFilters: activeAirQuality,
      sourceStats: stats
    };
  }, [sourceGridData, getActiveFilters]);

  // Debug: Log when filtered data changes
  useEffect(() => {
    if (filteredGridData) {
      console.log(`Filtered grid data changed: ${filteredGridData.grids.length} grids`);
      console.log('Active sources:', activeSourceFilters);

      // Auto-enable data layer when there are active sources
      if (activeSourceFilters.length > 0 && !showDataLayer) {
        console.log('Auto-enabling data layer since we have active source filters');
        setShowDataLayer(true);
      }
    }
  }, [filteredGridData, activeSourceFilters, showDataLayer]);

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
        sourceGridData={filteredGridData}
        activeSourceFilters={activeSourceFilters}
        selectedMapStyle={selectedMapStyle}
        showDataLayer={showDataLayer}
        onMapStyleChange={setSelectedMapStyle}
        onDataLayerToggle={setShowDataLayer}
        sourceStats={sourceStats}
        activeAirQualityFilters={activeAirQualityFilters}
        filtersVisible={isFilterPaneVisible}
      />
    </div>
  );
}

export default App;