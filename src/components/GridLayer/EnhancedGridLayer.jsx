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

        // Create layer group if it doesn't exist
        if (!gridLayerRef.current) {
            gridLayerRef.current = L.layerGroup();
        }

        // Clear existing polygons
        if (gridLayerRef.current) {
            gridLayerRef.current.clearLayers();
            gridPolygonsRef.current = {};
        }

        // Only show grids if layer is visible and we have selected sources
        if (!isVisible || !gridData?.grids || selectedSources.length === 0) {
            console.log('Not showing grids - visibility:', isVisible, 'sources:', selectedSources.length);

            // Remove layer from map if it exists
            if (map.hasLayer(gridLayerRef.current)) {
                map.removeLayer(gridLayerRef.current);
            }
            return;
        }

        // Add grid polygons with pollutant colors and source intensity
        let visibleGridCount = 0;

        gridData.grids.forEach(grid => {
            // Get pollutant value for color
            const pollutantValue = grid[selectedPollutant];
            if (pollutantValue === undefined) return;

            // Get color based on pollutant value
            const colorInfo = getPollutantColor(selectedPollutant, pollutantValue);

            // Calculate combined source intensity (opacity)
            const sourceIntensity = calculateCombinedSourceIntensity(grid, selectedSources, selectedPollutant);

            // Skip grids with zero contribution
            if (sourceIntensity <= 0) return;

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
        });

        console.log(`Created ${visibleGridCount} visible grid polygons`);

        // Add to map if not already added
        if (!map.hasLayer(gridLayerRef.current)) {
            map.addLayer(gridLayerRef.current);
        }

    }, [map, gridData, selectedPollutant, selectedSources, isVisible]);

    // Handle visibility toggle
    useEffect(() => {
        if (!map || !gridLayerRef.current) return;

        if (isVisible && selectedSources.length > 0) {
            if (!map.hasLayer(gridLayerRef.current)) {
                map.addLayer(gridLayerRef.current);
            }
        } else {
            if (map.hasLayer(gridLayerRef.current)) {
                map.removeLayer(gridLayerRef.current);
            }
        }
    }, [map, isVisible, selectedSources]);

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
    const sourceContributionsHtml = selectedSources.map(source => {
        const contribution = grid.sourceContributions?.[selectedPollutant]?.[source] || 0;
        const sourceInfo = POLLUTION_SOURCES[source];
        return `<p class="source-contribution-row">
            <span class="source-icon">${sourceInfo?.icon || '🔸'}</span>
            <strong>${sourceInfo?.name || source}:</strong> 
            <span class="contribution-value" style="color: ${sourceInfo?.color || '#666'}">${contribution}%</span>
        </p>`;
    }).join('');

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