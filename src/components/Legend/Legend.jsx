import React, { useState } from 'react';
import './Legend.css';

const Legend = ({
    colorSchemes,
    selectedPollutant,
    onPollutantChange,
    gridStats
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!colorSchemes || !selectedPollutant || !colorSchemes[selectedPollutant]) {
        return null;
    }

    const scheme = colorSchemes[selectedPollutant];

    return (
        <div className={`legend-container ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="legend-header" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h3>{scheme.name} ({scheme.unit})</h3>
                <div className="legend-toggle">
                    {isCollapsed ? '↑' : '↓'}
                </div>
            </div>

            {!isCollapsed && (
                <>
                    {/* Pollutant Selector */}
                    <div className="pollutant-selector">
                        <label>View Pollutant:</label>
                        <select
                            value={selectedPollutant}
                            onChange={(e) => onPollutantChange(e.target.value)}
                            className="pollutant-select"
                        >
                            {Object.keys(colorSchemes).map(pollutant => (
                                <option key={pollutant} value={pollutant}>
                                    {colorSchemes[pollutant].name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Color Scale */}
                    <div className="legend-scale">
                        <h4>Color Scale</h4>
                        <div className="color-ranges">
                            {scheme.ranges.map((range, index) => (
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
                                            {range.min} - {range.max} {scheme.unit}
                                        </span>
                                        <span className="range-label">{range.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Statistics */}
                    {gridStats && gridStats[selectedPollutant] && (
                        <div className="legend-stats">
                            <h4>Current Statistics</h4>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">Min:</span>
                                    <span className="stat-value">
                                        {gridStats[selectedPollutant].min} {scheme.unit}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Max:</span>
                                    <span className="stat-value">
                                        {gridStats[selectedPollutant].max} {scheme.unit}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Avg:</span>
                                    <span className="stat-value">
                                        {gridStats[selectedPollutant].avg} {scheme.unit}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Grids:</span>
                                    <span className="stat-value">{gridStats[selectedPollutant].count}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Legend;