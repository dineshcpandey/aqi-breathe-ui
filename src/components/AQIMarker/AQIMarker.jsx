// src/components/AQIMarker/AQIMarker.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import './AQIMarker.css';
import { getAQIColor, getAQIStatus } from '../../utils/mapUtils';

const AQIMarker = ({
    sensorData = [],
    map,
    isVisible = true,
    sensorFilters = {},
    showLabels = false,
    showValues = false,
    clusterNearby = true
}) => {
    const markersRef = useRef([]);
    const clusterGroupRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        console.log('=== AQI Marker Layer Update ===');
        console.log('Sensor Data Count:', sensorData.length);
        console.log('Is Visible:', isVisible);
        console.log('Sensor Filters:', sensorFilters);

        // Clear existing markers
        clearMarkers();

        if (!isVisible || sensorData.length === 0) {
            return;
        }

        // Filter sensor data based on active filters
        const filteredSensors = filterSensorData(sensorData, sensorFilters);
        console.log('Filtered Sensors:', filteredSensors.length);

        // Create cluster group if clustering is enabled
        if (clusterNearby && window.L && window.L.markerClusterGroup) {
            clusterGroupRef.current = L.markerClusterGroup({
                maxClusterRadius: 50,
                iconCreateFunction: function (cluster) {
                    const count = cluster.getChildCount();
                    const avgAqi = Math.round(
                        cluster.getAllChildMarkers()
                            .reduce((sum, marker) => sum + (marker.options.aqiValue || 0), 0) / count
                    );

                    return L.divIcon({
                        html: `<div class="sensor-marker clustered" style="background: ${getAQIColor(avgAqi)};">
                                 <span>${count}</span>
                               </div>`,
                        className: 'sensor-cluster-marker',
                        iconSize: L.point(35, 35, true)
                    });
                }
            });
        }

        // Create markers for filtered sensors
        filteredSensors.forEach(sensor => {
            const marker = createSensorMarker(sensor, showLabels, showValues);

            if (clusterNearby && clusterGroupRef.current) {
                clusterGroupRef.current.addLayer(marker);
            } else {
                marker.addTo(map);
                markersRef.current.push(marker);
            }
        });

        // Add cluster group to map
        if (clusterNearby && clusterGroupRef.current) {
            map.addLayer(clusterGroupRef.current);
        }

    }, [map, sensorData, isVisible, sensorFilters, showLabels, showValues, clusterNearby]);

    // Cleanup function
    const clearMarkers = () => {
        // Remove individual markers
        markersRef.current.forEach(marker => {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        });
        markersRef.current = [];

        // Remove cluster group
        if (clusterGroupRef.current && map.hasLayer(clusterGroupRef.current)) {
            map.removeLayer(clusterGroupRef.current);
            clusterGroupRef.current = null;
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearMarkers();
        };
    }, [map]);

    return null; // This is a map layer component
};

// Helper function to filter sensor data based on active filters
const filterSensorData = (sensorData, filters) => {
    if (!filters || Object.keys(filters).length === 0) {
        return sensorData;
    }

    return sensorData.filter(sensor => {
        // Filter by source type
        if (filters.source && Object.keys(filters.source).length > 0) {
            const activeSourceFilters = Object.keys(filters.source).filter(key => filters.source[key]);
            if (activeSourceFilters.length > 0 && !activeSourceFilters.includes(sensor.source)) {
                return false;
            }
        }

        // Filter by severity
        if (filters.severity && Object.keys(filters.severity).length > 0) {
            const activeSeverityFilters = Object.keys(filters.severity).filter(key => filters.severity[key]);
            if (activeSeverityFilters.length > 0 && !activeSeverityFilters.includes(sensor.severity)) {
                return false;
            }
        }

        return true;
    });
};

// Helper function to create individual sensor markers
const createSensorMarker = (sensor, showLabels, showValues) => {
    const aqiColor = getAQIColor(sensor.aqi);
    const aqiStatus = getAQIStatus(sensor.aqi);

    // Create marker icon HTML
    const iconHtml = `
        <div class="sensor-marker ${sensor.source}" style="background: ${aqiColor};">
            ${showValues ? sensor.aqi : getSourceIcon(sensor.source)}
            ${showLabels ? `<div class="sensor-marker-label">${sensor.station}</div>` : ''}
        </div>
    `;

    // Create marker
    const marker = L.marker([sensor.lat, sensor.lng], {
        icon: L.divIcon({
            html: iconHtml,
            className: 'aqi-marker-wrapper',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        }),
        aqiValue: sensor.aqi, // Store for cluster calculations
        sensorData: sensor
    });

    // Create detailed popup
    const popupContent = createSensorPopup(sensor, aqiColor, aqiStatus);
    marker.bindPopup(popupContent);

    // Add hover effects
    marker.on('mouseover', function (e) {
        const markerElement = e.target.getElement();
        if (markerElement) {
            markerElement.style.transform = 'scale(1.2)';
            markerElement.style.zIndex = '1000';
        }
    });

    marker.on('mouseout', function (e) {
        const markerElement = e.target.getElement();
        if (markerElement) {
            markerElement.style.transform = 'scale(1)';
            markerElement.style.zIndex = 'auto';
        }
    });

    return marker;
};

// Helper function to get source icon
const getSourceIcon = (source) => {
    const icons = {
        construction: '🏗️',
        vehicle: '🚗',
        dust: '🌪️',
        industrial: '🏭',
        residential: '🏠'
    };
    return icons[source] || '📍';
};

// Helper function to create sensor popup content
const createSensorPopup = (sensor, aqiColor, aqiStatus) => {
    const readings = [
        { label: 'AQI', value: sensor.aqi, unit: '' },
        { label: 'PM2.5', value: sensor.pm25, unit: 'µg/m³' },
        { label: 'PM10', value: sensor.pm10, unit: 'µg/m³' },
        { label: 'CO', value: sensor.co, unit: 'ppm' },
        { label: 'NO₂', value: sensor.no2, unit: 'µg/m³' },
        { label: 'SO₂', value: sensor.so2, unit: 'µg/m³' }
    ];

    const environmentalData = [
        { label: 'Humidity', value: sensor.rh, unit: '%' },
        { label: 'Temperature', value: sensor.temperature, unit: '°C' },
        { label: 'Wind Speed', value: sensor.windSpeed, unit: 'm/s' }
    ];

    return `
        <div class="sensor-popup">
            <h3>
                ${getSourceIcon(sensor.source)} ${sensor.station}
                <span class="sensor-type-badge">${sensor.source}</span>
            </h3>
            
            <div class="sensor-status ${sensor.severity}" style="color: ${aqiColor};">
                ⚠️ ${aqiStatus} (AQI: ${sensor.aqi})
            </div>

            <div class="sensor-readings">
                ${readings.map(reading => `
                    <div class="reading-item ${reading.label === 'AQI' ? 'primary' : ''}">
                        <span class="reading-label">${reading.label}:</span>
                        <span class="reading-value" ${reading.label === 'AQI' ? `style="color: ${aqiColor};"` : ''}>
                            ${reading.value} ${reading.unit}
                        </span>
                    </div>
                `).join('')}
            </div>

            <div class="environmental-data">
                <h4>Environmental Conditions</h4>
                <div class="env-readings">
                    ${environmentalData.map(env => `
                        <div class="reading-item small">
                            <span class="reading-label">${env.label}:</span>
                            <span class="reading-value">${env.value} ${env.unit}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="sensor-description">
                <p><strong>Description:</strong> ${sensor.description}</p>
            </div>

            <div class="sensor-metadata">
                <div class="sensor-coordinates">
                    📍 Lat: ${sensor.lat.toFixed(6)}, Lng: ${sensor.lng.toFixed(6)}
                </div>
                <div class="sensor-timestamp">
                    🕐 Last updated: ${new Date(sensor.timestamp).toLocaleString()}
                </div>
            </div>
        </div>
    `;
};

export default AQIMarker;