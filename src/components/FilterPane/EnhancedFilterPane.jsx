// src/components/FilterPane/EnhancedFilterPane.jsx - Updated with Select Option
import React, { useState } from 'react';
import './EnhancedFilterPane.css';
import { POLLUTANT_COLOR_SCHEMES, POLLUTION_SOURCES } from '../../utils/enhancedGridGenerator';

const EnhancedFilterPane = ({
    filters,
    onFilterChange,
    isVisible,
    onToggleVisibility,
    selectedPollutant = 'select',  // Changed default to 'select'
    onPollutantChange,
    pollutantStats = {},
    sourceStats = {},
    // Sensor-related props
    sensorData = [],
    showSensors = true,
    onSensorToggle,
    sensorFilters = {},
    onSensorFilterChange
}) => {
    const [expandedGroups, setExpandedGroups] = useState({
        pollutants: true,
        sources: true,
        sensors: true,
        colorScale: true,
        statistics: true
    });

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const handleFilterToggle = (category, filterId) => {
        console.log(`Enhanced FilterPane: Toggling ${category}.${filterId}`);
        onFilterChange(category, filterId);
    };

    const handleSensorFilterToggle = (filterType, value) => {
        console.log(`Sensor Filter: Toggling ${filterType}.${value}`);
        onSensorFilterChange(filterType, value);
    };

    const clearAllFilters = () => {
        console.log('Clearing all filters');

        // Clear all source filters
        Object.keys(filters.sources || {}).forEach(sourceId => {
            if (filters.sources[sourceId]) {
                handleFilterToggle('sources', sourceId);
            }
        });

        // Reset pollutant to Select
        if (selectedPollutant !== 'select') {
            onPollutantChange('select');
        }
    };

    // Get active source count
    const activeSourceCount = Object.values(filters.sources || {}).filter(Boolean).length;
    const pollutantScheme = selectedPollutant !== 'select' ? POLLUTANT_COLOR_SCHEMES[selectedPollutant] : null;

    // Calculate sensor statistics
    const sensorStats = React.useMemo(() => {
        if (!sensorData || sensorData.length === 0) return {};

        const stats = {
            total: sensorData.length,
            bySource: {},
            bySeverity: {},
            aqiRange: { min: Infinity, max: -Infinity, avg: 0 }
        };

        let totalAqi = 0;

        sensorData.forEach(sensor => {
            // By source
            stats.bySource[sensor.source] = (stats.bySource[sensor.source] || 0) + 1;

            // By severity
            stats.bySeverity[sensor.severity] = (stats.bySeverity[sensor.severity] || 0) + 1;

            // AQI stats
            if (sensor.aqi < stats.aqiRange.min) stats.aqiRange.min = sensor.aqi;
            if (sensor.aqi > stats.aqiRange.max) stats.aqiRange.max = sensor.aqi;
            totalAqi += sensor.aqi;
        });

        stats.aqiRange.avg = Math.round(totalAqi / sensorData.length);

        return stats;
    }, [sensorData]);

    // Get active sensor filters count
    const activeSensorFilters = Object.values(sensorFilters).reduce((count, filterGroup) => {
        return count + Object.values(filterGroup).filter(Boolean).length;
    }, 0);

    return (
        <>
            {/* Toggle Button */}
            <div className="filter-toggle" onClick={onToggleVisibility}>
                <div className={`toggle-icon ${isVisible ? 'expanded' : ''}`}>
                    {isVisible ? '←' : '→'}
                </div>
            </div>

            {/* Enhanced Filter Pane */}
            <div className={`filter-pane enhanced ${isVisible ? 'visible' : 'hidden'}`}>
                <div className="filter-header">
                    <h2>POLLUTION ANALYSIS</h2>
                    <button className="close-btn" onClick={onToggleVisibility}>×</button>
                </div>

                <div className="filter-content">

                    {/* POLLUTANT SELECTION SECTION */}
                    <div className="filter-group">
                        <div
                            className="group-header"
                            onClick={() => toggleGroup('pollutants')}
                        >
                            <span className="group-icon">🌍</span>
                            <span className="group-title">POLLUTANTS</span>
                            <span className={`expand-icon ${expandedGroups.pollutants ? 'expanded' : ''}`}>▼</span>
                        </div>

                        {expandedGroups.pollutants && (
                            <div className="group-items">
                                <div className="pollutant-selector-section">
                                    <label className="pollutant-label">Active Pollutant Layer:</label>
                                    <select
                                        value={selectedPollutant}
                                        onChange={(e) => onPollutantChange(e.target.value)}
                                        className="pollutant-select"
                                    >
                                        {/* Add Select option at the top */}
                                        <option value="select">Select a pollutant...</option>
                                        {Object.entries(POLLUTANT_COLOR_SCHEMES).map(([key, scheme]) => (
                                            <option key={key} value={key}>
                                                {scheme.name} ({scheme.unit})
                                            </option>
                                        ))}
                                    </select>

                                    {/* Current Pollutant Stats - only show if not 'select' */}
                                    {selectedPollutant !== 'select' && pollutantStats[selectedPollutant] && (
                                        <div className="pollutant-stats-mini">
                                            <div className="stat-row">
                                                <span className="stat-label">Range:</span>
                                                <span className="stat-value">
                                                    {pollutantStats[selectedPollutant].min} - {pollutantStats[selectedPollutant].max} {pollutantScheme?.unit}
                                                </span>
                                            </div>
                                            <div className="stat-row">
                                                <span className="stat-label">Average:</span>
                                                <span className="stat-value">
                                                    {pollutantStats[selectedPollutant].avg} {pollutantScheme?.unit}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Show message when Select is chosen */}
                                    {selectedPollutant === 'select' && (
                                        <div className="no-pollutant-selected">
                                            <div className="no-pollutant-message">
                                                <span className="info-icon">ℹ️</span>
                                                <p>Select a pollutant to display grid visualization on the map.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SENSORS SECTION */}
                    <div className="filter-group">
                        <div
                            className="group-header"
                            onClick={() => toggleGroup('sensors')}
                        >
                            <span className="group-icon">📡</span>
                            <span className="group-title">MONITORING STATIONS</span>
                            {activeSensorFilters > 0 && (
                                <span className="active-count">{activeSensorFilters}</span>
                            )}
                            <span className={`expand-icon ${expandedGroups.sensors ? 'expanded' : ''}`}>▼</span>
                        </div>

                        {expandedGroups.sensors && (
                            <div className="group-items">
                                {/* Sensor Layer Toggle */}
                                <div className="sensor-toggle-section">
                                    <div className="filter-item sensor-toggle-item" onClick={onSensorToggle}>
                                        <div className="sensor-toggle-main">
                                            <div className="filter-icon">📡</div>
                                            <div className="sensor-info">
                                                <span className="filter-label">Show Sensor Stations</span>
                                                <span className="sensor-description">
                                                    Display {sensorStats.total} monitoring stations on map
                                                </span>
                                            </div>
                                            <div className={`toggle-switch ${showSensors ? 'on' : 'off'}`}>
                                                <div className="toggle-slider"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {showSensors && (
                                    <>
                                        {/* Sensor Statistics Overview */}
                                        <div className="sensor-stats-overview">
                                            <h5>📊 Station Overview</h5>
                                            <div className="stats-summary-mini">
                                                <div className="stat-mini">
                                                    <span className="stat-value">{sensorStats.total}</span>
                                                    <span className="stat-label">Total Stations</span>
                                                </div>
                                                <div className="stat-mini">
                                                    <span className="stat-value">{sensorStats.aqiRange.min}-{sensorStats.aqiRange.max}</span>
                                                    <span className="stat-label">AQI Range</span>
                                                </div>
                                                <div className="stat-mini">
                                                    <span className="stat-value">{sensorStats.aqiRange.avg}</span>
                                                    <span className="stat-label">Avg AQI</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Filter by Source Type */}
                                        <div className="sensor-filter-subsection">
                                            <h5>🏭 Filter by Source Type</h5>
                                            <div className="sensor-source-filters">
                                                {Object.entries(sensorStats.bySource).map(([source, count]) => (
                                                    <div
                                                        key={source}
                                                        className={`sensor-filter-item ${sensorFilters.source?.[source] ? 'active' : ''}`}
                                                        onClick={() => handleSensorFilterToggle('source', source)}
                                                    >
                                                        <div className="sensor-filter-main">
                                                            <div className="source-indicator">
                                                                <span className="source-icon">
                                                                    {source === 'construction' ? '🏗️' :
                                                                        source === 'vehicle' ? '🚗' :
                                                                            source === 'dust' ? '🌪️' : '📍'}
                                                                </span>
                                                                <div className="source-info">
                                                                    <span className="source-name">
                                                                        {source.charAt(0).toUpperCase() + source.slice(1)}
                                                                    </span>
                                                                    <span className="source-count">{count} stations</span>
                                                                </div>
                                                            </div>
                                                            <div className={`sensor-checkbox ${sensorFilters.source?.[source] ? 'checked' : ''}`}>
                                                                {sensorFilters.source?.[source] ? '✓' : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Filter by AQI Severity */}
                                        <div className="sensor-filter-subsection">
                                            <h5>⚠️ Filter by AQI Severity</h5>
                                            <div className="sensor-severity-filters">
                                                {Object.entries(sensorStats.bySeverity).map(([severity, count]) => {
                                                    const severityConfig = {
                                                        'moderate': { color: '#f39c12', icon: '🟡', label: 'Moderate' },
                                                        'high': { color: '#e74c3c', icon: '🟠', label: 'High' },
                                                        'very_high': { color: '#8e44ad', icon: '🔴', label: 'Very High' },
                                                        'hazardous': { color: '#7b241c', icon: '⚫', label: 'Hazardous' }
                                                    };
                                                    const config = severityConfig[severity] || { color: '#95a5a6', icon: '⚪', label: severity };

                                                    return (
                                                        <div
                                                            key={severity}
                                                            className={`sensor-filter-item ${sensorFilters.severity?.[severity] ? 'active' : ''}`}
                                                            onClick={() => handleSensorFilterToggle('severity', severity)}
                                                        >
                                                            <div className="sensor-filter-main">
                                                                <div className="severity-indicator">
                                                                    <span className="severity-icon">{config.icon}</span>
                                                                    <div className="severity-info">
                                                                        <span className="severity-name" style={{ color: config.color }}>
                                                                            {config.label}
                                                                        </span>
                                                                        <span className="severity-count">{count} stations</span>
                                                                    </div>
                                                                </div>
                                                                <div className={`sensor-checkbox ${sensorFilters.severity?.[severity] ? 'checked' : ''}`}>
                                                                    {sensorFilters.severity?.[severity] ? '✓' : ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Sensor Display Options */}
                                        <div className="sensor-display-options">
                                            <h5>🎨 Display Options</h5>
                                            <div className="display-option-item">
                                                <label className="option-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={sensorFilters.options?.showLabels || false}
                                                        onChange={() => handleSensorFilterToggle('options', 'showLabels')}
                                                    />
                                                    Show station labels
                                                </label>
                                            </div>
                                            <div className="display-option-item">
                                                <label className="option-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={sensorFilters.options?.showValues || false}
                                                        onChange={() => handleSensorFilterToggle('options', 'showValues')}
                                                    />
                                                    Show AQI values on markers
                                                </label>
                                            </div>
                                            <div className="display-option-item">
                                                <label className="option-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={sensorFilters.options?.clusterNearby || true}
                                                        onChange={() => handleSensorFilterToggle('options', 'clusterNearby')}
                                                    />
                                                    Cluster nearby stations
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* COLOR SCALE SECTION - only show if pollutant is selected */}
                    {pollutantScheme && selectedPollutant !== 'select' && (
                        <div className="filter-group">
                            <div
                                className="group-header"
                                onClick={() => toggleGroup('colorScale')}
                            >
                                <span className="group-icon">🎨</span>
                                <span className="group-title">COLOR SCALE</span>
                                <span className={`expand-icon ${expandedGroups.colorScale ? 'expanded' : ''}`}>▼</span>
                            </div>

                            {expandedGroups.colorScale && (
                                <div className="group-items">
                                    <div className="color-scale-section">
                                        <div className="scale-title">{pollutantScheme.name}</div>
                                        <div className="color-ranges">
                                            {pollutantScheme.ranges.map((range, index) => (
                                                <div key={index} className="color-range-item">
                                                    <div
                                                        className="color-swatch"
                                                        style={{
                                                            backgroundColor: range.color,
                                                            opacity: range.opacity
                                                        }}
                                                    ></div>
                                                    <div className="range-info">
                                                        <span className="range-values">
                                                            {range.min}-{range.max} {pollutantScheme.unit}
                                                        </span>
                                                        <span className="range-label">{range.label}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SOURCES SECTION - only show if pollutant is selected */}
                    {selectedPollutant !== 'select' && (
                        <div className="filter-group">
                            <div
                                className="group-header"
                                onClick={() => toggleGroup('sources')}
                            >
                                <span className="group-icon">🏭</span>
                                <span className="group-title">POLLUTION SOURCES</span>
                                {activeSourceCount > 0 && (
                                    <span className="active-count">{activeSourceCount}</span>
                                )}
                                <span className={`expand-icon ${expandedGroups.sources ? 'expanded' : ''}`}>▼</span>
                            </div>

                            {expandedGroups.sources && (
                                <div className="group-items">
                                    <div className="sources-info">
                                        <p>Select sources to show their contribution intensity to {pollutantScheme?.name}:</p>
                                    </div>

                                    {Object.entries(POLLUTION_SOURCES).map(([sourceKey, source]) => {
                                        const isActive = filters.sources?.[sourceKey] || false;
                                        const stats = sourceStats[sourceKey];

                                        return (
                                            <div
                                                key={sourceKey}
                                                className={`filter-item source-item ${isActive ? 'active' : ''}`}
                                                onClick={() => handleFilterToggle('sources', sourceKey)}
                                            >
                                                <div className="source-header">
                                                    <div className="source-main">
                                                        <div className="filter-icon" style={{ color: source.color }}>
                                                            {source.icon}
                                                        </div>
                                                        <div className="source-info">
                                                            <span className="filter-label">{source.name}</span>
                                                            <span className="source-description">{source.description}</span>
                                                        </div>
                                                        <div className={`toggle-switch ${isActive ? 'on' : 'off'}`}>
                                                            <div className="toggle-slider"></div>
                                                        </div>
                                                    </div>

                                                    {isActive && stats && (
                                                        <div className="source-contribution-stats">
                                                            <div className="contribution-info">
                                                                <span className="contribution-range">
                                                                    {stats.min}%-{stats.max}% contribution
                                                                </span>
                                                                <span className="contribution-avg">
                                                                    avg: {stats.avg}%
                                                                </span>
                                                            </div>
                                                            <div className="contribution-bar">
                                                                <div
                                                                    className="contribution-fill"
                                                                    style={{
                                                                        width: `${Math.min(stats.avg, 100)}%`,
                                                                        backgroundColor: source.color,
                                                                        opacity: 0.7
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Intensity Explanation */}
                                    {activeSourceCount > 0 && (
                                        <div className="intensity-explanation">
                                            <h5>💡 How Intensity Works:</h5>
                                            <p><strong>Color:</strong> {pollutantScheme?.name} concentration level</p>
                                            <p><strong>Opacity:</strong> Combined contribution from selected sources</p>
                                            {activeSourceCount > 1 && (
                                                <p><strong>Multiple sources:</strong> Contributions are added together</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STATISTICS SECTION */}
                    {(Object.keys(pollutantStats).length > 0 || Object.keys(sourceStats).length > 0 || sensorStats.total > 0) && (
                        <div className="filter-group">
                            <div
                                className="group-header"
                                onClick={() => toggleGroup('statistics')}
                            >
                                <span className="group-icon">📊</span>
                                <span className="group-title">CURRENT STATISTICS</span>
                                <span className={`expand-icon ${expandedGroups.statistics ? 'expanded' : ''}`}>▼</span>
                            </div>

                            {expandedGroups.statistics && (
                                <div className="group-items">
                                    <div className="statistics-section">

                                        {/* Sensor Statistics */}
                                        {sensorStats.total > 0 && (
                                            <div className="stats-subsection">
                                                <h5>📡 Monitoring Stations</h5>
                                                <div className="sensor-stats-detailed">
                                                    <div className="stat-row">
                                                        <span className="stat-label">Total Stations:</span>
                                                        <span className="stat-value">{sensorStats.total}</span>
                                                    </div>
                                                    <div className="stat-row">
                                                        <span className="stat-label">AQI Range:</span>
                                                        <span className="stat-value">{sensorStats.aqiRange.min} - {sensorStats.aqiRange.max}</span>
                                                    </div>
                                                    <div className="stat-row">
                                                        <span className="stat-label">Average AQI:</span>
                                                        <span className="stat-value">{sensorStats.aqiRange.avg}</span>
                                                    </div>
                                                </div>
                                                <div className="source-breakdown">
                                                    <h6>By Source Type:</h6>
                                                    {Object.entries(sensorStats.bySource).map(([source, count]) => (
                                                        <div key={source} className="breakdown-item">
                                                            <span className="breakdown-source">{source}:</span>
                                                            <span className="breakdown-count">{count} stations</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Existing Pollutant Statistics - only show if pollutant selected */}
                                        {selectedPollutant !== 'select' && Object.keys(pollutantStats).length > 0 && (
                                            <div className="stats-subsection">
                                                <h5>🌫️ Pollutant Levels</h5>
                                                <div className="stats-grid">
                                                    {Object.entries(pollutantStats).map(([pollutant, stats]) => {
                                                        const scheme = POLLUTANT_COLOR_SCHEMES[pollutant];
                                                        return (
                                                            <div key={pollutant} className="stat-item">
                                                                <div className="stat-header">
                                                                    <span className={`stat-pollutant ${pollutant === selectedPollutant ? 'active' : ''}`}>
                                                                        {scheme?.name || pollutant.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <div className="stat-values">
                                                                    <span className="stat-range">
                                                                        {stats.min}-{stats.max} {scheme?.unit}
                                                                    </span>
                                                                    <span className="stat-avg">
                                                                        avg: {stats.avg}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Source Statistics - only show if pollutant selected */}
                                        {selectedPollutant !== 'select' && Object.keys(sourceStats).length > 0 && (
                                            <div className="stats-subsection">
                                                <h5>🏭 Source Contributions to {pollutantScheme?.name}</h5>
                                                <div className="source-stats-list">
                                                    {Object.entries(sourceStats).map(([source, stats]) => {
                                                        const sourceInfo = POLLUTION_SOURCES[source];
                                                        return (
                                                            <div key={source} className="source-stat-item">
                                                                <div className="source-stat-header">
                                                                    <span className="source-stat-icon">
                                                                        {sourceInfo?.icon}
                                                                    </span>
                                                                    <span className="source-stat-name">
                                                                        {sourceInfo?.name}
                                                                    </span>
                                                                </div>
                                                                <div className="source-stat-values">
                                                                    <span className="source-stat-range">
                                                                        {stats.min}%-{stats.max}%
                                                                    </span>
                                                                    <span className="source-stat-avg">
                                                                        avg: {stats.avg}%
                                                                    </span>
                                                                    <span className="source-stat-count">
                                                                        ({stats.count} grids)
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ACTIONS SECTION */}
                    <div className="filter-actions">
                        <button
                            className="clear-all-btn"
                            onClick={clearAllFilters}
                            disabled={activeSourceCount === 0 && selectedPollutant === 'select' && activeSensorFilters === 0}
                        >
                            Reset to Default
                        </button>

                        <div className="action-info">
                            <p>
                                {selectedPollutant === 'select' ? (
                                    'No pollutant layer selected'
                                ) : (
                                    <>
                                        Showing <strong>{pollutantScheme?.name}</strong> with <strong>{activeSourceCount}</strong> source{activeSourceCount !== 1 ? 's' : ''} selected
                                    </>
                                )}
                                {showSensors && <><br />+ <strong>{sensorStats.total}</strong> sensor station{sensorStats.total !== 1 ? 's' : ''}</>}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isVisible && (
                <div className="filter-overlay" onClick={onToggleVisibility}></div>
            )}
        </>
    );
};

export default EnhancedFilterPane;