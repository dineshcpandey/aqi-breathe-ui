import React from 'react';
import './LayerControls.css';

const LayerControls = ({
    selectedMapStyle,
    onMapStyleChange,
    showAQILayer,
    onAQIToggle,
    distanceMode,
    onDistanceModeToggle,
    coordinates
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
                <label>Tools</label>
                <button
                    onClick={onDistanceModeToggle}
                    className={distanceMode ? 'active' : ''}
                >
                    {distanceMode ? '❌ Stop Measuring' : '📏 Measure Distance'}
                </button>
            </div>

            <div className="control-group">
                <label>Sample AQI Layer</label>
                <button onClick={() => onAQIToggle(!showAQILayer)}>
                    {showAQILayer ? '🌫️ Hide AQI Demo' : '🌫️ Show AQI Demo'}
                </button>
            </div>

            <div className="coords-display">
                {coordinates}
            </div>
        </div>
    );
};

export default LayerControls;