import React, { useState, useEffect, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { getAQIColor, getAQIStatus } from '../utils/mapUtils';

const MobileOptimizedSensorView = ({
    sensorData = [],
    onSensorSelect,
    selectedSensor,
    filters,
    onFilterChange,
    isVisible = false
}) => {
    const [view, setView] = useState('list'); // 'list', 'nearby', 'alerts'
    const [location, setLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sortBy, setSortBy] = useState('aqi'); // 'aqi', 'distance', 'name'
    const [searchTerm, setSearchTerm] = useState('');

    // Get user location for nearby sensors
    useEffect(() => {
        if (view === 'nearby' && !location && navigator.geolocation) {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                    setIsLoading(false);
                },
                (error) => {
                    console.error('Location error:', error);
                    setIsLoading(false);
                    // Show error message to user
                    alert('Unable to get your location. Please enable location services.');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        }
    }, [view, location]);

    // Calculate distances and sort data
    const processedSensorData = useMemo(() => {
        let processed = [...sensorData];

        // Filter by search term
        if (searchTerm) {
            processed = processed.filter(sensor =>
                sensor.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sensor.source.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Add distances if location available
        if (location) {
            processed = processed.map(sensor => ({
                ...sensor,
                distance: calculateDistance(
                    [location.lat, location.lng],
                    [sensor.lat, sensor.lng]
                )
            }));
        }

        // Sort based on selected criteria
        switch (sortBy) {
            case 'aqi':
                processed.sort((a, b) => b.aqi - a.aqi);
                break;
            case 'distance':
                if (location) {
                    processed.sort((a, b) => (a.distance || 0) - (b.distance || 0));
                }
                break;
            case 'name':
                processed.sort((a, b) => a.station.localeCompare(b.station));
                break;
            default:
                break;
        }

        // Filter for alerts view
        if (view === 'alerts') {
            processed = processed.filter(sensor => sensor.aqi > 150);
        }

        return processed;
    }, [sensorData, location, sortBy, searchTerm, view]);

    // Calculate quick statistics
    const stats = useMemo(() => {
        if (!sensorData.length) return {};

        const totalSensors = sensorData.length;
        const highAQI = sensorData.filter(s => s.aqi > 150).length;
        const criticalAQI = sensorData.filter(s => s.aqi > 300).length;
        const averageAQI = Math.round(
            sensorData.reduce((sum, s) => sum + s.aqi, 0) / totalSensors
        );

        return { totalSensors, highAQI, criticalAQI, averageAQI };
    }, [sensorData]);

    // Virtualized list item renderer
    const SensorListItem = ({ index, style }) => {
        const sensor = processedSensorData[index];
        const isSelected = selectedSensor?.id === sensor.id;
        const aqiColor = getAQIColor(sensor.aqi);
        const aqiStatus = getAQIStatus(sensor.aqi);

        return (
            <div
                style={style}
                className={`mobile-sensor-item ${sensor.severity} ${isSelected ? 'selected' : ''}`}
                onClick={() => onSensorSelect(sensor)}
            >
                <div className="sensor-item-header">
                    <div className="sensor-basic-info">
                        <div className="sensor-name-mobile">{sensor.station}</div>
                        <div className="sensor-source-mobile">
                            {getSourceIcon(sensor.source)} {sensor.source}
                        </div>
                        <div className="sensor-status-mobile" style={{ color: aqiColor }}>
                            {aqiStatus}
                        </div>
                    </div>

                    <div className="sensor-readings-mobile">
                        <div className="aqi-large" style={{ backgroundColor: aqiColor }}>
                            {sensor.aqi}
                        </div>
                        <div className="aqi-label">AQI</div>
                    </div>
                </div>

                <div className="sensor-item-details">
                    <div className="mini-readings">
                        <span className="reading-item-mini">PM2.5: {sensor.pm25}</span>
                        <span className="reading-item-mini">PM10: {sensor.pm10}</span>
                        <span className="reading-item-mini">CO: {sensor.co}</span>
                    </div>

                    <div className="sensor-meta">
                        {view === 'nearby' && sensor.distance && (
                            <div className="distance-info">
                                📍 {(sensor.distance / 1000).toFixed(1)}km away
                            </div>
                        )}
                        <div className="update-time">
                            🕐 {getRelativeTime(sensor.timestamp)}
                        </div>
                    </div>
                </div>

                <div className="sensor-status-indicator">
                    <div className={`status-dot ${sensor.severity}`}></div>
                </div>
            </div>
        );
    };

    if (!isVisible) return null;

    return (
        <div className="mobile-sensor-view">
            {/* Header with search and controls */}
            <div className="mobile-sensor-header">
                <div className="search-and-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search stations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mobile-search-input"
                        />
                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchTerm('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="sort-container">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="mobile-sort-select"
                        >
                            <option value="aqi">Sort by AQI</option>
                            <option value="name">Sort by Name</option>
                            {location && <option value="distance">Sort by Distance</option>}
                        </select>
                    </div>
                </div>
            </div>

            {/* View Selector */}
            <div className="mobile-view-selector">
                <button
                    className={`view-btn ${view === 'list' ? 'active' : ''}`}
                    onClick={() => setView('list')}
                >
                    📋 All ({processedSensorData.length})
                </button>
                <button
                    className={`view-btn ${view === 'nearby' ? 'active' : ''}`}
                    onClick={() => setView('nearby')}
                >
                    📍 Nearby
                </button>
                <button
                    className={`view-btn alerts ${view === 'alerts' ? 'active' : ''}`}
                    onClick={() => setView('alerts')}
                >
                    ⚠️ Alerts ({stats.highAQI})
                </button>
            </div>

            {/* Quick Stats */}
            <div className="mobile-quick-stats">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalSensors}</div>
                    <div className="stat-label">Total Stations</div>
                </div>
                <div className="stat-card moderate">
                    <div className="stat-value">{stats.averageAQI}</div>
                    <div className="stat-label">Avg AQI</div>
                </div>
                <div className="stat-card high">
                    <div className="stat-value">{stats.highAQI}</div>
                    <div className="stat-label">High AQI</div>
                </div>
                <div className="stat-card critical">
                    <div className="stat-value">{stats.criticalAQI}</div>
                    <div className="stat-label">Critical</div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="mobile-loading">
                    <div className="loading-spinner"></div>
                    <p>Getting your location...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && processedSensorData.length === 0 && (
                <div className="mobile-empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No sensors found</h3>
                    <p>
                        {searchTerm ?
                            `No stations match "${searchTerm}"` :
                            'No sensor data available for this view'
                        }
                    </p>
                    {searchTerm && (
                        <button
                            className="clear-search-btn"
                            onClick={() => setSearchTerm('')}
                        >
                            Clear search
                        </button>
                    )}
                </div>
            )}

            {/* Virtualized Sensor List */}
            {!isLoading && processedSensorData.length > 0 && (
                <div className="mobile-sensor-list">
                    <List
                        height={500}
                        itemCount={processedSensorData.length}
                        itemSize={140} // Height of each sensor item
                        itemData={processedSensorData}
                        overscanCount={5} // Render extra items for smooth scrolling
                    >
                        {SensorListItem}
                    </List>
                </div>
            )}

            {/* Location permission prompt */}
            {view === 'nearby' && !location && !isLoading && (
                <div className="location-prompt">
                    <div className="prompt-content">
                        <h3>📍 Location Access</h3>
                        <p>Enable location to find sensors near you</p>
                        <button
                            className="enable-location-btn"
                            onClick={() => {
                                setIsLoading(true);
                                navigator.geolocation.getCurrentPosition(
                                    (pos) => {
                                        setLocation({
                                            lat: pos.coords.latitude,
                                            lng: pos.coords.longitude
                                        });
                                        setIsLoading(false);
                                    },
                                    () => setIsLoading(false)
                                );
                            }}
                        >
                            Enable Location
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .mobile-sensor-view {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #f8f9fa;
                }

                .mobile-sensor-header {
                    background: white;
                    padding: 12px 16px;
                    border-bottom: 1px solid #e0e0e0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .search-and-controls {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .search-container {
                    flex: 1;
                    position: relative;
                }

                .mobile-search-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 14px;
                }

                .clear-search {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    font-size: 14px;
                    color: #666;
                    cursor: pointer;
                    padding: 4px;
                }

                .mobile-sort-select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 12px;
                    background: white;
                }

                .mobile-view-selector {
                    display: flex;
                    background: white;
                    padding: 8px 16px;
                    border-bottom: 1px solid #e0e0e0;
                    gap: 8px;
                    overflow-x: auto;
                }

                .view-btn {
                    padding: 8px 16px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s ease;
                }

                .view-btn.active {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }

                .view-btn.alerts.active {
                    background: #e74c3c;
                    border-color: #e74c3c;
                }

                .mobile-quick-stats {
                    display: flex;
                    padding: 12px 16px;
                    gap: 12px;
                    background: white;
                    border-bottom: 1px solid #e0e0e0;
                    overflow-x: auto;
                }

                .stat-card {
                    min-width: 70px;
                    text-align: center;
                    padding: 8px 12px;
                    border-radius: 8px;
                    background: #f8f9fa;
                }

                .stat-card.moderate { background: rgba(241, 196, 15, 0.1); }
                .stat-card.high { background: rgba(231, 76, 60, 0.1); }
                .stat-card.critical { background: rgba(123, 36, 28, 0.1); }

                .stat-value {
                    font-size: 18px;
                    font-weight: bold;
                    color: #2c3e50;
                }

                .stat-label {
                    font-size: 10px;
                    color: #7f8c8d;
                    margin-top: 2px;
                }

                .mobile-sensor-list {
                    flex: 1;
                    background: #f8f9fa;
                }

                .mobile-sensor-item {
                    background: white;
                    margin: 8px 16px;
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 2px solid transparent;
                }

                .mobile-sensor-item:active {
                    transform: scale(0.98);
                }

                .mobile-sensor-item.selected {
                    border-color: #667eea;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .sensor-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }

                .sensor-name-mobile {
                    font-size: 16px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 4px;
                }

                .sensor-source-mobile {
                    font-size: 12px;
                    color: #7f8c8d;
                    margin-bottom: 4px;
                }

                .sensor-status-mobile {
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .sensor-readings-mobile {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .aqi-large {
                    width: 50px;
                    height: 50px;
                    border-radius: 25px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }

                .aqi-label {
                    font-size: 10px;
                    color: #7f8c8d;
                    margin-top: 4px;
                    font-weight: 600;
                }

                .sensor-item-details {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .mini-readings {
                    display: flex;
                    gap: 12px;
                }

                .reading-item-mini {
                    font-size: 11px;
                    color: #7f8c8d;
                    background: #f8f9fa;
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .sensor-meta {
                    text-align: right;
                }

                .distance-info {
                    font-size: 11px;
                    color: #3498db;
                    margin-bottom: 2px;
                }

                .update-time {
                    font-size: 10px;
                    color: #95a5a6;
                }

                .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    position: absolute;
                    top: 12px;
                    right: 12px;
                }

                .status-dot.moderate { background: #f39c12; }
                .status-dot.high { background: #e74c3c; }
                .status-dot.very_high { background: #8e44ad; }
                .status-dot.hazardous { background: #7b241c; }

                .mobile-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    color: #7f8c8d;
                }

                .loading-spinner {
                    width: 24px;
                    height: 24px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 12px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .mobile-empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    text-align: center;
                    color: #7f8c8d;
                }

                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .location-prompt {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                    padding: 40px;
                }

                .prompt-content {
                    text-align: center;
                    max-width: 300px;
                }

                .enable-location-btn {
                    padding: 12px 24px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 16px;
                }

                .clear-search-btn {
                    padding: 8px 16px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    margin-top: 12px;
                }
            `}</style>
        </div>
    );
};

// Helper functions
const calculateDistance = (point1, point2) => {
    const R = 6371000; // Earth's radius in meters
    const φ1 = point1[0] * Math.PI / 180;
    const φ2 = point2[0] * Math.PI / 180;
    const Δφ = (point2[0] - point1[0]) * Math.PI / 180;
    const Δλ = (point2[1] - point1[1]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

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

const getRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return time.toLocaleDateString();
};

export default MobileOptimizedSensorView;