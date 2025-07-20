import React from 'react';
import './LayerControls.css';

const LayerControls = ({
    selectedMapStyle,
    onMapStyleChange,
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

            <div className="coords-display">
                {coordinates}
            </div>
        </div>
    );
};

export default LayerControls;