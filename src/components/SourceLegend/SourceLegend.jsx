import React, { useState } from 'react';
import './SourceLegend.css';
import { SOURCE_COLOR_SCHEMES } from '../../utils/sourceBasedGridGenerator';

const SourceLegend = ({
    activeSourceFilters = [],
    sourceStats = {},
    activeAirQualityFilters = []
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (activeSourceFilters.length === 0) {
        return null; // Don't show legend if no sources are selected
    }

    return (
        <div className={`source-legend-container ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="legend-header" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h3>
                    Source Contributions to AQI
                    {activeSourceFilters.length > 1 && (
                        <span className="overlay-indicator"> (Overlayed)</span>
                    )}
                </h3>
                <div className="legend-toggle">
                    {isCollapsed ? '↑' : '↓'}
                </div>
            </div>

            {!isCollapsed && (
                <div className="legend-content">

                    {/* Active Air Quality Thresholds */}
                    {activeAirQualityFilters.length > 0 && (
                        <div className="threshold-info">
                            <h4>🎯 Active Thresholds</h4>
                            <div className="threshold-tags">
                                {activeAirQualityFilters.map(filter => (
                                    <span key={filter} className="threshold-tag">
                                        {filter.toUpperCase()}
                                        {filter === 'aqi' && ' ≥ 150'}
                                        {filter === 'pm25' && ' ≥ 75 µg/m³'}
                                        {filter === 'rh' && ' ≤ 45%'}
                                        {filter === 'co' && ' ≥ 1.5 ppm'}
                                    </span>
                                ))}
                            </div>
                            <hr className="separator" />
                        </div>
                    )}

                    {/* Source Color Scales */}
                    <div className="source-scales">
                        {activeSourceFilters.map(sourceName => {
                            const scheme = SOURCE_COLOR_SCHEMES[sourceName];
                            const stats = sourceStats[sourceName];

                            if (!scheme) return null;

                            return (
                                <div key={sourceName} className="source-scale-section">
                                    <div className="source-header">
                                        <div className="source-title">
                                            <div
                                                className="source-color-indicator"
                                                style={{ backgroundColor: scheme.color }}
                                            ></div>
                                            <span className="source-name">{scheme.name}</span>
                                        </div>
                                        {stats && (
                                            <div className="source-stats-mini">
                                                <span className="stat-range">{stats.min}-{stats.max}%</span>
                                                <span className="stat-avg">avg: {stats.avg}%</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="intensity-scale">
                                        <div className="scale-bar">
                                            <div className="scale-gradient">
                                                {scheme.ranges.map((range, index) => (
                                                    <div
                                                        key={index}
                                                        className="gradient-segment"
                                                        style={{
                                                            backgroundColor: scheme.color,
                                                            opacity: range.opacity,
                                                            flex: range.max - range.min
                                                        }}
                                                    ></div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="scale-labels">
                                            <span className="scale-label-start">0%</span>
                                            <span className="scale-label-middle">Low</span>
                                            <span className="scale-label-middle">High</span>
                                            <span className="scale-label-end">100%</span>
                                        </div>
                                    </div>

                                    <div className="source-description">
                                        {scheme.description}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Overall Statistics */}
                    {Object.keys(sourceStats).length > 0 && (
                        <div className="overall-stats">
                            <h4>📊 Current Statistics</h4>
                            <div className="stats-summary">
                                {Object.entries(sourceStats).map(([source, stats]) => (
                                    <div key={source} className="stat-row">
                                        <div
                                            className="stat-color-dot"
                                            style={{ backgroundColor: SOURCE_COLOR_SCHEMES[source]?.color }}
                                        ></div>
                                        <span className="stat-source">{source}:</span>
                                        <span className="stat-values">
                                            {stats.avg}% avg ({stats.count} grids)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Usage Instructions */}
                    <div className="usage-tips">
                        <h5>💡 How to Read:</h5>
                        <ul>
                            <li><strong>Color intensity</strong> = % contribution to AQI</li>
                            <li><strong>Overlapping areas</strong> = Multiple pollution sources</li>
                            <li><strong>Thresholds</strong> = Only grids meeting air quality criteria</li>
                        </ul>
                    </div>

                </div>
            )}
        </div>
    );
};

export default SourceLegend;