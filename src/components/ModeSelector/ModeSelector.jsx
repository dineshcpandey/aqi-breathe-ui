// src/components/ModeSelector/ModeSelector.jsx
import React from 'react';
import './ModeSelector.css';

const ModeSelector = ({ currentMode, onModeChange, isLoading }) => {
    const modes = [
        {
            id: 'current',
            label: 'Current',
            icon: '⚡',
            subtitle: 'Live Data',
            description: 'Real-time pollution monitoring'
        },
        {
            id: 'historical',
            label: 'Historical',
            icon: '📊',
            subtitle: 'Jul 15-20',
            description: 'Verified historical data'
        },
        {
            id: 'predicted',
            label: 'Predicted',
            icon: '🔮',
            subtitle: 'Jul 20-25',
            description: 'AI-powered forecasts'
        }
    ];

    return (
        <div className="mode-selector">
            <div className="mode-selector-header">
                <h3>Visualization Mode</h3>
                <p>Choose data source for pollution analysis</p>
            </div>

            <div className="mode-buttons">
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        className={`mode-btn ${currentMode === mode.id ? 'active' : ''} ${isLoading && mode.id !== 'current' ? 'loading' : ''}`}
                        onClick={() => onModeChange(mode.id)}
                        disabled={isLoading && mode.id !== 'current'}
                        title={mode.description}
                    >
                        <div className="mode-icon">{mode.icon}</div>
                        <div className="mode-content">
                            <div className="mode-label">{mode.label}</div>
                            <div className="mode-subtitle">{mode.subtitle}</div>
                        </div>
                        {isLoading && mode.id !== 'current' && (
                            <div className="mode-loading-spinner"></div>
                        )}
                    </button>
                ))}
            </div>

            {currentMode !== 'current' && (
                <div className="mode-info">
                    <div className="info-item">
                        <span className="info-icon">🗓️</span>
                        <span className="info-text">
                            {currentMode === 'historical'
                                ? 'July 15-20, 2025 • Historical records'
                                : 'July 20-25, 2025 • AI predictions'
                            }
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">⏱️</span>
                        <span className="info-text">15-minute intervals available</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModeSelector;