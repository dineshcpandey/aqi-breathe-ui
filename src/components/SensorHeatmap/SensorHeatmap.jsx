import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';

const SensorHeatmap = ({
    sensorData = [],
    map,
    isVisible = false,
    selectedPollutant = 'aqi',
    intensity = 0.6,
    radius = 25
}) => {
    const heatmapLayerRef = useRef(null);

    useEffect(() => {
        if (!map || !sensorData.length) return;

        console.log('SensorHeatmap: Creating heatmap layer');

        // Clear existing heatmap
        if (heatmapLayerRef.current) {
            map.removeLayer(heatmapLayerRef.current);
            heatmapLayerRef.current = null;
        }

        if (!isVisible) return;

        // Prepare heatmap data points
        const heatmapPoints = sensorData.map(sensor => {
            const value = sensor[selectedPollutant];
            // Normalize value to 0-1 scale for heatmap intensity
            const normalizedIntensity = Math.min(value / 300, 1); // Assuming max AQI of 300

            return [sensor.lat, sensor.lng, normalizedIntensity];
        }).filter(point => point[2] > 0); // Only include points with valid data

        console.log(`Generated ${heatmapPoints.length} heatmap points for ${selectedPollutant}`);

        // Create heatmap layer
        if (window.L && window.L.heatLayer && heatmapPoints.length > 0) {
            heatmapLayerRef.current = L.heatLayer(heatmapPoints, {
                radius: radius,
                blur: 15,
                maxZoom: 17,
                max: 1.0,
                minOpacity: 0.1,
                gradient: {
                    0.0: '#00e400',  // Good (Green)
                    0.2: '#ffff00',  // Moderate (Yellow) 
                    0.4: '#ff7e00',  // Unhealthy for Sensitive (Orange)
                    0.6: '#ff0000',  // Unhealthy (Red)
                    0.8: '#8f3f97',  // Very Unhealthy (Purple)
                    1.0: '#7e0023'   // Hazardous (Maroon)
                }
            });

            map.addLayer(heatmapLayerRef.current);
        } else {
            console.warn('Heatmap library not available or no data points');
        }

        return () => {
            if (heatmapLayerRef.current && map.hasLayer(heatmapLayerRef.current)) {
                map.removeLayer(heatmapLayerRef.current);
                heatmapLayerRef.current = null;
            }
        };
    }, [map, sensorData, isVisible, selectedPollutant, intensity, radius]);

    // Handle visibility changes
    useEffect(() => {
        if (!map || !heatmapLayerRef.current) return;

        if (isVisible && !map.hasLayer(heatmapLayerRef.current)) {
            map.addLayer(heatmapLayerRef.current);
        } else if (!isVisible && map.hasLayer(heatmapLayerRef.current)) {
            map.removeLayer(heatmapLayerRef.current);
        }
    }, [map, isVisible]);

    return null; // This is a map layer component
};

export default SensorHeatmap;