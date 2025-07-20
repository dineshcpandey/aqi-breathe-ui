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