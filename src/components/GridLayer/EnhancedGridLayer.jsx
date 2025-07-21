// src/components/GridLayer/EnhancedGridLayer.jsx - DEBUG VERSION for timeline data
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getPollutantColor, calculateCombinedSourceIntensity, POLLUTION_SOURCES } from '../../utils/enhancedGridGenerator';

const EnhancedGridLayer = ({
    gridData,
    selectedPollutant = 'aqi',
    selectedSources = [],
    map,
    isVisible = true
}) => {
    const gridLayerRef = useRef(null);
    const gridPolygonsRef = useRef({});

    useEffect(() => {
        if (!map) return;

        console.log('=== Enhanced Grid Layer Update ===');
        console.log('Selected Pollutant:', selectedPollutant);
        console.log('Selected Sources:', selectedSources);
        console.log('Grid Data Count:', gridData?.grids?.length || 0);
        console.log('Is Visible:', isVisible);

        // DEBUG: Check grid data structure
        if (gridData?.grids?.length > 0) {
            const sampleGrid = gridData.grids[0];
            console.log('🔍 GRID STRUCTURE DEBUG:');
            console.log('Sample grid keys:', Object.keys(sampleGrid));
            console.log('Has corners:', !!sampleGrid.corners);
            console.log('Has centerLat/Lng:', !!sampleGrid.centerLat && !!sampleGrid.centerLng);
            console.log('Coordinates:', { lat: sampleGrid.centerLat, lng: sampleGrid.centerLng });
            console.log('Pollutant value:', sampleGrid[selectedPollutant]);
            console.log('Has sourceContributions:', !!sampleGrid.sourceContributions);

            if (sampleGrid.corners) {
                console.log('Corners format:', sampleGrid.corners);
            } else {
                console.log('❌ NO CORNERS - this will prevent polygon creation!');
            }
        }

        // Create layer group if it doesn't exist
        if (!gridLayerRef.current) {
            gridLayerRef.current = L.layerGroup();
        }

        // Clear existing polygons
        if (gridLayerRef.current) {
            gridLayerRef.current.clearLayers();
            gridPolygonsRef.current = {};
        }

        // Only show grids if layer is visible and we have grid data
        if (!isVisible || !gridData?.grids) {
            console.log('Not showing grids - visibility:', isVisible, 'gridData:', !!gridData?.grids);

            // Remove layer from map if it exists
            if (map.hasLayer(gridLayerRef.current)) {
                map.removeLayer(gridLayerRef.current);
            }
            return;
        }

        // Add grid polygons with pollutant colors and source intensity
        let visibleGridCount = 0;
        let skippedNoCorners = 0;
        let skippedNoPollutant = 0;
        let skippedZeroContrib = 0;

        gridData.grids.forEach((grid, index) => {
            // DEBUG: Check individual grid issues
            if (index < 3) { // Debug first 3 grids
                console.log(`🔍 Grid ${index} debug:`, {
                    id: grid.id,
                    hasCorners: !!grid.corners,
                    coordinates: { lat: grid.centerLat, lng: grid.centerLng },
                    pollutantValue: grid[selectedPollutant],
                    hasSourceContrib: !!grid.sourceContributions
                });
            }

            // Get pollutant value for color
            const pollutantValue = grid[selectedPollutant];
            if (pollutantValue === undefined) {
                skippedNoPollutant++;
                return;
            }

            // Check if grid has corners for polygon creation
            if (!grid.corners || !Array.isArray(grid.corners) || grid.corners.length === 0) {
                skippedNoCorners++;
                if (index < 3) {
                    console.log(`❌ Grid ${index} skipped - no corners:`, grid.corners);
                }
                return;
            }

            // Validate corner coordinates
            const validCorners = grid.corners.every(corner =>
                Array.isArray(corner) && corner.length === 2 &&
                typeof corner[0] === 'number' && typeof corner[1] === 'number' &&
                corner[0] !== 0 && corner[1] !== 0 // Avoid 0,0 coordinates
            );

            if (!validCorners) {
                if (index < 3) {
                    console.log(`❌ Grid ${index} has invalid corners:`, grid.corners);
                }
                skippedNoCorners++;
                return;
            }

            // Get color based on pollutant value
            const colorInfo = getPollutantColor(selectedPollutant, pollutantValue);

            // Calculate combined source intensity (opacity)
            let sourceIntensity;
            if (selectedSources.length === 0) {
                // Show pollutant at default opacity when no sources selected
                sourceIntensity = 0.7; // Default opacity to show base pollutant distribution
            } else {
                // Calculate based on source contributions
                sourceIntensity = calculateCombinedSourceIntensity(grid, selectedSources, selectedPollutant);

                // Skip grids with zero contribution from selected sources
                if (sourceIntensity <= 0) {
                    skippedZeroContrib++;
                    return;
                }
            }

            try {
                // Create polygon with pollutant color and source intensity
                const polygon = L.polygon(grid.corners, {
                    fillColor: colorInfo.color,
                    fillOpacity: sourceIntensity, // Source intensity determines opacity
                    color: colorInfo.color,
                    weight: 0.5,
                    opacity: 0.8
                });

                // Create comprehensive popup content
                const popupContent = createPopupContent(grid, selectedPollutant, selectedSources, pollutantValue, colorInfo, sourceIntensity);
                polygon.bindPopup(popupContent);

                // Add hover effects
                polygon.on('mouseover', function (e) {
                    this.setStyle({
                        weight: 2,
                        opacity: 1.0,
                        fillOpacity: Math.min(sourceIntensity + 0.2, 1.0)
                    });
                });

                polygon.on('mouseout', function (e) {
                    this.setStyle({
                        weight: 0.5,
                        opacity: 0.8,
                        fillOpacity: sourceIntensity
                    });
                });

                gridLayerRef.current.addLayer(polygon);
                gridPolygonsRef.current[grid.id] = polygon;
                visibleGridCount++;

                // DEBUG: Log successful polygon creation for first few
                if (index < 3) {
                    console.log(`✅ Successfully created polygon for grid ${index}:`, {
                        corners: grid.corners,
                        color: colorInfo.color,
                        opacity: sourceIntensity
                    });
                }
            } catch (error) {
                console.error(`❌ Error creating polygon for grid ${index}:`, error);
                console.error('Grid data:', grid);
            }
        });

        console.log(`📊 GRID PROCESSING SUMMARY:`);
        console.log(`- Total grids processed: ${gridData.grids.length}`);
        console.log(`- Visible polygons created: ${visibleGridCount}`);
        console.log(`- Skipped (no corners): ${skippedNoCorners}`);
        console.log(`- Skipped (no pollutant): ${skippedNoPollutant}`);
        console.log(`- Skipped (zero contribution): ${skippedZeroContrib}`);

        // Add to map if not already added
        if (!map.hasLayer(gridLayerRef.current)) {
            map.addLayer(gridLayerRef.current);
            console.log('✅ Grid layer added to map');
        } else {
            console.log('ℹ️ Grid layer already on map');
        }

    }, [map, gridData, selectedPollutant, selectedSources, isVisible]);

    // Handle visibility toggle
    useEffect(() => {
        if (!map || !gridLayerRef.current) return;

        if (isVisible) {
            if (!map.hasLayer(gridLayerRef.current)) {
                map.addLayer(gridLayerRef.current);
            }
        } else {
            if (map.hasLayer(gridLayerRef.current)) {
                map.removeLayer(gridLayerRef.current);
            }
        }
    }, [map, isVisible]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (gridLayerRef.current && map && map.hasLayer(gridLayerRef.current)) {
                map.removeLayer(gridLayerRef.current);
            }
        };
    }, [map]);

    return null; // This is a map layer component, no JSX render needed
};

// Helper function to create popup content
const createPopupContent = (grid, selectedPollutant, selectedSources, pollutantValue, colorInfo, sourceIntensity) => {
    // Get all pollutant values
    const pollutants = {
        aqi: grid.aqi,
        pm25: grid.pm25,
        pm10: grid.pm10,
        co: grid.co,
        no2: grid.no2,
        so2: grid.so2
    };

    // Create pollutants section
    const pollutantsHtml = Object.entries(pollutants)
        .filter(([key, value]) => value !== undefined)
        .map(([key, value]) => {
            const isSelected = key === selectedPollutant;
            const unit = getUnitForPollutant(key);
            return `<p class="pollutant-row ${isSelected ? 'selected' : ''}">
                <strong>${key.toUpperCase()}:</strong> 
                <span class="pollutant-value">${value} ${unit}</span>
                ${isSelected ? '<span class="current-indicator">← Current</span>' : ''}
            </p>`;
        }).join('');

    // Create source contributions section for selected pollutant
    const sourceContributionsHtml = selectedSources.length > 0 ? selectedSources.map(source => {
        const contribution = grid.sourceContributions?.[selectedPollutant]?.[source] || 0;
        const sourceInfo = POLLUTION_SOURCES[source];
        return `<p class="source-contribution-row">
            <span class="source-icon">${sourceInfo?.icon || '🔸'}</span>
            <strong>${sourceInfo?.name || source}:</strong> 
            <span class="contribution-value" style="color: ${sourceInfo?.color || '#666'}">${contribution}%</span>
        </p>`;
    }).join('') : '<p class="no-sources-selected">No sources selected - showing base pollutant distribution</p>';

    // Calculate total contribution
    const totalContribution = selectedSources.reduce((total, source) => {
        return total + (grid.sourceContributions?.[selectedPollutant]?.[source] || 0);
    }, 0);

    // Create comprehensive popup
    return `
        <div class="enhanced-grid-popup">
            <div class="popup-header">
                <h3>Grid Cell #${grid.id}</h3>
                <div class="popup-meta">
                    <span class="distance-info">📍 ${(grid.distanceFromCenter / 1000).toFixed(1)}km from center</span>
                </div>
            </div>

            <div class="popup-section">
                <h4>🌫️ Pollutant Levels</h4>
                <div class="pollutants-grid">
                    ${pollutantsHtml}
                </div>
                <div class="current-status">
                    <strong>${selectedPollutant.toUpperCase()}:</strong> 
                    <span style="color: ${colorInfo.color}; font-weight: bold;">${pollutantValue} ${getUnitForPollutant(selectedPollutant)}</span>
                    <span class="status-label" style="background: ${colorInfo.color};">${colorInfo.label}</span>
                </div>
            </div>

            ${selectedSources.length > 0 ? `
            <div class="popup-section">
                <h4>🏭 Source Contributions to ${selectedPollutant.toUpperCase()}</h4>
                <div class="source-contributions">
                    ${sourceContributionsHtml}
                </div>
                <div class="total-contribution">
                    <strong>Combined Intensity: ${totalContribution.toFixed(1)}% 
                    (Opacity: ${(sourceIntensity * 100).toFixed(0)}%)</strong>
                </div>
            </div>

            <div class="popup-section">
                <h4>📊 All Source Contributions to ${selectedPollutant.toUpperCase()}</h4>
                <div class="all-contributions">
                    ${Object.entries(grid.sourceContributions?.[selectedPollutant] || {}).map(([source, contrib]) => {
        const sourceInfo = POLLUTION_SOURCES[source];
        const isSelected = selectedSources.includes(source);
        return `<p class="all-contribution-row ${isSelected ? 'selected' : ''}">
                            <span class="source-icon">${sourceInfo?.icon || '🔸'}</span>
                            ${sourceInfo?.name || source}: <span style="color: ${sourceInfo?.color || '#666'}">${contrib}%</span>
                            ${isSelected ? ' ✓' : ''}
                        </p>`;
    }).join('')}
                </div>
            </div>
            ` : `
            <div class="popup-section">
                <h4>💡 Source Analysis</h4>
                <div class="no-sources-info">
                    <p>Select pollution sources from the filter panel to see their contribution to this pollutant.</p>
                    <div class="available-sources">
                        <h5>Available Sources:</h5>
                        ${Object.entries(POLLUTION_SOURCES).map(([source, info]) => `
                            <p class="available-source-row">
                                <span class="source-icon">${info.icon}</span>
                                <strong>${info.name}:</strong> ${grid.sourceContributions?.[selectedPollutant]?.[source] || 0}%
                            </p>
                        `).join('')}
                    </div>
                </div>
            </div>
            `}

            <div class="popup-footer">
                <p class="coordinates">Lat: ${grid.centerLat.toFixed(5)}, Lng: ${grid.centerLng.toFixed(5)}</p>
                <p class="timestamp">Data: ${new Date(grid.timestamp).toLocaleString()}</p>
            </div>
        </div>
    `;
};

// Helper function to get unit for pollutant
const getUnitForPollutant = (pollutant) => {
    const units = {
        aqi: 'AQI',
        pm25: 'µg/m³',
        pm10: 'µg/m³',
        co: 'ppm',
        no2: 'µg/m³',
        so2: 'µg/m³'
    };
    return units[pollutant] || '';
};

export default EnhancedGridLayer;