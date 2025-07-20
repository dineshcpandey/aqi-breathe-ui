// src/hooks/useFilters.js - Updated with Sensor Support
import { useState, useCallback } from 'react';

export const useFilters = (initialFilters = {}) => {
    const [filters, setFilters] = useState({
        sources: {
            construction: false,
            vehicle: false,
            dust: false
        },
        ...initialFilters
    });

    // New state for sensor-related filters
    const [sensorFilters, setSensorFilters] = useState({
        source: {
            construction: false,
            vehicle: false,
            dust: false,
            industrial: false,
            residential: false
        },
        severity: {
            moderate: false,
            high: false,
            very_high: false,
            hazardous: false
        },
        options: {
            showLabels: false,
            showValues: false,
            clusterNearby: true
        }
    });

    const [showSensors, setShowSensors] = useState(true);
    const [isFilterPaneVisible, setIsFilterPaneVisible] = useState(false);

    const handleFilterChange = useCallback((category, filterId) => {
        console.log(`useFilters: Toggling ${category}.${filterId}`);
        console.log('Current state:', filters[category]?.[filterId]);

        setFilters(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [filterId]: !prev[category][filterId]
            }
        }));
    }, [filters]);

    // New sensor filter handler
    const handleSensorFilterChange = useCallback((filterType, value) => {
        console.log(`useFilters: Toggling sensor ${filterType}.${value}`);
        console.log('Current sensor state:', sensorFilters[filterType]?.[value]);

        if (filterType === 'options') {
            // For options, we toggle the boolean value directly
            setSensorFilters(prev => ({
                ...prev,
                [filterType]: {
                    ...prev[filterType],
                    [value]: !prev[filterType][value]
                }
            }));
        } else {
            // For source and severity filters, toggle the boolean value
            setSensorFilters(prev => ({
                ...prev,
                [filterType]: {
                    ...prev[filterType],
                    [value]: !prev[filterType][value]
                }
            }));
        }
    }, [sensorFilters]);

    const toggleSensors = useCallback(() => {
        console.log('useFilters: Toggling sensor visibility from', showSensors, 'to', !showSensors);
        setShowSensors(prev => !prev);
    }, [showSensors]);

    const toggleFilterPane = useCallback(() => {
        setIsFilterPaneVisible(prev => !prev);
    }, []);

    const getActiveFilters = useCallback(() => {
        const active = {};
        Object.keys(filters).forEach(category => {
            const activeItems = [];
            Object.keys(filters[category]).forEach(filterId => {
                if (filters[category][filterId]) {
                    activeItems.push(filterId);
                }
            });
            if (activeItems.length > 0) {
                active[category] = activeItems;
            }
        });
        return active;
    }, [filters]);

    const getActiveSensorFilters = useCallback(() => {
        const active = {};
        Object.keys(sensorFilters).forEach(filterType => {
            if (filterType === 'options') {
                // For options, only include true values
                const activeOptions = {};
                Object.keys(sensorFilters[filterType]).forEach(option => {
                    if (sensorFilters[filterType][option]) {
                        activeOptions[option] = true;
                    }
                });
                if (Object.keys(activeOptions).length > 0) {
                    active[filterType] = activeOptions;
                }
            } else {
                // For source and severity filters
                const activeItems = {};
                Object.keys(sensorFilters[filterType]).forEach(filterId => {
                    if (sensorFilters[filterType][filterId]) {
                        activeItems[filterId] = true;
                    }
                });
                if (Object.keys(activeItems).length > 0) {
                    active[filterType] = activeItems;
                }
            }
        });
        return active;
    }, [sensorFilters]);

    const clearAllFilters = useCallback(() => {
        console.log('useFilters: Clearing all filters');

        // Clear regular filters
        setFilters(prev => {
            const cleared = {};
            Object.keys(prev).forEach(category => {
                cleared[category] = {};
                Object.keys(prev[category]).forEach(filterId => {
                    cleared[category][filterId] = false;
                });
            });
            return cleared;
        });

        // Clear sensor filters
        setSensorFilters(prev => ({
            source: Object.keys(prev.source).reduce((acc, key) => {
                acc[key] = false;
                return acc;
            }, {}),
            severity: Object.keys(prev.severity).reduce((acc, key) => {
                acc[key] = false;
                return acc;
            }, {}),
            options: {
                showLabels: false,
                showValues: false,
                clusterNearby: true // Keep clustering on by default
            }
        }));

        // Keep sensors visible by default
        setShowSensors(true);
    }, []);

    const clearSensorFilters = useCallback(() => {
        console.log('useFilters: Clearing sensor filters only');

        setSensorFilters(prev => ({
            source: Object.keys(prev.source).reduce((acc, key) => {
                acc[key] = false;
                return acc;
            }, {}),
            severity: Object.keys(prev.severity).reduce((acc, key) => {
                acc[key] = false;
                return acc;
            }, {}),
            options: {
                showLabels: false,
                showValues: false,
                clusterNearby: true
            }
        }));
    }, []);

    // Get statistics about active filters
    const getFilterStats = useCallback(() => {
        const activeFilters = getActiveFilters();
        const activeSensorFilters = getActiveSensorFilters();

        const stats = {
            totalActiveFilters: Object.values(activeFilters).reduce((sum, category) =>
                sum + (Array.isArray(category) ? category.length : Object.keys(category).length), 0
            ),
            totalActiveSensorFilters: Object.values(activeSensorFilters).reduce((sum, category) =>
                sum + (typeof category === 'object' ? Object.keys(category).length : 0), 0
            ),
            activeSourceFilters: activeFilters.sources?.length || 0,
            activeSensorSourceFilters: Object.keys(activeSensorFilters.source || {}).length,
            activeSensorSeverityFilters: Object.keys(activeSensorFilters.severity || {}).length,
            showSensors,
            sensorOptions: activeSensorFilters.options || {}
        };

        return stats;
    }, [getActiveFilters, getActiveSensorFilters, showSensors]);

    return {
        // Regular filters
        filters,
        handleFilterChange,
        getActiveFilters,

        // Sensor filters
        sensorFilters,
        handleSensorFilterChange,
        getActiveSensorFilters,
        showSensors,
        toggleSensors,

        // UI state
        isFilterPaneVisible,
        toggleFilterPane,

        // Utility functions
        clearAllFilters,
        clearSensorFilters,
        getFilterStats
    };
};