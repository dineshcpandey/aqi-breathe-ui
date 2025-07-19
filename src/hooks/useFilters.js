import { useState, useCallback } from 'react';

export const useFilters = (initialFilters = {}) => {
    const [filters, setFilters] = useState({
        airQuality: {
            aqi: false,
            pm25: false,
            rh: false,
            co: false
        },
        sources: {
            construction: false,
            vehicle: false,
            dust: false
        },
        ...initialFilters
    });

    const [isFilterPaneVisible, setIsFilterPaneVisible] = useState(false);

    const handleFilterChange = useCallback((category, filterId) => {
        setFilters(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [filterId]: !prev[category][filterId]
            }
        }));
    }, []);

    const toggleFilterPane = useCallback(() => {
        setIsFilterPaneVisible(prev => !prev);
    }, []);

    const getActiveFilters = useCallback(() => {
        const active = {};
        Object.keys(filters).forEach(category => {
            Object.keys(filters[category]).forEach(filterId => {
                if (filters[category][filterId]) {
                    if (!active[category]) active[category] = [];
                    active[category].push(filterId);
                }
            });
        });
        return active;
    }, [filters]);

    const clearAllFilters = useCallback(() => {
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
    }, []);

    return {
        filters,
        isFilterPaneVisible,
        handleFilterChange,
        toggleFilterPane,
        getActiveFilters,
        clearAllFilters
    };
};