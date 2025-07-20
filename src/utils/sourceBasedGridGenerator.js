/**
 * Source-Based Grid System for AQI Contribution Visualization
 * Shows % contribution of Construction, Vehicle, and Dust to total AQI
 */

// Anand Vihar center coordinates
const ANAND_VIHAR_CENTER = { lat: 28.6469, lng: 77.3154 };

// Grid configuration
const GRID_SIZE_METERS = 200;
const COVERAGE_RADIUS_KM = 2.5;
const TIME_SERIES_HOURS = 72;

// Source contribution color schemes
export const SOURCE_COLOR_SCHEMES = {
    construction: {
        name: 'Construction',
        baseColor: '#8B4513', // Brown/Orange for construction dust and machinery
        color: '#D2691E',
        description: 'Construction activities, machinery, dust from building sites',
        unit: '% of AQI',
        ranges: [
            { min: 0, max: 10, opacity: 0.2, label: 'Minimal Impact' },
            { min: 11, max: 25, opacity: 0.4, label: 'Low Impact' },
            { min: 26, max: 40, opacity: 0.6, label: 'Moderate Impact' },
            { min: 41, max: 60, opacity: 0.7, label: 'High Impact' },
            { min: 61, max: 80, opacity: 0.8, label: 'Very High Impact' },
            { min: 81, max: 100, opacity: 0.9, label: 'Extreme Impact' }
        ]
    },
    vehicle: {
        name: 'Vehicle Emissions',
        baseColor: '#DC143C', // Red/Purple for exhaust and smog
        color: '#B22222',
        description: 'Vehicle exhaust, traffic congestion, road dust',
        unit: '% of AQI',
        ranges: [
            { min: 0, max: 10, opacity: 0.2, label: 'Minimal Impact' },
            { min: 11, max: 25, opacity: 0.4, label: 'Low Impact' },
            { min: 26, max: 40, opacity: 0.6, label: 'Moderate Impact' },
            { min: 41, max: 60, opacity: 0.7, label: 'High Impact' },
            { min: 61, max: 80, opacity: 0.8, label: 'Very High Impact' },
            { min: 81, max: 100, opacity: 0.9, label: 'Extreme Impact' }
        ]
    },
    dust: {
        name: 'Dust Sources',
        baseColor: '#DAA520', // Yellow/Tan for natural and industrial dust
        color: '#B8860B',
        description: 'Natural dust, unpaved areas, wind-blown particles',
        unit: '% of AQI',
        ranges: [
            { min: 0, max: 10, opacity: 0.2, label: 'Minimal Impact' },
            { min: 11, max: 25, opacity: 0.4, label: 'Low Impact' },
            { min: 26, max: 40, opacity: 0.6, label: 'Moderate Impact' },
            { min: 41, max: 60, opacity: 0.7, label: 'High Impact' },
            { min: 61, max: 80, opacity: 0.8, label: 'Very High Impact' },
            { min: 81, max: 100, opacity: 0.9, label: 'Extreme Impact' }
        ]
    }
};

// Utility functions for coordinate conversion
const metersToDegrees = (meters, latitude) => {
    const earthRadius = 6371000;
    const metersPerDegreeLat = (Math.PI * earthRadius) / 180;
    const metersPerDegreeLng = metersPerDegreeLat * Math.cos(latitude * (Math.PI / 180));

    return {
        latDegrees: meters / metersPerDegreeLat,
        lngDegrees: meters / metersPerDegreeLng
    };
};

// Generate grid coordinates
const generateGridCoordinates = (center, radiusKm, gridSizeM) => {
    const grids = [];
    const radiusM = radiusKm * 1000;

    const { latDegrees: gridLatDegrees, lngDegrees: gridLngDegrees } =
        metersToDegrees(gridSizeM, center.lat);

    const gridCount = Math.ceil(radiusM / gridSizeM);
    let gridId = 0;

    for (let i = -gridCount; i <= gridCount; i++) {
        for (let j = -gridCount; j <= gridCount; j++) {
            const gridCenterLat = center.lat + (i * gridLatDegrees);
            const gridCenterLng = center.lng + (j * gridLngDegrees);

            // Check if grid center is within radius
            const distance = Math.sqrt(
                Math.pow((gridCenterLat - center.lat) * 111000, 2) +
                Math.pow((gridCenterLng - center.lng) * 111000 * Math.cos(center.lat * Math.PI / 180), 2)
            );

            if (distance <= radiusM) {
                const bounds = {
                    north: gridCenterLat + (gridLatDegrees / 2),
                    south: gridCenterLat - (gridLatDegrees / 2),
                    east: gridCenterLng + (gridLngDegrees / 2),
                    west: gridCenterLng - (gridLngDegrees / 2)
                };

                grids.push({
                    id: `grid_${gridId++}`,
                    centerLat: gridCenterLat,
                    centerLng: gridCenterLng,
                    bounds,
                    distanceFromCenter: distance,
                    corners: [
                        [bounds.north, bounds.west], // NW
                        [bounds.north, bounds.east], // NE
                        [bounds.south, bounds.east], // SE
                        [bounds.south, bounds.west]  // SW
                    ]
                });
            }
        }
    }

    return grids;
};

// Calculate source contributions to AQI
const calculateSourceContributions = (grid, timestamp) => {
    const hour = new Date(timestamp).getHours();
    const dayOfWeek = new Date(timestamp).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const distanceKm = grid.distanceFromCenter / 1000;

    // Base AQI calculation
    const baseAQI = 120 + (distanceKm * 15) + (Math.random() * 40 - 20);

    // Source contribution calculations
    let contributions = {
        construction: 0,
        vehicle: 0,
        dust: 0,
        other: 0 // Background/other sources
    };

    // Construction contribution (higher during working hours, weekdays)
    if (!isWeekend && hour >= 8 && hour <= 18) {
        contributions.construction = 15 + (Math.random() * 35); // 15-50%
        // Peak during mid-day construction hours
        if (hour >= 10 && hour <= 16) {
            contributions.construction += 10;
        }
    } else {
        contributions.construction = 2 + (Math.random() * 8); // 2-10% minimal
    }

    // Vehicle contribution (higher during rush hours, all days but reduced weekends)
    const rushHourFactor = [8, 9, 17, 18, 19, 20].includes(hour) ? 1.8 : 1.0;
    const weekendFactor = isWeekend ? 0.6 : 1.0;
    contributions.vehicle = (20 + (Math.random() * 25)) * rushHourFactor * weekendFactor; // 20-45% base

    // Higher vehicle contribution near major roads (closer to center = more roads)
    if (distanceKm < 1) {
        contributions.vehicle *= 1.4;
    }

    // Dust contribution (higher during afternoon, dry conditions, windy days)
    const dustBaseFactor = hour >= 12 && hour <= 16 ? 1.5 : 1.0; // Afternoon peak
    contributions.dust = (10 + (Math.random() * 20)) * dustBaseFactor; // 10-30% base

    // Seasonal/weather effects on dust
    const isDusty = Math.random() > 0.7; // 30% chance of dusty conditions
    if (isDusty) {
        contributions.dust *= 2;
    }

    // Normalize contributions to ensure they don't exceed 100%
    const totalContribution = contributions.construction + contributions.vehicle + contributions.dust;
    if (totalContribution > 85) { // Leave 15% for other sources
        const scaleFactor = 85 / totalContribution;
        contributions.construction *= scaleFactor;
        contributions.vehicle *= scaleFactor;
        contributions.dust *= scaleFactor;
    }

    // Other sources make up the remainder
    contributions.other = 100 - (contributions.construction + contributions.vehicle + contributions.dust);

    // Round to 1 decimal place
    Object.keys(contributions).forEach(key => {
        contributions[key] = Math.round(contributions[key] * 10) / 10;
    });

    // Calculate actual pollutant values based on contributions
    const pollutants = {
        aqi: Math.round(baseAQI),
        pm25: Math.round((contributions.construction * 1.8 + contributions.vehicle * 1.2 + contributions.dust * 2.5) * 0.8),
        pm10: Math.round((contributions.construction * 2.5 + contributions.vehicle * 1.0 + contributions.dust * 4.0) * 0.9),
        co: Math.round((contributions.vehicle * 0.15 + contributions.construction * 0.05) * 100) / 100,
        no2: Math.round((contributions.vehicle * 1.5 + contributions.construction * 0.8) * 0.7),
        so2: Math.round((contributions.construction * 0.5 + contributions.vehicle * 0.3) * 0.6),
        rh: 35 + Math.random() * 30, // Relative humidity
        temperature: 25 + Math.random() * 15,
        windSpeed: 2 + Math.random() * 6
    };

    return {
        contributions,
        pollutants,
        totalAQI: pollutants.aqi,
        dominantSource: Object.keys(contributions)
            .filter(key => key !== 'other')
            .reduce((a, b) => contributions[a] > contributions[b] ? a : b)
    };
};

// Generate time series data for a grid cell
const generateTimeSeriesData = (grid, startTime = new Date()) => {
    const timeSeriesData = [];

    for (let hour = 0; hour < TIME_SERIES_HOURS; hour++) {
        const timestamp = new Date(startTime.getTime() + (hour * 60 * 60 * 1000));
        const sourceData = calculateSourceContributions(grid, timestamp);

        timeSeriesData.push({
            timestamp: timestamp.toISOString(),
            hour: timestamp.getHours(),
            dayOfWeek: timestamp.getDay(),
            ...sourceData.pollutants,
            sourceContributions: sourceData.contributions,
            dominantSource: sourceData.dominantSource
        });
    }

    return timeSeriesData;
};

// Main function to generate source-based grid dataset
export const generateSourceBasedGridData = (options = {}) => {
    const {
        center = ANAND_VIHAR_CENTER,
        radiusKm = COVERAGE_RADIUS_KM,
        gridSizeM = GRID_SIZE_METERS,
        startTime = new Date(),
        includeTimeSeries = true
    } = options;

    console.log(`Generating source-based grid data...`);
    console.log(`Coverage: ${radiusKm * 2}km diameter around ${center.lat}, ${center.lng}`);
    console.log(`Grid size: ${gridSizeM}m x ${gridSizeM}m`);

    // Generate grid coordinates
    const grids = generateGridCoordinates(center, radiusKm, gridSizeM);
    console.log(`Generated ${grids.length} grid cells`);

    // Generate data for each grid
    const gridData = grids.map(grid => {
        const timeSeries = includeTimeSeries ? generateTimeSeriesData(grid, startTime) : [];
        const currentData = timeSeries.length > 0 ? timeSeries[0] : generateTimeSeriesData(grid, startTime)[0];

        return {
            ...grid,
            // Current values (latest timestamp)
            ...currentData,
            // Time series data
            timeSeries: timeSeries,
            // Metadata
            gridSizeMeters: gridSizeM,
            generatedAt: new Date().toISOString(),
            dataQuality: 'generated'
        };
    });

    console.log(`Generated complete dataset with ${gridData.length} grids and ${TIME_SERIES_HOURS} hours of data each`);

    return {
        metadata: {
            center,
            radiusKm,
            gridSizeM,
            totalGrids: gridData.length,
            timeSeriesHours: TIME_SERIES_HOURS,
            generatedAt: new Date().toISOString(),
            coverage: `${radiusKm * 2}km diameter`,
            dataPoints: gridData.length * TIME_SERIES_HOURS
        },
        grids: gridData,
        sourceColorSchemes: SOURCE_COLOR_SCHEMES
    };
};

// Helper function to get color and opacity for a source contribution
export const getSourceColorAndOpacity = (sourceName, contributionPercent) => {
    const scheme = SOURCE_COLOR_SCHEMES[sourceName];
    if (!scheme) return { color: '#gray', opacity: 0.1 };

    // Find appropriate range based on contribution percentage
    for (const range of scheme.ranges) {
        if (contributionPercent >= range.min && contributionPercent <= range.max) {
            return {
                color: scheme.color,
                opacity: range.opacity,
                label: range.label
            };
        }
    }

    // If exceeds max range
    const maxRange = scheme.ranges[scheme.ranges.length - 1];
    return {
        color: scheme.color,
        opacity: maxRange.opacity,
        label: maxRange.label
    };
};

// Filter grids based on air quality thresholds
export const applyAirQualityThresholds = (gridData, activeAirQualityFilters) => {
    if (!activeAirQualityFilters || activeAirQualityFilters.length === 0) {
        return gridData;
    }

    return gridData.filter(grid => {
        let meetsThreshold = true;

        activeAirQualityFilters.forEach(filter => {
            switch (filter) {
                case 'aqi':
                    if (grid.aqi < 150) meetsThreshold = false; // Show only unhealthy and above
                    break;
                case 'pm25':
                    if (grid.pm25 < 75) meetsThreshold = false; // Show only elevated PM2.5
                    break;
                case 'rh':
                    if (grid.rh > 45) meetsThreshold = false; // Show only low humidity (dusty conditions)
                    break;
                case 'co':
                    if (grid.co < 1.5) meetsThreshold = false; // Show only elevated CO
                    break;
            }
        });

        return meetsThreshold;
    });
};

// Get statistics for active sources
export const getSourceStatistics = (filteredGridData, activeSources) => {
    const stats = {};

    if (!filteredGridData || filteredGridData.length === 0) {
        return stats;
    }

    activeSources.forEach(source => {
        const contributions = filteredGridData.map(grid => grid.sourceContributions[source]).filter(c => c > 0);

        if (contributions.length > 0) {
            stats[source] = {
                min: Math.round(Math.min(...contributions) * 10) / 10,
                max: Math.round(Math.max(...contributions) * 10) / 10,
                avg: Math.round((contributions.reduce((a, b) => a + b, 0) / contributions.length) * 10) / 10,
                count: contributions.length,
                unit: '% of AQI'
            };
        }
    });

    return stats;
};

// Export sample data generation
export const generateSampleSourceGridData = () => {
    return generateSourceBasedGridData({
        center: ANAND_VIHAR_CENTER,
        radiusKm: 2.5,
        gridSizeM: 200,
        includeTimeSeries: true
    });
};

// Example usage and logging
const sampleData = generateSampleSourceGridData();
console.log('Source-based grid data generated:', sampleData.metadata);

// Log some sample contributions
console.log('Sample source contributions:');
sampleData.grids.slice(0, 3).forEach((grid, index) => {
    console.log(`Grid ${index + 1}:`, {
        id: grid.id,
        totalAQI: grid.aqi,
        contributions: grid.sourceContributions,
        dominant: grid.dominantSource
    });
});
