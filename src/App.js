// src/App.js - Step 3: Connect Timeline Data to Map Display
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
    console.log('🕒 For CSV verification - ISO format:', newTimestamp.toISOString());
    console.log('🕒 For CSV verification - Date only:', newTimestamp.toISOString().split('T')[0]);
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

  // ENHANCED DATA PROCESSING - Step 3: Add timeline data integration
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

      // Round current timestamp to nearest hour to match CSV data
      const roundedTimestamp = new Date(currentTimestamp);
      roundedTimestamp.setMinutes(0, 0, 0);

      console.log('🔍 Timeline data access debug:');
      console.log('🕒 Original timestamp:', currentTimestamp.toISOString());
      console.log('🕒 Rounded to hour:', roundedTimestamp.toISOString());
      console.log('📊 Mode data available:', !!modeData);
      console.log('📊 Total grid records in mode:', modeData?.gridData?.length || 0);
      console.log('📊 Total sensor records in mode:', modeData?.sensorData?.length || 0);

      console.log(`Checking if the gridData has values `, modeData?.gridData)
      if (modeData && modeData.gridData.length > 0) {

        // Filter data for the exact rounded timestamp
        const timestampString = roundedTimestamp.toISOString();
        const gridDataForTime = modeData.gridData.filter(grid =>
          grid.timestamp === timestampString
        );
        const sensorDataForTime = modeData.sensorData.filter(sensor =>
          sensor.timestamp === timestampString
        );

        console.log('🎯 Data for exact timestamp:', {
          timestamp: timestampString,
          gridCount: gridDataForTime.length,
          sensorCount: sensorDataForTime.length
        });

        if (gridDataForTime.length === 0) {
          // Check what timestamps are actually available in the data
          const availableTimestamps = [...new Set(modeData.gridData.map(grid => grid.timestamp))]
            .sort()
            .slice(0, 10); // first 10 for debugging

          console.log('📅 Sample available timestamps in CSV data:');
          availableTimestamps.forEach((ts, index) => {
            console.log(`  ${index + 1}. ${ts}`);
          });

          console.log('⚠️ No data found for timestamp! Using closest available data...');

          // Use all data as fallback (this will show mixed timestamps but at least something visible)
          activeGridData = {
            grids: modeData.gridData.slice(0, 100), // Limit to first 100 to avoid performance issues
            metadata: {
              ...enhancedGridData?.metadata,
              source: 'timeline_csv_fallback',
              mode: currentTimelineMode,
              timestamp: roundedTimestamp,
              warning: 'Using mixed timestamp data as fallback'
            }
          };
        } else {
          // Use exact timestamp data
          activeGridData = {
            grids: gridDataForTime,
            metadata: {
              ...enhancedGridData?.metadata,
              source: 'timeline_csv',
              mode: currentTimelineMode,
              timestamp: roundedTimestamp
            }
          };
          activeSensorData = sensorDataForTime;
        }

        console.log('📊 Final timeline data used:', {
          gridCount: activeGridData.grids.length,
          sensorCount: activeSensorData.length,
          source: activeGridData.metadata.source
        });

        if (activeGridData.grids.length > 0) {
          console.log('🗂️ Sample timeline grid structure:', activeGridData.grids[0]);

          // Check coordinate ranges for all grids to see if they're in the right area
          const coordinates = activeGridData.grids.map(grid => ({
            lat: grid.centerLat,
            lng: grid.centerLng
          })).filter(coord => coord.lat !== 0 && coord.lng !== 0); // Filter out 0,0 coordinates

          if (coordinates.length > 0) {
            const latRange = {
              min: Math.min(...coordinates.map(c => c.lat)),
              max: Math.max(...coordinates.map(c => c.lat)),
              avg: coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length
            };
            const lngRange = {
              min: Math.min(...coordinates.map(c => c.lng)),
              max: Math.max(...coordinates.map(c => c.lng)),
              avg: coordinates.reduce((sum, c) => sum + c.lng, 0) / coordinates.length
            };

            console.log('🌍 Timeline grid coordinate analysis:', {
              totalGrids: activeGridData.grids.length,
              validCoordinates: coordinates.length,
              zeroCoordinates: activeGridData.grids.length - coordinates.length,
              latitudeRange: latRange,
              longitudeRange: lngRange,
              isInDelhiArea: (latRange.avg > 28.4 && latRange.avg < 28.8 && lngRange.avg > 77.1 && lngRange.avg < 77.4)
            });

            // Show first 5 coordinates for manual verification
            console.log('📍 First 5 timeline grid coordinates:');
            coordinates.slice(0, 5).forEach((coord, index) => {
              console.log(`  ${index + 1}. Lat: ${coord.lat}, Lng: ${coord.lng}`);
            });
          } else {
            console.log('❌ No valid coordinates found - all grids have lat:0, lng:0');
          }

          console.log('🔍 Timeline grid sample pollutants:', {
            aqi: activeGridData.grids[0]?.aqi,
            pm25: activeGridData.grids[0]?.pm25,
            pm10: activeGridData.grids[0]?.pm10,
            hasCorners: !!activeGridData.grids[0]?.corners,
            hasSourceContributions: !!activeGridData.grids[0]?.sourceContributions,
            coordinates: {
              lat: activeGridData.grids[0]?.centerLat,
              lng: activeGridData.grids[0]?.centerLng
            }
          });
        }
      }

      if (modeData && modeData.sensorData.length > 0) {
        activeSensorData = modeData.sensorData;
        console.log('📊 Using timeline sensor data:', activeSensorData.length, 'sensors');
      }

      dataSourceInfo = {
        source: 'timeline',
        mode: currentTimelineMode,
        timestamp: currentTimestamp,
        description: `${currentTimelineMode === 'historical' ? 'Historical' : 'Predicted'} data from ${currentTimestamp.toLocaleDateString()}`
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

    console.log('✅ Data comparison:');
    console.log('🔍 Original enhanced grid sample:', enhancedGridData?.grids?.[0]);
    console.log('🔍 Active grid sample:', activeGridData?.grids?.[0]);
    console.log('🔍 Data structure match check:', {
      originalHasCorners: !!enhancedGridData?.grids?.[0]?.corners,
      activeHasCorners: !!activeGridData?.grids?.[0]?.corners,
      originalHasSourceContrib: !!enhancedGridData?.grids?.[0]?.sourceContributions,
      activeHasSourceContrib: !!activeGridData?.grids?.[0]?.sourceContributions,
      originalAQI: enhancedGridData?.grids?.[0]?.aqi,
      activeAQI: activeGridData?.grids?.[0]?.aqi
    });

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
        visibleCount = activeGridData.grids.length;
      } else {
        // When sources are selected, count grids with contributions
        activeGridData.grids.forEach(grid => {
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
    let processedSensorData = [...activeSensorData]; // Use active sensor data (current or timeline)

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

    console.log('Step 3 Calculated statistics:');
    console.log('- Data source:', dataSourceInfo.description);
    console.log('- Pollutant stats:', pollutantStatistics);
    console.log('- Source stats:', sourceStatistics);
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
  }, [selectedPollutant, selectedSources, showDataLayer,
    showSensors, visibleGridCount,
    filteredSensorData.length, isFilterPaneVisible, filterStats, sensorDataSource, isLoadingSensorData,
    isTimelineActive, currentTimelineMode, currentTimestamp, timelineData, dataSourceInfo]);

  // EXISTING LOADING STATE - Preserved exactly as-is
  if (isLoadingSensorData) {
    return (
      <div className="app">
        <Header />
        <div className="loading-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '70vh',
          fontSize: '18px',
          color: '#666'
        }}>
          <div>
            <div>🔄 Loading sensor data...</div>
            <div style={{ fontSize: '14px', marginTop: '10px' }}>
              Attempting to load from generated_data/current_reading.csv
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN RENDER - Enhanced to show data source information
  return (
    <div className="app" data-timeline-mode={currentTimelineMode}>
      <Header />

      {/* Timeline loading status */}
      {isLoadingTimelineData && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(52, 152, 219, 0.9)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '15px',
          fontSize: '11px',
          zIndex: 10000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          📊 Loading Timeline...
        </div>
      )}

      {/* Timeline mode indicator - Click to toggle current/timeline */}
      {timelineData && (
        <div className="timeline-mode-indicator"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1002,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '12px 16px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.1)',
            minWidth: '160px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={handleTimelineToggle}
          title={isTimelineActive ? 'Click to return to current data' : 'Click to activate timeline'}
        >
          <div className="mode-icon" style={{ fontSize: '20px', marginBottom: '4px' }}>
            {isTimelineActive ? (currentTimelineMode === 'historical' ? '📊' : '🔮') : '🔴'}
          </div>
          <div className="mode-text" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2c3e50' }}>
            {isTimelineActive ? (currentTimelineMode === 'historical' ? 'Historical' : 'Predicted') : 'Current'}
          </div>
          <div className="mode-subtitle" style={{ fontSize: '0.7rem', color: '#7f8c8d' }}>
            {isTimelineActive ? 'Timeline Active' : 'Live Data'}
            <div style={{ fontSize: '0.6rem', marginTop: '2px', opacity: 0.8 }}>
              {isTimelineActive ? '🔄 Click to disable' : '⏰ Click to enable'}
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED DATA SOURCE INDICATOR - Shows detailed timeline info */}
      <div className="data-source-indicator" style={{
        position: 'fixed',
        top: '60px',
        right: '20px',
        zIndex: 1000,
        background: isTimelineActive ?
          (currentTimelineMode === 'historical' ? '#3498db' : '#f39c12') :
          (sensorDataSource === 'csv' ? '#4CAF50' : '#FF9800'),
        color: 'white',
        padding: '6px 12px',
        borderRadius: '15px',
        fontSize: '11px',
        fontWeight: 'bold',
        maxWidth: '300px',
        textAlign: 'center'
      }}>
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

      {/* ENHANCED MAP CONTAINER - Now receives timeline data */}
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
      />

      {/* DEBUG: Console log what we're passing to MapContainer */}
      {console.log('📡 MapContainer props debug:', {
        enhancedGridData: currentGridData?.grids?.length || 'null',
        selectedPollutant,
        showDataLayer,
        sensorDataLength: filteredSensorData.length,
        dataSourceInfo: dataSourceInfo.description
      })}

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