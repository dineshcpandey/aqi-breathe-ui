import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import LayerControls from '../LayerControls/LayerControls';
import { baseLayers, getAQIColor, getAQIStatus } from '../../utils/mapUtils';
import { calculateDistance } from '../../utils/aqiUtils';
import { DEFAULT_MAP_CONFIG } from '../../utils/constants';
import './MapContainer.css';
import GridLayer from '../GridLayer/GridLayer';
import Legend from '../Legend/Legend';
import { generateSampleGridData, getDatasetStatistics } from '../../utils/gridDataGenerator';


// Fix for default markers in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapContainer = ({
    aqiData,
    selectedMapStyle,
    showAQILayer,
    onMapStyleChange,
    onAQIToggle,
    onAddAQIData
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const aqiLayerGroupRef = useRef(null);
    const [coordinates, setCoordinates] = useState('Click on map to see coordinates');
    const [distanceMode, setDistanceMode] = useState(false);
    const [distancePoints, setDistancePoints] = useState([]);
    const distanceMarkersRef = useRef([]);
    const distanceLinesRef = useRef([]);
    const [gridData, setGridData] = useState(null);
    const [selectedPollutant, setSelectedPollutant] = useState('aqi');
    const [gridStats, setGridStats] = useState(null);

    // Initialize map
    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current)
                .setView(DEFAULT_MAP_CONFIG.center, DEFAULT_MAP_CONFIG.zoom);

            // Add default base layer
            baseLayers[selectedMapStyle].addTo(mapInstanceRef.current);

            // Initialize AQI layer group
            aqiLayerGroupRef.current = L.layerGroup();

            // Add click event for coordinates and distance measurement
            mapInstanceRef.current.on('click', handleMapClick);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    //  useEffect to load grid data:
    useEffect(() => {
        // Generate grid data on component mount
        const data = generateSampleGridData();
        setGridData(data);
        setGridStats(getDatasetStatistics(data));
        console.log('Grid data loaded:', data.metadata);
    }, []);
    // Handle map style changes
    useEffect(() => {
        if (mapInstanceRef.current) {
            // Remove all base layers
            Object.values(baseLayers).forEach(layer => {
                mapInstanceRef.current.removeLayer(layer);
            });

            // Add selected layer
            baseLayers[selectedMapStyle].addTo(mapInstanceRef.current);
        }
    }, [selectedMapStyle]);

    // Handle AQI layer toggle
    useEffect(() => {
        if (mapInstanceRef.current && aqiLayerGroupRef.current) {
            if (showAQILayer) {
                createAQILayer();
                mapInstanceRef.current.addLayer(aqiLayerGroupRef.current);
            } else {
                mapInstanceRef.current.removeLayer(aqiLayerGroupRef.current);
            }
        }
    }, [showAQILayer, aqiData]);

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

    const createAQILayer = () => {
        if (!aqiLayerGroupRef.current) return;

        aqiLayerGroupRef.current.clearLayers();

        aqiData.forEach(point => {
            const color = getAQIColor(point.aqi);

            const aqiIcon = L.divIcon({
                className: 'aqi-marker',
                html: `<div class="aqi-marker-icon" style="background-color: ${color};">${point.aqi}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker([point.lat, point.lng], { icon: aqiIcon });

            marker.bindPopup(`
        <div class="aqi-popup">
          <h3>${point.station}</h3>
          <p><strong>AQI:</strong> <span style="color: ${color};">${point.aqi}</span></p>
          <p><strong>Status:</strong> ${getAQIStatus(point.aqi)}</p>
          <p class="coords">Lat: ${point.lat.toFixed(4)}, Lng: ${point.lng.toFixed(4)}</p>
        </div>
      `);

            aqiLayerGroupRef.current.addLayer(marker);
        });
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

    return (
        <div className="map-container">
            <LayerControls
                selectedMapStyle={selectedMapStyle}
                onMapStyleChange={onMapStyleChange}
                showAQILayer={showAQILayer}
                onAQIToggle={onAQIToggle}
                distanceMode={distanceMode}
                onDistanceModeToggle={toggleDistanceMode}
                coordinates={coordinates}
            />

            <div ref={mapRef} className="map" />

            {/* Grid Visualization Layer */}
            {gridData && (
                <GridLayer
                    gridData={gridData}
                    selectedPollutant={selectedPollutant}
                    map={mapInstanceRef.current}
                    isVisible={showAQILayer}
                />
            )}

            {/* Legend */}
            {gridData && (
                <Legend
                    colorSchemes={gridData.colorSchemes}
                    selectedPollutant={selectedPollutant}
                    onPollutantChange={setSelectedPollutant}
                    gridStats={gridStats}
                />
            )}
        </div>
    );

    // return (
    //     <div className="map-container">
    //         <LayerControls
    //             selectedMapStyle={selectedMapStyle}
    //             onMapStyleChange={onMapStyleChange}
    //             showAQILayer={showAQILayer}
    //             onAQIToggle={onAQIToggle}
    //             distanceMode={distanceMode}
    //             onDistanceModeToggle={toggleDistanceMode}
    //             coordinates={coordinates}
    //         />
    //         <div ref={mapRef} className="map" />
    //     </div>
    // );
};

export default MapContainer;
