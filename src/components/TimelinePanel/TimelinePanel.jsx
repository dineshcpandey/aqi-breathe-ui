// src/components/TimelinePanel/TimelinePanel.jsx - TIMEZONE FIXED VERSION
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './TimelinePanel.css';

const TimelinePanel = ({
    onModeChange,
    onTimeChange,
    currentMode = 'historical',
    currentTimestamp = new Date('2025-07-20T14:30:00Z'),
    timelineData,
    onToggle,
    isActive = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [localTime, setLocalTime] = useState(currentTimestamp);
    const sliderRef = useRef(null);

    // Timeline configuration - get from props or use defaults
    const timelineConfig = useMemo(() => {
        if (timelineData?.timeline) {
            return timelineData.timeline;
        }
        return {
            start: new Date('2025-07-15T00:00:00Z'),
            current: new Date('2025-07-20T14:30:00Z'),
            end: new Date('2025-07-25T23:59:59Z'),
            totalDuration: 10 * 24 * 60 * 60 * 1000
        };
    }, [timelineData]);

    // Calculate position percentage for timeline - useCallback to prevent recreation
    const getTimePosition = useCallback((time) => {
        const totalMs = timelineConfig.end.getTime() - timelineConfig.start.getTime();
        const currentMs = time.getTime() - timelineConfig.start.getTime();
        return Math.max(0, Math.min(100, (currentMs / totalMs) * 100));
    }, [timelineConfig.start, timelineConfig.end]);

    // 🔧 FIXED: Get time from position percentage with UTC timezone handling
    const getTimeFromPosition = useCallback((percentage) => {
        const totalMs = timelineConfig.end.getTime() - timelineConfig.start.getTime();
        const targetMs = timelineConfig.start.getTime() + (totalMs * percentage / 100);
        const rawTime = new Date(targetMs);

        // 🎯 CRITICAL FIX: Round to nearest hour in UTC instead of local timezone
        const roundedTime = new Date(rawTime);

        // Use UTC methods to ensure timezone consistency with CSV data
        roundedTime.setUTCMinutes(0, 0, 0); // Set minutes, seconds, milliseconds to 0 in UTC

        console.log('🕒 TIMEZONE-FIXED Timeline position conversion:', {
            percentage: percentage.toFixed(1) + '%',
            rawTime: rawTime.toISOString(),
            rawTimeUTC: `${rawTime.getUTCFullYear()}-${String(rawTime.getUTCMonth() + 1).padStart(2, '0')}-${String(rawTime.getUTCDate()).padStart(2, '0')}T${String(rawTime.getUTCHours()).padStart(2, '0')}:${String(rawTime.getUTCMinutes()).padStart(2, '0')}:${String(rawTime.getUTCSeconds()).padStart(2, '0')}.${String(rawTime.getUTCMilliseconds()).padStart(3, '0')}Z`,
            roundedToHourUTC: roundedTime.toISOString(),
            timezoneFix: 'Using setUTCMinutes instead of setMinutes'
        });

        return roundedTime;
    }, [timelineConfig.start, timelineConfig.end]);

    // Determine if time is in historical, current, or predicted zone - useCallback to prevent recreation
    const getTimeZone = useCallback((time) => {
        const currentTime = timelineConfig.current || timelineConfig.now;
        if (time <= currentTime) return 'historical';
        return 'predicted';
    }, [timelineConfig.current, timelineConfig.now]);

    // Handle slider interaction - useCallback to prevent recreation
    const handleSliderClick = useCallback((event) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = ((event.clientX - rect.left) / rect.width) * 100;
        const newTime = getTimeFromPosition(percentage);

        console.log('🎯 TIMEZONE-FIXED slider click:', {
            percentage: percentage.toFixed(1) + '%',
            newTimeUTC: newTime.toISOString(),
            shouldMatchCSV: 'This timestamp should now match CSV data exactly'
        });

        setLocalTime(newTime);
        onTimeChange?.(newTime);

        // Auto-switch mode based on time zone
        const zone = getTimeZone(newTime);
        if (zone !== currentMode) {
            onModeChange?.(zone);
        }
    }, [getTimeFromPosition, getTimeZone, currentMode, onTimeChange, onModeChange]);

    // Handle drag functionality - useCallback to prevent recreation
    const handleMouseDown = useCallback((event) => {
        setIsDragging(true);
        handleSliderClick(event);
    }, [handleSliderClick]);

    const handleMouseMove = useCallback((event) => {
        if (!isDragging || !sliderRef.current) return;
        handleSliderClick(event);
    }, [isDragging, handleSliderClick]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Mouse event listeners - fixed dependencies
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Sync local time with prop changes - stable dependency
    useEffect(() => {
        setLocalTime(currentTimestamp);
    }, [currentTimestamp]);

    // 🔧 FIXED: Format time for display with timezone awareness
    const formatTime = useCallback((time) => {
        return time.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC', // 🎯 Show time in UTC to match CSV data
            timeZoneName: 'short'
        });
    }, []);

    // Quick jump buttons with timezone-aware timestamps - useMemo to prevent recreation
    const quickJumps = useMemo(() => [
        { label: 'Start', time: timelineConfig.start },
        {
            label: 'Rush Hour',
            time: new Date('2025-07-18T08:00:00Z') // 🔧 FIXED: Ensure UTC timestamp
        },
        { label: 'Now', time: timelineConfig.current || timelineConfig.now },
        {
            label: 'Tomorrow',
            time: new Date('2025-07-21T09:00:00Z') // 🔧 FIXED: Ensure UTC timestamp
        },
        { label: 'End', time: timelineConfig.end }
    ], [timelineConfig.start, timelineConfig.current, timelineConfig.now, timelineConfig.end]);

    // Calculate positions - use the memoized functions
    const currentPosition = getTimePosition(localTime);
    const nowPosition = getTimePosition(timelineConfig.current || timelineConfig.now);
    const currentZone = getTimeZone(localTime);

    // Debug logging with timezone info
    console.log('🕒 TIMEZONE-FIXED Timeline render debug:', {
        currentPosition,
        nowPosition,
        currentZone,
        localTimeUTC: localTime.toISOString(),
        timelineConfigStartUTC: timelineConfig.start.toISOString(),
        timelineConfigCurrentUTC: (timelineConfig.current || timelineConfig.now).toISOString(),
        timelineConfigEndUTC: timelineConfig.end.toISOString(),
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

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
                    <span className="timeline-label start">Jul 15 (UTC)</span>
                    <span className="timeline-label middle">Jul 20 (UTC)</span>
                    <span className="timeline-label end">Jul 25 (UTC)</span>
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
                            <span className="zone-text">Historical (UTC)</span>
                        </div>
                        <div className="zone-indicator predicted">
                            <span className="zone-icon">🟠</span>
                            <span className="zone-text">Predicted (UTC)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="timeline-controls">
                <div className="quick-jumps">
                    {quickJumps.map((jump, index) => (
                        <button
                            key={index}
                            className="quick-jump-btn"
                            onClick={() => {
                                console.log('🎯 TIMEZONE-FIXED quick jump to:', jump.time.toISOString());

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