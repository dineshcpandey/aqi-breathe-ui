import React, { useState } from 'react';
import './EnhancedFilterPane.css';
import { POLLUTANT_COLOR_SCHEMES, POLLUTION_SOURCES } from '../../utils/enhancedGridGenerator';

const EnhancedFilterPane = ({
    filters,
    onFilterChange,
    isVisible,
    onToggleVisibility,
    selectedPollutant = 'aqi',
    onPollutantChange,
    pollutantStats = {},
    sourceStats = {}
}) => {
    const [expandedGroups, setExpandedGroups] = useState({
        pollutants: true,
        sources: true,
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

    const clearAllFilters = () => {
        console.log('Clearing all filters');

        // Clear all source filters
        Object.keys(filters.sources || {}).forEach(sourceId => {
            if (filters.sources[sourceId]) {
                handleFilterToggle('sources', sourceId);
            }
        });

        // Reset pollutant to AQI if not already
        if (selectedPollutant !== 'aqi') {
            onPollutantChange('aqi');
        }
    };

    // Get active source count
    const activeSourceCount = Object.values(filters.sources || {}).filter(Boolean).length;
    const pollutantScheme = POLLUTANT_COLOR_SCHEMES[selectedPollutant];

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
                                        {Object.entries(POLLUTANT_COLOR_SCHEMES).map(([key, scheme]) => (
                                            <option key={key} value={key}>
                                                {scheme.name} ({scheme.unit})
                                            </option>
                                        ))}
                                    </select>

                                    {/* Current Pollutant Stats */}
                                    {pollutantStats[selectedPollutant] && (
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
                                </div>
                            </div>
                        )}
                    </div>

                    {/* COLOR SCALE SECTION */}
                    {pollutantScheme && (
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

                    {/* SOURCES SECTION */}
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

                    {/* STATISTICS SECTION */}
                    {(Object.keys(pollutantStats).length > 0 || Object.keys(sourceStats).length > 0) && (
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

                                        {/* Pollutant Statistics */}
                                        {Object.keys(pollutantStats).length > 0 && (
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

                                        {/* Source Statistics */}
                                        {Object.keys(sourceStats).length > 0 && (
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
                            disabled={activeSourceCount === 0 && selectedPollutant === 'aqi'}
                        >
                            Reset to Default
                        </button>

                        <div className="action-info">
                            <p>Showing <strong>{pollutantScheme?.name}</strong> with <strong>{activeSourceCount}</strong> source{activeSourceCount !== 1 ? 's' : ''} selected</p>
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