// src/App.js - Updated with Select Option Support
import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import MapContainer from './components/MapContainer/MapContainer';
import EnhancedFilterPane from './components/FilterPane/EnhancedFilterPane';
import { useFilters } from './hooks/useFilters';
import { generateSampleEnhancedGridData, POLLUTANT_COLOR_SCHEMES, POLLUTION_SOURCES } from './utils/enhancedGridGenerator';
import { anandViharAQIData } from './utils/dummyData'; // Import sensor data
import './App.css';

function App() {
  // Enhanced grid data with per-pollutant source contributions
  const [enhancedGridData, setEnhancedGridData] = useState(null);
  const [selectedMapStyle, setSelectedMapStyle] = useState('osm');
  const [showDataLayer, setShowDataLayer] = useState(false);
  const [selectedPollutant, setSelectedPollutant] = useState('select'); // Changed default to 'select'

  // Enhanced filters hook with sensor support
  const {
    filters,
    sensorFilters,
    showSensors,
    isFilterPaneVisible,
    handleFilterChange,
    handleSensorFilterChange,
    toggleSensors,
    toggleFilterPane,
    getActiveFilters,
    getActiveSensorFilters,
    getFilterStats
  } = useFilters();

  // Load enhanced grid data and sensor data on component mount
  useEffect(() => {
    console.log('=== App: Loading enhanced grid data and sensor data ===');

    // Load grid data
    const gridData = generateSampleEnhancedGridData();
    setEnhancedGridData(gridData);

    console.log(`Generated ${gridData.grids.length} enhanced grid cells`);
    console.log('Enhanced data metadata:', gridData.metadata);
    console.log('Sample grid with contributions:', gridData.grids[0]);

    // Log sensor data
    console.log(`Loaded ${anandViharAQIData.length} sensor stations`);
    console.log('Sample sensor data:', anandViharAQIData[0]);

    // Group sensors by source for debugging
    const sensorsBySource = anandViharAQIData.reduce((acc, sensor) => {
      acc[sensor.source] = (acc[sensor.source] || 0) + 1;
      return acc;
    }, {});
    console.log('Sensors by source:', sensorsBySource);
  }, []);

  // Process filtered data and calculate statistics
  const {
    selectedSources,
    pollutantStats,
    sourceStats,
    visibleGridCount,
    filteredSensorData
  } = React.useMemo(() => {
    console.log('=== App: Recomputing filtered data ===');

    if (!enhancedGridData) {
      console.log('No enhanced grid data available');
      return {
        selectedSources: [],
        pollutantStats: {},
        sourceStats: {},
        visibleGridCount: 0,
        filteredSensorData: []
      };
    }

    const activeFilters = getActiveFilters();
    const activeSources = activeFilters.sources || [];
    const activeSensorFilters = getActiveSensorFilters();

    console.log('Active source filters:', activeSources);
    console.log('Active sensor filters:', activeSensorFilters);
    console.log('Selected pollutant:', selectedPollutant);

    // Calculate pollutant statistics across all grids (only if pollutant is not 'select')
    const pollutantStatistics = {};
    if (selectedPollutant !== 'select') {
      Object.keys(POLLUTANT_COLOR_SCHEMES).forEach(pollutant => {
        const values = enhancedGridData.grids
          .map(grid => grid[pollutant])
          .filter(v => v !== undefined && v !== null);

        if (values.length > 0) {
          pollutantStatistics[pollutant] = {
            min: Math.round(Math.min(...values) * 100) / 100,
            max: Math.round(Math.max(...values) * 100) / 100,
            avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
            count: values.length
          };
        }
      });
    }

    // Calculate source contribution statistics for selected pollutant (only if not 'select')
    const sourceStatistics = {};
    if (selectedPollutant !== 'select' && activeSources.length > 0) {
      activeSources.forEach(source => {
        const contributions = enhancedGridData.grids
          .map(grid => grid.sourceContributions?.[selectedPollutant]?.[source])
          .filter(c => c !== undefined && c !== null && c > 0);

        if (contributions.length > 0) {
          sourceStatistics[source] = {
            min: Math.round(Math.min(...contributions) * 10) / 10,
            max: Math.round(Math.max(...contributions) * 10) / 10,
            avg: Math.round((contributions.reduce((a, b) => a + b, 0) / contributions.length) * 10) / 10,
            count: contributions.length
          };
        }
      });
    }

    // Count grids that would be visible (only if pollutant is not 'select')
    let visibleCount = 0;
    if (selectedPollutant !== 'select') {
      if (activeSources.length === 0) {
        // When no sources selected, all grids are visible (showing base pollutant)
        visibleCount = enhancedGridData.grids.length;
      } else {
        // When sources are selected, count grids with contributions
        enhancedGridData.grids.forEach(grid => {
          const totalContribution = activeSources.reduce((total, source) => {
            return total + (grid.sourceContributions?.[selectedPollutant]?.[source] || 0);
          }, 0);
          if (totalContribution > 0) {
            visibleCount++;
          }
        });
      }
    }

    // Filter sensor data based on active sensor filters
    let processedSensorData = [...anandViharAQIData];

    // Apply source filters
    if (activeSensorFilters.source && Object.keys(activeSensorFilters.source).length > 0) {
      const activeSourceTypes = Object.keys(activeSensorFilters.source);
      processedSensorData = processedSensorData.filter(sensor =>
        activeSourceTypes.includes(sensor.source)
      );
    }

    // Apply severity filters
    if (activeSensorFilters.severity && Object.keys(activeSensorFilters.severity).length > 0) {
      const activeSeverityTypes = Object.keys(activeSensorFilters.severity);
      processedSensorData = processedSensorData.filter(sensor =>
        activeSeverityTypes.includes(sensor.severity)
      );
    }

    console.log('Calculated statistics:');
    console.log('- Pollutant stats:', pollutantStatistics);
    console.log('- Source stats:', sourceStatistics);
    console.log('- Visible grids:', visibleCount);
    console.log('- Filtered sensors:', processedSensorData.length);

    return {
      selectedSources: activeSources,
      pollutantStats: pollutantStatistics,
      sourceStats: sourceStatistics,
      visibleGridCount: visibleCount,
      filteredSensorData: processedSensorData
    };
  }, [enhancedGridData, getActiveFilters, getActiveSensorFilters, selectedPollutant]);

  // Auto-enable data layer when pollutant is selected (not 'select')
  useEffect(() => {
    if (selectedPollutant === 'select') {
      // Hide data layer when 'select' is chosen
      if (showDataLayer) {
        console.log('Hiding data layer - no pollutant selected');
        setShowDataLayer(false);
      }
    } else if (enhancedGridData && !showDataLayer) {
      // Show data layer when a pollutant is selected
      console.log('Auto-enabling data layer - pollutant selected:', selectedPollutant);
      setShowDataLayer(true);
    }
  }, [selectedPollutant, enhancedGridData, showDataLayer]);

  // Handle pollutant change
  const handlePollutantChange = (newPollutant) => {
    console.log('App: Pollutant changed from', selectedPollutant, 'to', newPollutant);
    setSelectedPollutant(newPollutant);
  };

  // Get filter statistics for display
  const filterStats = getFilterStats();

  // Debug: Log key state changes
  useEffect(() => {
    console.log('=== App State Update ===');
    console.log('Selected Pollutant:', selectedPollutant);
    console.log('Selected Sources:', selectedSources);
    console.log('Show Data Layer:', showDataLayer);
    console.log('Show Sensors:', showSensors);
    console.log('Visible Grids:', visibleGridCount);
    console.log('Filtered Sensors:', filteredSensorData.length);
    console.log('Filter Pane Visible:', isFilterPaneVisible);
    console.log('Filter Stats:', filterStats);
  }, [selectedPollutant, selectedSources, showDataLayer, showSensors, visibleGridCount,
    filteredSensorData.length, isFilterPaneVisible, filterStats]);

  return (
    <div className="app">
      <Header />

      <EnhancedFilterPane
        filters={filters}
        onFilterChange={handleFilterChange}
        isVisible={isFilterPaneVisible}
        onToggleVisibility={toggleFilterPane}
        selectedPollutant={selectedPollutant}
        onPollutantChange={handlePollutantChange}
        pollutantStats={pollutantStats}
        sourceStats={sourceStats}
        // New sensor-related props
        sensorData={anandViharAQIData}
        showSensors={showSensors}
        onSensorToggle={toggleSensors}
        sensorFilters={sensorFilters}
        onSensorFilterChange={handleSensorFilterChange}
      />

      <MapContainer
        enhancedGridData={enhancedGridData}
        selectedPollutant={selectedPollutant}
        selectedSources={selectedSources}
        selectedMapStyle={selectedMapStyle}
        showDataLayer={showDataLayer}
        onMapStyleChange={setSelectedMapStyle}
        onDataLayerToggle={setShowDataLayer}
        pollutantStats={pollutantStats}
        sourceStats={sourceStats}
        filtersVisible={isFilterPaneVisible}
        visibleGridCount={visibleGridCount}
        // New sensor-related props
        sensorData={filteredSensorData}
        showSensors={showSensors}
        sensorFilters={sensorFilters}
        sensorDisplayOptions={sensorFilters.options}
      />
    </div>
  );
}

export default App;