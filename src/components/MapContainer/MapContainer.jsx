// src/components/MapContainer/MapContainer.jsx - Updated with Select Option Support
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import LayerControls from '../LayerControls/LayerControls';
import EnhancedGridLayer from '../GridLayer/EnhancedGridLayer';
import AQIMarker from '../AQIMarker/AQIMarker';
import { baseLayers } from '../../utils/mapUtils';
import { calculateDistance } from '../../utils/aqiUtils';
import { DEFAULT_MAP_CONFIG } from '../../utils/constants';
import './EnhancedMapContainer.css';

// Fix for default markers in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapContainer = ({
    enhancedGridData,
    selectedPollutant = 'select',  // Updated default
    selectedSources = [],
    selectedMapStyle,
    showDataLayer,
    onMapStyleChange,
    onDataLayerToggle,
    pollutantStats,
    sourceStats,
    filtersVisible,
    visibleGridCount = 0,
    // Sensor-related props
    sensorData = [],
    showSensors = true,
    sensorFilters = {},
    sensorDisplayOptions = {}
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [coordinates, setCoordinates] = useState('Click on map to see coordinates');
    const [distanceMode, setDistanceMode] = useState(false);
    const [distancePoints, setDistancePoints] = useState([]);
    const distanceMarkersRef = useRef([]);
    const distanceLinesRef = useRef([]);

    // Initialize map
    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            console.log('MapContainer: Initializing map');
            mapInstanceRef.current = L.map(mapRef.current)
                .setView(DEFAULT_MAP_CONFIG.center, DEFAULT_MAP_CONFIG.zoom);

            // Add default base layer
            baseLayers[selectedMapStyle].addTo(mapInstanceRef.current);

            // Add click event for coordinates and distance measurement
            mapInstanceRef.current.on('click', handleMapClick);

            console.log('Map initialized with center:', DEFAULT_MAP_CONFIG.center);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Handle map style changes
    useEffect(() => {
        if (mapInstanceRef.current) {
            console.log('MapContainer: Changing map style to', selectedMapStyle);

            // Remove all base layers
            Object.values(baseLayers).forEach(layer => {
                mapInstanceRef.current.removeLayer(layer);
            });

            // Add selected layer
            baseLayers[selectedMapStyle].addTo(mapInstanceRef.current);
        }
    }, [selectedMapStyle]);

    const handleMapClick = (e) => {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        setCoordinates(`Lat: ${lat}, Lng: ${lng}`);

        if (distanceMode) {
            const newPoints = [...distancePoints, e.latlng];
            setDistancePoints(newPoints);

            // Add marker
            const marker = L.marker(e.latlng, {
                icon: L.divIcon({
                    className: 'distance-marker',
                    html: newPoints.length.toString(),
                    iconSize: [20, 20]
                })
            }).addTo(mapInstanceRef.current);
            distanceMarkersRef.current.push(marker);

            // Draw line if we have more than one point
            if (newPoints.length > 1) {
                const line = L.polyline([
                    newPoints[newPoints.length - 2],
                    newPoints[newPoints.length - 1]
                ], {
                    color: '#e74c3c',
                    weight: 3,
                    opacity: 0.7
                }).addTo(mapInstanceRef.current);
                distanceLinesRef.current.push(line);

                // Calculate and show distance
                const distance = newPoints[newPoints.length - 2]
                    .distanceTo(newPoints[newPoints.length - 1]);

                line.bindTooltip(`${(distance / 1000).toFixed(2)} km`, {
                    permanent: true,
                    direction: 'center'
                });
            }
        }
    };

    const toggleDistanceMode = () => {
        const newDistanceMode = !distanceMode;
        setDistanceMode(newDistanceMode);

        if (!newDistanceMode) {
            // Clear distance measurements
            distanceMarkersRef.current.forEach(marker =>
                mapInstanceRef.current.removeLayer(marker)
            );
            distanceLinesRef.current.forEach(line =>
                mapInstanceRef.current.removeLayer(line)
            );
            setDistancePoints([]);
            distanceMarkersRef.current = [];
            distanceLinesRef.current = [];

            if (mapInstanceRef.current) {
                mapInstanceRef.current.getContainer().style.cursor = '';
            }
        } else {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.getContainer().style.cursor = 'crosshair';
            }
        }
    };

    // Create status message for current selection
    const getStatusMessage = () => {
        let message = '';

        // Handle 'select' case
        if (selectedPollutant === 'select') {
            message = 'No pollutant layer selected. Choose a pollutant from the filter panel to display grid visualization';
        } else {
            // Original logic for when a pollutant is selected
            const pollutantName = enhancedGridData?.pollutantColorSchemes?.[selectedPollutant]?.name || selectedPollutant.toUpperCase();

            // Grid layer status
            if (selectedSources.length === 0) {
                message = `Showing base ${pollutantName} distribution`;
            } else {
                const sourceNames = selectedSources.map(source =>
                    enhancedGridData?.pollutionSources?.[source]?.name || source
                ).join(' + ');
                message = `Showing ${pollutantName} colored by concentration, opacity by ${sourceNames} contribution (${visibleGridCount} grids visible)`;
            }
        }

        // Add sensor status
        if (showSensors && sensorData.length > 0) {
            const activeSensorFilters = Object.values(sensorFilters.source || {}).filter(Boolean).length +
                Object.values(sensorFilters.severity || {}).filter(Boolean).length;

            if (activeSensorFilters > 0) {
                message += `. ${sensorData.length} filtered monitoring stations displayed`;
            } else {
                message += `. ${sensorData.length} monitoring stations displayed`;
            }
        } else if (showSensors) {
            message += '. No monitoring stations to display';
        }

        return message;
    };

    // Calculate sensor statistics for display
    const getSensorStats = () => {
        if (!sensorData || sensorData.length === 0) return null;

        const stats = {
            total: sensorData.length,
            avgAQI: Math.round(sensorData.reduce((sum, sensor) => sum + sensor.aqi, 0) / sensorData.length),
            maxAQI: Math.max(...sensorData.map(s => s.aqi)),
            minAQI: Math.min(...sensorData.map(s => s.aqi))
        };

        // Count by severity
        const severityCounts = sensorData.reduce((acc, sensor) => {
            acc[sensor.severity] = (acc[sensor.severity] || 0) + 1;
            return acc;
        }, {});

        stats.severityBreakdown = severityCounts;
        return stats;
    };

    const sensorStats = getSensorStats();

    return (
        <div className={`map-container ${filtersVisible ? 'with-filters' : ''}`}>
            <LayerControls
                selectedMapStyle={selectedMapStyle}
                onMapStyleChange={onMapStyleChange}
                showAQILayer={showDataLayer}
                onAQIToggle={onDataLayerToggle}
                distanceMode={distanceMode}
                onDistanceModeToggle={toggleDistanceMode}
                coordinates={coordinates}
                // New sensor controls
                showSensors={showSensors}
                sensorStats={sensorStats}
            />

            {/* Enhanced Status Information */}
            <div className="map-status-bar">
                <div className="status-message">
                    {getStatusMessage()}
                </div>
                <div className="status-details">
                    {/* Grid data indicators - only show if pollutant is selected */}
                    {enhancedGridData && selectedPollutant !== 'select' && (
                        <>
                            <span className="pollutant-indicator">
                                🌫️ {enhancedGridData?.pollutantColorSchemes?.[selectedPollutant]?.name}
                            </span>
                            {selectedSources.length > 0 && (
                                <>
                                    <span className="sources-indicator">
                                        🏭 {selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''}
                                    </span>
                                    <span className="grids-indicator">
                                        📊 {visibleGridCount} grid{visibleGridCount !== 1 ? 's' : ''} visible
                                    </span>
                                </>
                            )}
                            {selectedSources.length === 0 && (
                                <span className="base-layer-indicator">
                                    📊 Base distribution (all grids visible)
                                </span>
                            )}
                        </>
                    )}

                    {/* Show message when no pollutant is selected */}
                    {selectedPollutant === 'select' && (
                        <span className="no-pollutant-indicator">
                            💡 Select a pollutant to view grid analysis
                        </span>
                    )}

                    {/* Sensor indicators */}
                    {showSensors && sensorStats && (
                        <>
                            <span className="sensor-indicator">
                                📡 {sensorStats.total} station{sensorStats.total !== 1 ? 's' : ''}
                            </span>
                            <span className="sensor-aqi-indicator">
                                🎯 AQI: {sensorStats.minAQI}-{sensorStats.maxAQI} (avg: {sensorStats.avgAQI})
                            </span>
                        </>
                    )}

                    {/* Display options indicators */}
                    {sensorDisplayOptions && (
                        <>
                            {sensorDisplayOptions.showLabels && (
                                <span className="option-indicator">
                                    🏷️ Labels
                                </span>
                            )}
                            {sensorDisplayOptions.showValues && (
                                <span className="option-indicator">
                                    🔢 Values
                                </span>
                            )}
                            {sensorDisplayOptions.clusterNearby && (
                                <span className="option-indicator">
                                    🔗 Clustered
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div ref={mapRef} className="map" />

            {/* Enhanced Grid Visualization Layer - only render if pollutant is selected */}
            {enhancedGridData && selectedPollutant !== 'select' && (
                <EnhancedGridLayer
                    gridData={enhancedGridData}
                    selectedPollutant={selectedPollutant}
                    selectedSources={selectedSources}
                    map={mapInstanceRef.current}
                    isVisible={showDataLayer}
                />
            )}

            {/* Sensor Markers Layer */}
            {sensorData && sensorData.length > 0 && (
                <AQIMarker
                    sensorData={sensorData}
                    map={mapInstanceRef.current}
                    isVisible={showSensors}
                    sensorFilters={sensorFilters}
                    showLabels={sensorDisplayOptions.showLabels}
                    showValues={sensorDisplayOptions.showValues}
                    clusterNearby={sensorDisplayOptions.clusterNearby}
                />
            )}

            {/* Instructions Overlay */}
            {selectedPollutant === 'select' && !enhancedGridData && sensorData.length === 0 && (
                <div className="instructions-overlay">
                    <div className="instructions-content">
                        <h3>🌍 Air Quality Analysis</h3>
                        <p>Loading pollution visualization data...</p>
                        <div className="instructions-steps">
                            <div className="instruction-step">
                                <span className="step-number">1</span>
                                <span className="step-text">Data is being generated...</span>
                            </div>
                            <div className="instruction-step">
                                <span className="step-number">2</span>
                                <span className="step-text">Select a pollutant to display grid analysis</span>
                            </div>
                            <div className="instruction-step">
                                <span className="step-number">3</span>
                                <span className="step-text">Use filter panel to analyze pollution sources</span>
                            </div>
                            <div className="instruction-step">
                                <span className="step-number">4</span>
                                <span className="step-text">Sensor stations show real measurements</span>
                            </div>
                        </div>
                        <p className="instructions-note">
                            Grid visualization will appear once you select a pollutant
                        </p>
                    </div>
                </div>
            )}

            {/* Enhanced Instructions when Select is chosen but data is available */}
            {selectedPollutant === 'select' && (enhancedGridData || sensorData.length > 0) && (
                <div className="data-available-info">
                    {!filtersVisible && (
                        <div className="quick-hint">
                            <span className="hint-text">💡 Click the arrow (←) to open the filter panel and select a pollutant for grid analysis</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MapContainer;