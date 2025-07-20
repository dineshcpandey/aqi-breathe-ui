// src/components/LayerControls/LayerControls.jsx - Updated with Sensor Controls
import React from 'react';
import './LayerControls.css';

const LayerControls = ({
    selectedMapStyle,
    onMapStyleChange,
    showAQILayer,
    onAQIToggle,
    distanceMode,
    onDistanceModeToggle,
    coordinates,
    // New sensor-related props
    showSensors = true,
    sensorStats = null
}) => {
    return (
        <div className="custom-controls">
            <div className="control-group">
                <label>Map Style</label>
                <select
                    value={selectedMapStyle}
                    onChange={(e) => onMapStyleChange(e.target.value)}
                >
                    <option value="osm">OpenStreetMap</option>
                    <option value="topo">Topographic</option>
                    <option value="satellite">Satellite</option>
                    <option value="dark">Dark Mode</option>
                </select>
            </div>

            <div className="control-group">
                <label>Data Layers</label>
                <button
                    className={showAQILayer ? 'active' : ''}
                    onClick={onAQIToggle}
                >
                    {showAQILayer ? '🌫️ Hide Grid Data' : '🌫️ Show Grid Data'}
                </button>
            </div>

            {/* New Sensor Information Display */}
            {sensorStats && (
                <div className="control-group sensor-info">
                    <label>Monitoring Stations</label>
                    <div className="sensor-stats-mini">
                        <div className="sensor-stat-row">
                            <span className="stat-label">📡 Total:</span>
                            <span className="stat-value">{sensorStats.total}</span>
                        </div>
                        <div className="sensor-stat-row">
                            <span className="stat-label">🎯 AQI Range:</span>
                            <span className="stat-value">{sensorStats.minAQI}-{sensorStats.maxAQI}</span>
                        </div>
                        <div className="sensor-stat-row">
                            <span className="stat-label">📊 Average:</span>
                            <span className="stat-value">{sensorStats.avgAQI}</span>
                        </div>

                        {/* Severity Breakdown */}
                        {sensorStats.severityBreakdown && Object.keys(sensorStats.severityBreakdown).length > 0 && (
                            <div className="severity-breakdown">
                                <div className="severity-title">Severity Distribution:</div>
                                {Object.entries(sensorStats.severityBreakdown).map(([severity, count]) => {
                                    const severityConfig = {
                                        'moderate': { color: '#f39c12', icon: '🟡' },
                                        'high': { color: '#e74c3c', icon: '🟠' },
                                        'very_high': { color: '#8e44ad', icon: '🔴' },
                                        'hazardous': { color: '#7b241c', icon: '⚫' }
                                    };
                                    const config = severityConfig[severity] || { color: '#95a5a6', icon: '⚪' };

                                    return (
                                        <div key={severity} className="severity-item">
                                            <span className="severity-icon">{config.icon}</span>
                                            <span className="severity-label" style={{ color: config.color }}>
                                                {severity.replace('_', ' ')}:
                                            </span>
                                            <span className="severity-count">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="control-group">
                <label>Tools</label>
                <button
                    className={distanceMode ? 'active' : ''}
                    onClick={onDistanceModeToggle}
                >
                    {distanceMode ? '📏 Exit Measure' : '📏 Measure Distance'}
                </button>
                {distanceMode && (
                    <div className="tool-info">
                        Click on map to measure distances
                    </div>
                )}
            </div>

            <div className="coords-display">
                {coordinates}
            </div>
        </div>
    );
};

export default LayerControls;