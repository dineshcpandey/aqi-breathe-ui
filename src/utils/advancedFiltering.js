// src/utils/advancedFiltering.js
export class AdvancedFilteringService {
    constructor() {
        this.filterHistory = [];
        this.savedFilters = new Map();
        this.filterPresets = this.getDefaultPresets();
    }

    // Spatial filtering
    spatialFilter(sensorData, options) {
        const { type, parameters } = options;

        switch (type) {
            case 'distance':
                return this.filterByDistance(sensorData, parameters);

            case 'bounds':
                return this.filterByBounds(sensorData, parameters);

            case 'cluster':
                return this.filterByClusters(sensorData, parameters);

            default:
                return sensorData;
        }
    }

    filterByDistance(sensorData, { center, radius, unit = 'km' }) {
        const radiusInMeters = unit === 'km' ? radius * 1000 : radius;

        return sensorData.filter(sensor => {
            const distance = this.calculateDistance(
                [center.lat, center.lng],
                [sensor.lat, sensor.lng]
            );
            return distance <= radiusInMeters;
        });
    }

    filterByBounds(sensorData, bounds) {
        const [[southWest], [northEast]] = bounds;

        return sensorData.filter(sensor =>
            sensor.lat >= southWest.lat &&
            sensor.lat <= northEast.lat &&
            sensor.lng >= southWest.lng &&
            sensor.lng <= northEast.lng
        );
    }

    // Temporal filtering
    temporalFilter(sensorData, options) {
        const { type, parameters } = options;

        switch (type) {
            case 'timeRange':
                return this.filterByTimeRange(sensorData, parameters);

            case 'dataAge':
                return this.filterByDataAge(sensorData, parameters);

            case 'trend':
                return this.filterByTrend(sensorData, parameters);

            default:
                return sensorData;
        }
    }

    filterByTimeRange(sensorData, { start, end }) {
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();

        return sensorData.filter(sensor => {
            const sensorTime = new Date(sensor.timestamp).getTime();
            return sensorTime >= startTime && sensorTime <= endTime;
        });
    }

    filterByDataAge(sensorData, { maxAge, unit = 'hours' }) {
        const maxAgeMs = this.convertToMilliseconds(maxAge, unit);
        const cutoff = Date.now() - maxAgeMs;

        return sensorData.filter(sensor =>
            new Date(sensor.timestamp).getTime() >= cutoff
        );
    }

    // Quality-based filtering
    qualityFilter(sensorData, options) {
        const { dataQuality, completeness, accuracy } = options;

        let filtered = sensorData;

        if (dataQuality) {
            filtered = filtered.filter(sensor =>
                dataQuality.includes(sensor.dataQuality || 'measured')
            );
        }

        if (completeness) {
            filtered = filtered.filter(sensor => {
                const requiredFields = ['aqi', 'pm25', 'pm10', 'co', 'no2', 'so2'];
                const availableFields = requiredFields.filter(field =>
                    sensor[field] !== undefined && sensor[field] !== null
                );
                const completenessRatio = availableFields.length / requiredFields.length;
                return completenessRatio >= completeness.minimum;
            });
        }

        return filtered;
    }

    // Multi-criteria filtering
    multiCriteriaFilter(sensorData, criteria) {
        let result = sensorData;

        // Apply each criterion
        criteria.forEach(criterion => {
            switch (criterion.category) {
                case 'spatial':
                    result = this.spatialFilter(result, criterion);
                    break;

                case 'temporal':
                    result = this.temporalFilter(result, criterion);
                    break;

                case 'quality':
                    result = this.qualityFilter(result, criterion);
                    break;

                case 'pollutant':
                    result = this.pollutantFilter(result, criterion);
                    break;
            }
        });

        // Track filter usage
        this.trackFilterUsage(criteria, result.length);

        return result;
    }

    pollutantFilter(sensorData, options) {
        const { pollutant, operator, threshold, conditions } = options;

        return sensorData.filter(sensor => {
            if (conditions === 'AND') {
                return pollutant.every(p =>
                    this.evaluateCondition(sensor[p.field], p.operator, p.threshold)
                );
            } else {
                return pollutant.some(p =>
                    this.evaluateCondition(sensor[p.field], p.operator, p.threshold)
                );
            }
        });
    }

    evaluateCondition(value, operator, threshold) {
        switch (operator) {
            case '>': return value > threshold;
            case '>=': return value >= threshold;
            case '<': return value < threshold;
            case '<=': return value <= threshold;
            case '=': return value === threshold;
            case '!=': return value !== threshold;
            case 'between': return value >= threshold.min && value <= threshold.max;
            default: return true;
        }
    }

    // Filter presets
    getDefaultPresets() {
        return new Map([
            ['high_pollution', {
                name: 'High Pollution Areas',
                criteria: [
                    {
                        category: 'pollutant',
                        pollutant: [{ field: 'aqi', operator: '>', threshold: 150 }]
                    }
                ]
            }],
            ['recent_data', {
                name: 'Recent Data Only',
                criteria: [
                    {
                        category: 'temporal',
                        type: 'dataAge',
                        parameters: { maxAge: 6, unit: 'hours' }
                    }
                ]
            }],
            ['construction_zones', {
                name: 'Construction Impact',
                criteria: [
                    {
                        category: 'pollutant',
                        pollutant: [
                            { field: 'pm10', operator: '>', threshold: 100 },
                            { field: 'source', operator: '=', threshold: 'construction' }
                        ],
                        conditions: 'AND'
                    }
                ]
            }],
            ['critical_areas', {
                name: 'Critical Air Quality',
                criteria: [
                    {
                        category: 'pollutant',
                        pollutant: [{ field: 'aqi', operator: '>', threshold: 300 }]
                    },
                    {
                        category: 'quality',
                        dataQuality: ['measured', 'calibrated']
                    }
                ]
            }]
        ]);
    }

    applyPreset(sensorData, presetName) {
        const preset = this.filterPresets.get(presetName);
        if (!preset) {
            throw new Error(`Preset '${presetName}' not found`);
        }

        return this.multiCriteriaFilter(sensorData, preset.criteria);
    }

    saveFilter(name, criteria) {
        this.savedFilters.set(name, {
            name,
            criteria,
            createdAt: new Date(),
            usageCount: 0
        });
    }

    trackFilterUsage(criteria, resultCount) {
        this.filterHistory.push({
            criteria,
            resultCount,
            timestamp: new Date()
        });

        // Keep only last 100 filter operations
        if (this.filterHistory.length > 100) {
            this.filterHistory.shift();
        }
    }

    getFilterAnalytics() {
        return {
            totalFilters: this.filterHistory.length,
            averageResults: this.filterHistory.reduce((sum, h) => sum + h.resultCount, 0) / this.filterHistory.length,
            mostUsedCriteria: this.getMostUsedCriteria(),
            presetUsage: this.getPresetUsage()
        };
    }

    // Utility methods
    calculateDistance(point1, point2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = point1[0] * Math.PI / 180;
        const φ2 = point2[0] * Math.PI / 180;
        const Δφ = (point2[0] - point1[0]) * Math.PI / 180;
        const Δλ = (point2[1] - point1[1]) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    convertToMilliseconds(value, unit) {
        const conversions = {
            milliseconds: 1,
            seconds: 1000,
            minutes: 60 * 1000,
            hours: 60 * 60 * 1000,
            days: 24 * 60 * 60 * 1000
        };

        return value * (conversions[unit] || conversions.milliseconds);
    }
}

export default AdvancedFilteringService;