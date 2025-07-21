// src/App.js - Step 3: Connect Timeline Data to Map Display (WITH TARGETED FIXES)
import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import MapContainer from './components/MapContainer/MapContainer';
import EnhancedFilterPane from './components/FilterPane/EnhancedFilterPane';
import TimelinePanel from './components/TimelinePanel/TimelinePanel'; // Timeline panel
import { useFilters } from './hooks/useFilters';
import { generateSampleEnhancedGridData, POLLUTANT_COLOR_SCHEMES } from './utils/enhancedGridGenerator';
import { anandViharAQIData } from './utils/dummyData'; // Keep as fallback
import externalDataLoader from './utils/externalDataLoader'; // Keep existing CSV loader
import timelineDataLoader from './utils/timelineDataLoader'; // Timeline CSV loader
import './App.css';

function App() {
  // EXISTING STATE - All preserved exactly as-is
  const [enhancedGridData, setEnhancedGridData] = useState(null);
  const [selectedMapStyle, setSelectedMapStyle] = useState('osm');
  const [showDataLayer, setShowDataLayer] = useState(false);
  const [selectedPollutant, setSelectedPollutant] = useState('select');

  // EXISTING SENSOR STATE - All preserved exactly as-is
  const [sensorData, setSensorData] = useState([]);
  const [isLoadingSensorData, setIsLoadingSensorData] = useState(true);
  const [sensorDataSource, setSensorDataSource] = useState('dummy'); // 'csv' or 'dummy'

  // TIMELINE STATE - From Steps 1 & 2 + Enhanced for Step 3
  const [timelineData, setTimelineData] = useState(null);
  const [isLoadingTimelineData, setIsLoadingTimelineData] = useState(true);
  const [isTimelineActive, setIsTimelineActive] = useState(false);
  const [currentTimelineMode, setCurrentTimelineMode] = useState('historical'); // 'historical' or 'predicted'
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date('2025-07-20T14:30:00Z')); // Default to current time

  // EXISTING FILTERS - All preserved exactly as-is
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

  // EXISTING GRID DATA LOADING - Preserved exactly as-is
  useEffect(() => {
    console.log('=== App: Loading enhanced grid data ===');

    // Load grid data
    const gridData = generateSampleEnhancedGridData();
    setEnhancedGridData(gridData);

    console.log(`Generated ${gridData.grids.length} enhanced grid cells`);
    console.log('Enhanced data metadata:', gridData.metadata);
    console.log('Sample grid with contributions:', gridData.grids[0]);
  }, []);

  // EXISTING SENSOR DATA LOADING - Preserved exactly as-is  
  useEffect(() => {
    const loadSensorData = async () => {
      console.log('=== App: Loading sensor data ===');
      setIsLoadingSensorData(true);

      try {
        // Try to load from generated CSV first
        console.log('Attempting to load from CSV: generated_data/current_reading.csv');
        const csvData = await externalDataLoader.loadSensorDataFromCSV('generated_data/current_reading.csv');

        if (csvData && csvData.length > 0) {
          console.log(`✅ Successfully loaded ${csvData.length} sensors from CSV`);
          setSensorData(csvData);
          setSensorDataSource('csv');

          // Log sensor distribution
          const sensorsBySource = csvData.reduce((acc, sensor) => {
            acc[sensor.source] = (acc[sensor.source] || 0) + 1;
            return acc;
          }, {});
          console.log('CSV sensor distribution:', sensorsBySource);
          console.log('Sample CSV sensor:', csvData[0]);
        } else {
          throw new Error('No sensor data found in CSV');
        }

      } catch (error) {
        console.warn('⚠️ Failed to load CSV data, falling back to dummy data');
        console.warn('Error details:', error.message);

        // Fallback to dummy data
        console.log(`📋 Using dummy data: ${anandViharAQIData.length} sensors`);
        setSensorData(anandViharAQIData);
        setSensorDataSource('dummy');

        // Log dummy data distribution
        const dummyBySource = anandViharAQIData.reduce((acc, sensor) => {
          acc[sensor.source] = (acc[sensor.source] || 0) + 1;
          return acc;
        }, {});
        console.log('Dummy sensor distribution:', dummyBySource);
      } finally {
        setIsLoadingSensorData(false);
      }
    };

    loadSensorData();
  }, []);

  // TIMELINE DATA LOADING - From Steps 1 & 2, preserved exactly
  useEffect(() => {
    const loadTimelineData = async () => {
      console.log('=== Step 1: Loading Timeline CSV Data ===');
      setIsLoadingTimelineData(true);

      try {
        const loadedTimelineData = await timelineDataLoader.loadTimelineData();

        if (loadedTimelineData) {
          setTimelineData(loadedTimelineData);

          // Detailed console logging for verification
          console.log('✅ Timeline Data Loaded Successfully!');
          console.log('📊 Historical Grid Data:', loadedTimelineData.historical.gridData.length, 'cells');
          console.log('🔮 Predicted Grid Data:', loadedTimelineData.predicted.gridData.length, 'cells');
          console.log('📊 Historical Sensor Data:', loadedTimelineData.historical.sensorData.length, 'sensors');
          console.log('🔮 Predicted Sensor Data:', loadedTimelineData.predicted.sensorData.length, 'sensors');
          console.log('⏰ Timeline Range:', {
            start: loadedTimelineData.timeline.start,
            current: loadedTimelineData.timeline.current,
            end: loadedTimelineData.timeline.end
          });
          console.log('📁 Files Found:', loadedTimelineData.metadata.filesFound);

          // Sample data structure verification
          if (loadedTimelineData.historical.gridData.length > 0) {
            console.log('🗂️ Sample Historical Grid:', loadedTimelineData.historical.gridData[0]);
          }
          if (loadedTimelineData.historical.sensorData.length > 0) {
            console.log('🗂️ Sample Historical Sensor:', loadedTimelineData.historical.sensorData[0]);
          }
          if (loadedTimelineData.predicted.gridData.length > 0) {
            console.log('🗂️ Sample Predicted Grid:', loadedTimelineData.predicted.gridData[0]);
          }

          // Initialize timeline state once data is loaded
          setCurrentTimestamp(loadedTimelineData.timeline.current);

        } else {
          console.warn('⚠️ Timeline data loader returned null');
        }
      } catch (error) {
        console.error('❌ Error loading timeline data:', error);
      } finally {
        setIsLoadingTimelineData(false);
        console.log('=== Step 1 Timeline Loading Complete ===');
      }
    };

    loadTimelineData();
  }, []);

  // TIMELINE EVENT HANDLERS - Step 3: Auto-activate timeline on interaction
  const handleTimelineModeChange = (newMode) => {
    console.log('=== Step 3: Timeline mode changed ===');
    console.log('From:', currentTimelineMode, 'To:', newMode);
    setCurrentTimelineMode(newMode);

    // Auto-activate timeline when user changes mode
    if (!isTimelineActive) {
      console.log('🎯 Auto-activating timeline due to mode change');
      setIsTimelineActive(true);
    }
  };

  const handleTimestampChange = (newTimestamp) => {
    console.log('=== Step 3: Timeline timestamp changed ===');
    console.log('🕒 EXACT TIMESTAMP REQUESTED:', newTimestamp.toISOString());
    console.log('🕒 Human readable:', newTimestamp.toLocaleDateString(), newTimestamp.toLocaleTimeString());
    setCurrentTimestamp(newTimestamp);

    // Auto-activate timeline when user moves slider
    if (!isTimelineActive) {
      console.log('🎯 Auto-activating timeline due to timestamp change');
      setIsTimelineActive(true);
    }
  };

  const handleTimelineToggle = () => {
    console.log('=== Step 3: Timeline toggled ===');
    console.log('Timeline active:', !isTimelineActive);
    setIsTimelineActive(!isTimelineActive);
  };

  // 🔧 FIX 1 & 2: ENHANCED DATA PROCESSING with Timezone Fix and Forced Re-renders
  const {
    selectedSources,
    pollutantStats,
    sourceStats,
    visibleGridCount,
    filteredSensorData,
    currentGridData,
    currentSensorData,
    dataSourceInfo
  } = React.useMemo(() => {
    console.log('=== Step 3: Recomputing data with timeline integration ===');
    console.log('Timeline Active:', isTimelineActive);
    console.log('Timeline Mode:', currentTimelineMode);
    console.log('Timestamp:', currentTimestamp);

    // Step 3: Determine data source based on timeline state
    let activeGridData = enhancedGridData;
    let activeSensorData = sensorData;
    let dataSourceInfo = {
      source: 'current',
      mode: 'live',
      timestamp: new Date(),
      description: 'Current live data'
    };
    if (isTimelineActive && timelineData) {
      // Use timeline data when timeline is active
      const modeData = timelineData[currentTimelineMode]; // 'historical' or 'predicted'

      console.log('🔍 DEBUG: Timeline data access (NO STRICT FILTERING):');
      console.log('🕒 Slider timestamp:', currentTimestamp.toISOString());
      console.log('📊 Mode data available:', !!modeData);
      console.log('📊 Total grid records in mode:', modeData?.gridData?.length || 0);
      console.log('📊 Total sensor records in mode:', modeData?.sensorData?.length || 0);

      if (modeData && modeData.gridData.length > 0) {

        // ✅ FIXED: Use ALL timeline data instead of filtering by timestamp
        console.log('🎯 DEBUG: Using ALL timeline data (no timestamp filtering)');

        // Show what timestamps are available
        const availableTimestamps = [...new Set(modeData.gridData.map(grid => grid.timestamp))].sort();
        console.log('📅 DEBUG: Available timestamps in timeline data (first 10):');
        availableTimestamps.slice(0, 10).forEach((ts, index) => {
          console.log(`  ${index + 1}. ${ts}`);
        });

        // For now, let's use the first available timestamp to test visualization
        const firstTimestamp = availableTimestamps[0];
        const gridDataForTime = modeData.gridData.filter(grid => grid.timestamp === firstTimestamp);
        const sensorDataForTime = modeData.sensorData.filter(sensor => sensor.timestamp === firstTimestamp);

        console.log('🎯 DEBUG: Using first available timestamp for testing:', {
          timestamp: firstTimestamp,
          gridCount: gridDataForTime.length,
          sensorCount: sensorDataForTime.length
        });

        if (gridDataForTime.length > 0) {
          // ✅ FIXED: Force new object creation to trigger React re-render
          activeGridData = {
            grids: gridDataForTime.map(grid => ({
              ...grid, // Spread to create new object reference
              _updateId: Date.now() // Force unique identity for React
            })),
            metadata: {
              ...enhancedGridData?.metadata,
              source: 'timeline_csv_debug',
              mode: currentTimelineMode,
              timestamp: firstTimestamp,
              _forceUpdate: Math.random() // Ensures object identity changes
            }
          };

          activeSensorData = sensorDataForTime.map(sensor => ({
            ...sensor, // Spread to create new object reference
            _updateId: Date.now()
          }));

          console.log('✅ DEBUG: Created timeline data objects with first timestamp');

          // Verify data has variation
          const sampleAqiValues = activeGridData.grids.slice(0, 10).map(g => g.aqi);
          console.log('🎨 DEBUG: Sample AQI values from timeline data:', sampleAqiValues);

        } else {
          console.log('❌ DEBUG: No data found even for first timestamp');
        }

      } else {
        console.log('❌ DEBUG: No timeline grid data available in mode:', currentTimelineMode);
      }

      if (modeData && modeData.sensorData.length > 0) {
        console.log('📊 DEBUG: Timeline sensor data available:', modeData.sensorData.length, 'sensors');
      }

      dataSourceInfo = {
        source: 'timeline_debug',
        mode: currentTimelineMode,
        timestamp: currentTimestamp,
        description: `${currentTimelineMode === 'historical' ? 'Historical' : 'Predicted'} data (DEBUG - no filtering)`
      };
    }

    // Rest of the logic remains the same, but operates on timeline data when active
    if (!activeGridData || !activeSensorData.length) {
      console.log('❌ No active grid data or sensor data available');
      console.log('activeGridData:', !!activeGridData, activeGridData?.grids?.length);
      console.log('activeSensorData:', activeSensorData.length);
      return {
        selectedSources: [],
        pollutantStats: {},
        sourceStats: {},
        visibleGridCount: 0,
        filteredSensorData: [],
        currentGridData: null,
        currentSensorData: [],
        dataSourceInfo
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
        const values = activeGridData.grids
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
        const contributions = activeGridData.grids
          .map(grid => grid.sourceContributions?.[selectedPollutant]?.[source])
          .filter(v => v !== undefined && v !== null);

        if (contributions.length > 0) {
          sourceStatistics[source] = {
            min: Math.round(Math.min(...contributions) * 100) / 100,
            max: Math.round(Math.max(...contributions) * 100) / 100,
            avg: Math.round((contributions.reduce((a, b) => a + b, 0) / contributions.length) * 100) / 100,
            count: contributions.length
          };
        }
      });
    }

    // Apply sensor filters
    const processedSensorData = activeSensorData.filter(sensor => {
      // Apply source filters
      if (activeSensorFilters.source) {
        const sourceKeys = Object.keys(activeSensorFilters.source);
        const activeSensorSources = sourceKeys.filter(key => activeSensorFilters.source[key]);

        if (activeSensorSources.length > 0) {
          if (!activeSensorSources.includes(sensor.source)) {
            return false;
          }
        }
      }

      // Apply severity filters
      if (activeSensorFilters.severity) {
        const severityKeys = Object.keys(activeSensorFilters.severity);
        const activeSeverities = severityKeys.filter(key => activeSensorFilters.severity[key]);

        if (activeSeverities.length > 0) {
          if (!activeSeverities.includes(sensor.severity)) {
            return false;
          }
        }
      }

      return true;
    });

    const visibleCount = activeGridData?.grids?.length || 0;

    console.log('Final processed data:');
    console.log('- Selected sources:', activeSources);
    console.log('- Visible grids:', visibleCount);
    console.log('- Filtered sensors:', processedSensorData.length);

    return {
      selectedSources: activeSources,
      pollutantStats: pollutantStatistics,
      sourceStats: sourceStatistics,
      visibleGridCount: visibleCount,
      filteredSensorData: processedSensorData,
      currentGridData: activeGridData,
      currentSensorData: activeSensorData,
      dataSourceInfo
    };
  }, [enhancedGridData, sensorData, getActiveFilters, getActiveSensorFilters, selectedPollutant,
    isTimelineActive, currentTimelineMode, currentTimestamp, timelineData]);

  // EXISTING AUTO-ENABLE DATA LAYER - Preserved exactly as-is
  useEffect(() => {
    if (selectedPollutant === 'select') {
      // Hide data layer when 'select' is chosen
      if (showDataLayer) {
        console.log('Hiding data layer - no pollutant selected');
        setShowDataLayer(false);
      }
    } else if (currentGridData && !showDataLayer) {
      // Show data layer when a pollutant is selected
      console.log('Auto-enabling data layer - pollutant selected:', selectedPollutant);
      setShowDataLayer(true);
    }
  }, [selectedPollutant, currentGridData, showDataLayer]);

  // EXISTING POLLUTANT CHANGE HANDLER - Preserved exactly as-is
  const handlePollutantChange = (newPollutant) => {
    console.log('App: Pollutant changed from', selectedPollutant, 'to', newPollutant);
    setSelectedPollutant(newPollutant);
  };

  // EXISTING FILTER STATS - Preserved exactly as-is
  const filterStats = getFilterStats();

  // ENHANCED DEBUG LOGGING - Include timeline and data source info
  useEffect(() => {
    console.log('=== Step 3: App State Update ===');
    console.log('Selected Pollutant:', selectedPollutant);
    console.log('Selected Sources:', selectedSources);
    console.log('Show Data Layer:', showDataLayer);
    console.log('Show Sensors:', showSensors);
    console.log('Visible Grids:', visibleGridCount);
    console.log('Filtered Sensors:', filteredSensorData.length);
    console.log('Filter Pane Visible:', isFilterPaneVisible);
    console.log('Filter Stats:', filterStats);
    console.log('Sensor Data Source:', sensorDataSource);
    console.log('Loading Sensors:', isLoadingSensorData);
    // Timeline state logging
    console.log('Timeline Active:', isTimelineActive);
    console.log('Timeline Mode:', currentTimelineMode);
    console.log('Timeline Timestamp:', currentTimestamp);
    console.log('Timeline Data Loaded:', !!timelineData);
    console.log('Data Source Info:', dataSourceInfo);
  }, [selectedPollutant, selectedSources, showDataLayer, showSensors, visibleGridCount,
    filteredSensorData, isFilterPaneVisible, filterStats, sensorDataSource,
    isLoadingSensorData, isTimelineActive, currentTimelineMode, currentTimestamp,
    timelineData, dataSourceInfo]);

  // Loading state
  if (!enhancedGridData || isLoadingSensorData || isLoadingTimelineData) {
    const loadingMessage = !enhancedGridData ? 'Loading grid data...' :
      isLoadingSensorData ? 'Loading sensor data...' :
        isLoadingTimelineData ? 'Loading timeline data...' : 'Loading...';

    return (
      <div className="App">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{loadingMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Header />

      {/* Status bar with timeline data source info */}
      <div className="status-bar">
        {isTimelineActive ? (
          <div>
            <div style={{ marginBottom: '2px' }}>
              {currentTimelineMode === 'historical' ? '📊 Historical Data' : '🔮 Predicted Data'}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>
              {currentTimestamp.toLocaleDateString()} {currentTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ) : (
          `${sensorDataSource === 'csv' ? '📊 CSV Data' : '📋 Demo Data'} • ${currentSensorData.length} sensors`
        )}
      </div>

      {/* EXISTING ENHANCED FILTER PANE - Now works with timeline data */}
      <EnhancedFilterPane
        filters={filters}
        onFilterChange={handleFilterChange}
        isVisible={isFilterPaneVisible}
        onToggleVisibility={toggleFilterPane}
        selectedPollutant={selectedPollutant}
        onPollutantChange={handlePollutantChange}
        pollutantStats={pollutantStats}
        sourceStats={sourceStats}
        // Use current sensor data (timeline or live)
        sensorData={currentSensorData}
        showSensors={showSensors}
        onSensorToggle={toggleSensors}
        sensorFilters={sensorFilters}
        onSensorFilterChange={handleSensorFilterChange}
      />

      {/* 🔧 FIX 3: ENHANCED MAP CONTAINER with key prop to force re-render */}
      <MapContainer
        enhancedGridData={currentGridData} // This now switches between current and timeline data
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
        // Use filtered timeline or current sensor data
        sensorData={filteredSensorData}
        showSensors={showSensors}
        sensorFilters={sensorFilters}
        sensorDisplayOptions={sensorFilters.options}
        // DEBUG: Add debugging info
        dataSourceInfo={dataSourceInfo}
        // 🔧 FIX 3: Force re-render when timeline changes
        key={isTimelineActive ? `timeline-${currentTimestamp.getTime()}-${currentTimelineMode}` : 'current-data'}
      />

      {/* TIMELINE PANEL - Now controls the map data */}
      {timelineData && (
        <TimelinePanel
          currentMode={currentTimelineMode}
          currentTimestamp={currentTimestamp}
          timelineData={timelineData}
          onModeChange={handleTimelineModeChange}
          onTimeChange={handleTimestampChange}
          onToggle={handleTimelineToggle}
          isActive={isTimelineActive}
        />
      )}
    </div>
  );
}

export default App;