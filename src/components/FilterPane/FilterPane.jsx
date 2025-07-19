import React, { useState } from 'react';
import './FilterPane.css';

const FilterPane = ({
    filters,
    onFilterChange,
    isVisible,
    onToggleVisibility
}) => {
    const [expandedGroups, setExpandedGroups] = useState({
        airQuality: true,
        sources: true
    });

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const handleFilterToggle = (category, filterId) => {
        console.log(`FilterPane: Toggling ${category}.${filterId}`); // Debug log
        console.log('Current filter state:', filters[category][filterId]); // Debug log
        onFilterChange(category, filterId);
    };

    const airQualityFilters = [
        { id: 'aqi', label: 'AQI', icon: '🌫️', color: '#e74c3c' },
        { id: 'pm25', label: 'PM2.5', icon: '🌪️', color: '#9b59b6' },
        { id: 'rh', label: 'RH', icon: '💧', color: '#3498db' },
        { id: 'co', label: 'CO', icon: '⚗️', color: '#e67e22' }
    ];

    const sourceFilters = [
        { id: 'construction', label: 'Construction', icon: '🏗️', color: '#95a5a6' },
        { id: 'vehicle', label: 'Vehicle', icon: '🚗', color: '#2c3e50' },
        { id: 'dust', label: 'Dust', icon: '🌪️', color: '#f39c12' }
    ];

    return (
        <>
            {/* Toggle Button */}
            <div className="filter-toggle" onClick={onToggleVisibility}>
                <div className={`toggle-icon ${isVisible ? 'expanded' : ''}`}>
                    {isVisible ? '←' : '→'}
                </div>
            </div>

            {/* Filter Pane */}
            <div className={`filter-pane ${isVisible ? 'visible' : 'hidden'}`}>
                <div className="filter-header">
                    <h2>DATA LAYERS</h2>
                    <button className="close-btn" onClick={onToggleVisibility}>
                        ×
                    </button>
                </div>

                <div className="filter-content">
                    {/* Debug Info */}
                    <div style={{ padding: '10px', fontSize: '10px', background: '#f0f0f0', margin: '10px' }}>
                        <strong>Debug:</strong><br />
                        AQI Filters: {JSON.stringify(filters.airQuality)}<br />
                        Source Filters: {JSON.stringify(filters.sources)}
                    </div>

                    {/* Air Quality Group */}
                    <div className="filter-group">
                        <div
                            className="group-header"
                            onClick={() => toggleGroup('airQuality')}
                        >
                            <span className="group-icon">🌍</span>
                            <span className="group-title">AIR QUALITY</span>
                            <span className={`expand-icon ${expandedGroups.airQuality ? 'expanded' : ''}`}>
                                ▼
                            </span>
                        </div>

                        {expandedGroups.airQuality && (
                            <div className="group-items">
                                {airQualityFilters.map(filter => (
                                    <div
                                        key={filter.id}
                                        className={`filter-item ${filters.airQuality[filter.id] ? 'active' : ''}`}
                                        onClick={() => handleFilterToggle('airQuality', filter.id)}
                                    >
                                        <div className="filter-icon" style={{ color: filter.color }}>
                                            {filter.icon}
                                        </div>
                                        <span className="filter-label">{filter.label}</span>
                                        <div className={`toggle-switch ${filters.airQuality[filter.id] ? 'on' : 'off'}`}>
                                            <div className="toggle-slider"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sources Group */}
                    <div className="filter-group">
                        <div
                            className="group-header"
                            onClick={() => toggleGroup('sources')}
                        >
                            <span className="group-icon">🏭</span>
                            <span className="group-title">SOURCES</span>
                            <span className={`expand-icon ${expandedGroups.sources ? 'expanded' : ''}`}>
                                ▼
                            </span>
                        </div>

                        {expandedGroups.sources && (
                            <div className="group-items">
                                {sourceFilters.map(filter => (
                                    <div
                                        key={filter.id}
                                        className={`filter-item ${filters.sources[filter.id] ? 'active' : ''}`}
                                        onClick={() => handleFilterToggle('sources', filter.id)}
                                    >
                                        <div className="filter-icon" style={{ color: filter.color }}>
                                            {filter.icon}
                                        </div>
                                        <span className="filter-label">{filter.label}</span>
                                        <div className={`toggle-switch ${filters.sources[filter.id] ? 'on' : 'off'}`}>
                                            <div className="toggle-slider"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Clear All Button */}
                    <div className="filter-actions">
                        <button
                            className="clear-all-btn"
                            onClick={() => {
                                console.log('Clear All clicked'); // Debug log

                                // Clear all filters
                                Object.keys(filters).forEach(category => {
                                    Object.keys(filters[category]).forEach(filterId => {
                                        if (filters[category][filterId]) {
                                            console.log(`Clearing ${category}.${filterId}`); // Debug log
                                            handleFilterToggle(category, filterId);
                                        }
                                    });
                                });
                            }}
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isVisible && (
                <div className="filter-overlay" onClick={onToggleVisibility}></div>
            )}
        </>
    );
};

export default FilterPane;
