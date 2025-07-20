// src/components/TimelinePanel/TimelinePanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import './TimelinePanel.css';

const TimelinePanel = ({
    onModeChange,
    onTimeChange,
    currentMode = 'historical',
    currentTime = new Date('2025-07-20T14:30:00Z'),
    isPlaying = false,
    onPlayToggle,
    playSpeed = 1,
    onSpeedChange,
    dataStatus = null
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [localTime, setLocalTime] = useState(currentTime);
    const sliderRef = useRef(null);
    const intervalRef = useRef(null);

    // Timeline configuration
    const timelineConfig = {
        start: new Date('2025-07-15T00:00:00Z'),
        now: new Date('2025-07-20T14:30:00Z'),
        end: new Date('2025-07-25T23:59:59Z'),
        totalDuration: 10 * 24 * 60 * 60 * 1000 // 10 days in milliseconds
    };

    // Calculate position percentage for timeline
    const getTimePosition = (time) => {
        const totalMs = timelineConfig.end.getTime() - timelineConfig.start.getTime();
        const currentMs = time.getTime() - timelineConfig.start.getTime();
        return Math.max(0, Math.min(100, (currentMs / totalMs) * 100));
    };

    // Get time from position percentage
    const getTimeFromPosition = (percentage) => {
        const totalMs = timelineConfig.end.getTime() - timelineConfig.start.getTime();
        const targetMs = timelineConfig.start.getTime() + (totalMs * percentage / 100);
        return new Date(targetMs);
    };

    // Determine if time is in historical, current, or predicted zone
    const getTimeZone = (time) => {
        if (time <= timelineConfig.now) return 'historical';
        return 'predicted';
    };

    // Handle slider interaction
    const handleSliderClick = (event) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = ((event.clientX - rect.left) / rect.width) * 100;
        const newTime = getTimeFromPosition(percentage);

        setLocalTime(newTime);
        onTimeChange?.(newTime);

        // Auto-switch mode based on time zone
        const zone = getTimeZone(newTime);
        if (zone !== currentMode) {
            onModeChange?.(zone);
        }
    };

    // Handle drag functionality
    const handleMouseDown = (event) => {
        setIsDragging(true);
        handleSliderClick(event);
    };

    const handleMouseMove = (event) => {
        if (!isDragging || !sliderRef.current) return;
        handleSliderClick(event);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Auto-play functionality
    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setLocalTime(prevTime => {
                    const nextTime = new Date(prevTime.getTime() + (15 * 60 * 1000 * playSpeed)); // 15 min intervals

                    // Stop at the end
                    if (nextTime > timelineConfig.end) {
                        onPlayToggle?.(false);
                        return timelineConfig.end;
                    }

                    onTimeChange?.(nextTime);

                    // Auto-switch mode based on time zone
                    const zone = getTimeZone(nextTime);
                    if (zone !== currentMode) {
                        onModeChange?.(zone);
                    }

                    return nextTime;
                });
            }, 1000 / playSpeed); // Faster updates for higher speeds
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [isPlaying, playSpeed, currentMode, onTimeChange, onModeChange, onPlayToggle]);

    // Mouse event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    // Sync local time with prop changes
    useEffect(() => {
        setLocalTime(currentTime);
    }, [currentTime]);

    // Format time for display
    const formatTime = (time) => {
        return time.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Quick jump buttons
    const quickJumps = [
        { label: 'Start', time: timelineConfig.start },
        { label: 'Rush Hour', time: new Date('2025-07-18T08:30:00Z') },
        { label: 'Now', time: timelineConfig.now },
        { label: 'Tomorrow', time: new Date('2025-07-21T09:00:00Z') },
        { label: 'End', time: timelineConfig.end }
    ];

    const currentPosition = getTimePosition(localTime);
    const nowPosition = getTimePosition(timelineConfig.now);
    const currentZone = getTimeZone(localTime);

    return (
        <div className="timeline-panel" data-mode={currentMode}>
            {/* Mode Selector */}
            <div className="timeline-header">
                <div className="mode-selector">
                    <button
                        className={`mode-btn ${currentMode === 'historical' ? 'active' : ''}`}
                        onClick={() => onModeChange?.('historical')}
                    >
                        <span className="mode-icon">📊</span>
                        <span className="mode-label">Historical</span>
                        <span className="mode-subtitle">Real Data</span>
                    </button>
                    <button
                        className={`mode-btn ${currentMode === 'predicted' ? 'active' : ''}`}
                        onClick={() => onModeChange?.('predicted')}
                    >
                        <span className="mode-icon">🔮</span>
                        <span className="mode-label">Predicted</span>
                        <span className="mode-subtitle">AI Forecast</span>
                    </button>
                </div>

                <div className="timeline-info">
                    <div className="current-time">
                        📅 {formatTime(localTime)}
                    </div>
                    <div className="data-status">
                        {currentZone === 'historical' ? (
                            <span className="status-badge historical">✅ Verified Data</span>
                        ) : (
                            <span className="status-badge predicted">🎯 AI Forecast</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline Slider */}
            <div className="timeline-slider-container">
                <div className="timeline-labels">
                    <span className="timeline-label start">Jul 15</span>
                    <span className="timeline-label middle">Jul 20</span>
                    <span className="timeline-label end">Jul 25</span>
                </div>

                <div
                    className="timeline-slider"
                    ref={sliderRef}
                    onClick={handleSliderClick}
                    onMouseDown={handleMouseDown}
                >
                    {/* Historical Zone */}
                    <div
                        className="timeline-zone historical"
                        style={{ width: `${nowPosition}%` }}
                    />

                    {/* Predicted Zone */}
                    <div
                        className="timeline-zone predicted"
                        style={{
                            left: `${nowPosition}%`,
                            width: `${100 - nowPosition}%`
                        }}
                    />

                    {/* Now Marker */}
                    <div
                        className="timeline-marker now-marker"
                        style={{ left: `${nowPosition}%` }}
                    >
                        <div className="marker-line"></div>
                        <div className="marker-label">NOW</div>
                    </div>

                    {/* Current Time Marker */}
                    <div
                        className={`timeline-marker current-marker ${currentZone}`}
                        style={{ left: `${currentPosition}%` }}
                    >
                        <div className="marker-handle"></div>
                    </div>

                    {/* Zone indicators */}
                    <div className="zone-indicators">
                        <div className="zone-indicator historical">
                            <span className="zone-icon">🔵</span>
                            <span className="zone-text">Historical</span>
                        </div>
                        <div className="zone-indicator predicted">
                            <span className="zone-icon">🟠</span>
                            <span className="zone-text">Predicted</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="timeline-controls">
                <div className="playback-controls">
                    <button
                        className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
                        onClick={() => onPlayToggle?.(!isPlaying)}
                    >
                        {isPlaying ? '⏸️' : '▶️'}
                        <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>

                    <div className="speed-control">
                        <label>Speed:</label>
                        <select
                            value={playSpeed}
                            onChange={(e) => onSpeedChange?.(Number(e.target.value))}
                        >
                            <option value={0.5}>0.5x</option>
                            <option value={1}>1x</option>
                            <option value={2}>2x</option>
                            <option value={5}>5x</option>
                            <option value={10}>10x</option>
                        </select>
                    </div>
                </div>

                <div className="quick-jumps">
                    {quickJumps.map((jump, index) => (
                        <button
                            key={index}
                            className="quick-jump-btn"
                            onClick={() => {
                                setLocalTime(jump.time);
                                onTimeChange?.(jump.time);
                                const zone = getTimeZone(jump.time);
                                if (zone !== currentMode) {
                                    onModeChange?.(zone);
                                }
                            }}
                        >
                            {jump.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TimelinePanel;