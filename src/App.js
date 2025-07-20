import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import MapContainer from './components/MapContainer/MapContainer';
import EnhancedFilterPane from './components/FilterPane/EnhancedFilterPane';
import { useFilters } from './hooks/useFilters';
import { generateSampleEnhancedGridData, POLLUTANT_COLOR_SCHEMES, POLLUTION_SOURCES } from './utils/enhancedGridGenerator';
import './App.css';

function App() {
  // Enhanced grid data with per-pollutant source contributions
  const [enhancedGridData, setEnhancedGridData] = useState(null);
  const [selectedMapStyle, setSelectedMapStyle] = useState('osm');
  const [showDataLayer, setShowDataLayer] = useState(false);
  const [selectedPollutant, setSelectedPollutant] = useState('aqi');

  // Enhanced filters hook
  const {
    filters,
    isFilterPaneVisible,
    handleFilterChange,
    toggleFilterPane,
    getActiveFilters
  } = useFilters();

  // Load enhanced grid data on component mount
  useEffect(() => {
    console.log('=== App: Loading enhanced grid data ===');
    const data = generateSampleEnhancedGridData();
    setEnhancedGridData(data);

    console.log(`Generated ${data.grids.length} enhanced grid cells`);
    console.log('Enhanced data metadata:', data.metadata);
    console.log('Sample grid with contributions:', data.grids[0]);
  }, []);

  // Process filtered data and calculate statistics
  const {
    selectedSources,
    pollutantStats,
    sourceStats,
    visibleGridCount
  } = React.useMemo(() => {
    console.log('=== App: Recomputing filtered data ===');

    if (!enhancedGridData) {
      console.log('No enhanced grid data available');
      return {
        selectedSources: [],
        pollutantStats: {},
        sourceStats: {},
        visibleGridCount: 0
      };
    }

    const activeFilters = getActiveFilters();
    const activeSources = activeFilters.sources || [];

    console.log('Active source filters:', activeSources);
    console.log('Selected pollutant:', selectedPollutant);

    // Calculate pollutant statistics across all grids
    const pollutantStatistics = {};
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

    // Calculate source contribution statistics for selected pollutant
    const sourceStatistics = {};
    if (activeSources.length > 0) {
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

    // Count grids that would be visible (have contributions from selected sources)
    let visibleCount = 0;
    if (activeSources.length > 0) {
      enhancedGridData.grids.forEach(grid => {
        const totalContribution = activeSources.reduce((total, source) => {
          return total + (grid.sourceContributions?.[selectedPollutant]?.[source] || 0);
        }, 0);
        if (totalContribution > 0) {
          visibleCount++;
        }
      });
    }

    console.log('Calculated statistics:');
    console.log('- Pollutant stats:', pollutantStatistics);
    console.log('- Source stats:', sourceStatistics);
    console.log('- Visible grids:', visibleCount);

    return {
      selectedSources: activeSources,
      pollutantStats: pollutantStatistics,
      sourceStats: sourceStatistics,
      visibleGridCount: visibleCount
    };
  }, [enhancedGridData, getActiveFilters, selectedPollutant]);

  // Auto-enable data layer when sources are selected
  useEffect(() => {
    if (selectedSources.length > 0 && !showDataLayer) {
      console.log('Auto-enabling data layer - sources selected:', selectedSources);
      setShowDataLayer(true);
    } else if (selectedSources.length === 0 && showDataLayer) {
      console.log('Auto-disabling data layer - no sources selected');
      setShowDataLayer(false);
    }
  }, [selectedSources, showDataLayer]);

  // Handle pollutant change
  const handlePollutantChange = (newPollutant) => {
    console.log('App: Pollutant changed from', selectedPollutant, 'to', newPollutant);
    setSelectedPollutant(newPollutant);
  };

  // Debug: Log key state changes
  useEffect(() => {
    console.log('=== App State Update ===');
    console.log('Selected Pollutant:', selectedPollutant);
    console.log('Selected Sources:', selectedSources);
    console.log('Show Data Layer:', showDataLayer);
    console.log('Visible Grids:', visibleGridCount);
    console.log('Filter Pane Visible:', isFilterPaneVisible);
  }, [selectedPollutant, selectedSources, showDataLayer, visibleGridCount, isFilterPaneVisible]);

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
      />
    </div>
  );
}

export default App;