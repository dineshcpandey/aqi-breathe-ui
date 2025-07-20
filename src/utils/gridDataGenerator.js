// ==================== src/utils/gridDataGenerator.js ====================

/**
 * Grid-based AQI Data Generation for 5km area around Anand Vihar
 * Generates 200m x 200m blocks with 72-hour time series data
 */

// Anand Vihar center coordinates
const ANAND_VIHAR_CENTER = { lat: 28.6469, lng: 77.3154 };

// Grid configuration
const GRID_SIZE_METERS = 200; // 200m x 200m blocks
const COVERAGE_RADIUS_KM = 2.5; // 5km diameter coverage
const TIME_SERIES_HOURS = 72; // 3 days of data
const HOURS_INTERVAL = 1; // Data every hour

// Pollution source types with realistic influence patterns
const POLLUTION_SOURCES = {
    TRAFFIC: {
        name: 'Traffic',
        peakHours: [8, 9, 18, 19, 20], // Rush hours
        baseMultiplier: 1.0,
        peakMultiplier: 2.5,
        pollutants: { co: 3.0, no2: 2.0, pm25: 1.5, pm10: 1.8 }
    },
    CONSTRUCTION: {
        name: 'Construction',
        peakHours: [10, 11, 14, 15, 16], // Working hours
        baseMultiplier: 0.8,
        peakMultiplier: 3.0,
        pollutants: { pm10: 4.0, pm25: 2.5, so2: 1.2, noise: 3.5 }
    },
    INDUSTRIAL: {
        name: 'Industrial',
        peakHours: [9, 10, 11, 14, 15, 16, 17], // Business hours
        baseMultiplier: 1.2,
        peakMultiplier: 2.0,
        pollutants: { so2: 2.5, no2: 2.2, pm25: 1.8, co: 1.5 }
    },
    DUST: {
        name: 'Dust',
        peakHours: [12, 13, 14, 15], // Afternoon winds
        baseMultiplier: 0.6,
        peakMultiplier: 2.8,
        pollutants: { pm10: 5.0, pm25: 3.0, tsp: 4.5 }
    },
    RESIDENTIAL: {
        name: 'Residential',
        peakHours: [6, 7, 19, 20, 21], // Cooking times
        baseMultiplier: 0.4,
        peakMultiplier: 1.5,
        pollutants: { pm25: 1.2, co: 1.0, so2: 0.8 }
    }
};

// Color schemes for different pollutants
export const POLLUTANT_COLOR_SCHEMES = {
    aqi: {
        name: 'Air Quality Index',
        unit: 'AQI',
        ranges: [
            { min: 0, max: 50, color: '#00e400', label: 'Good', opacity: 0.6 },
            { min: 51, max: 100, color: '#ffff00', label: 'Moderate', opacity: 0.7 },
            { min: 101, max: 150, color: '#ff7e00', label: 'Unhealthy for Sensitive', opacity: 0.8 },
            { min: 151, max: 200, color: '#ff0000', label: 'Unhealthy', opacity: 0.8 },
            { min: 201, max: 300, color: '#8f3f97', label: 'Very Unhealthy', opacity: 0.9 },
            { min: 301, max: 500, color: '#7e0023', label: 'Hazardous', opacity: 1.0 }
        ]
    },
    pm25: {
        name: 'PM2.5',
        unit: 'µg/m³',
        ranges: [
            { min: 0, max: 12, color: '#00e400', label: 'Good', opacity: 0.6 },
            { min: 13, max: 35, color: '#ffff00', label: 'Moderate', opacity: 0.7 },
            { min: 36, max: 55, color: '#ff7e00', label: 'Unhealthy for Sensitive', opacity: 0.8 },
            { min: 56, max: 150, color: '#ff0000', label: 'Unhealthy', opacity: 0.8 },
            { min: 151, max: 250, color: '#8f3f97', label: 'Very Unhealthy', opacity: 0.9 },
            { min: 251, max: 500, color: '#7e0023', label: 'Hazardous', opacity: 1.0 }
        ]
    },
    pm10: {
        name: 'PM10',
        unit: 'µg/m³',
        ranges: [
            { min: 0, max: 54, color: '#00e400', label: 'Good', opacity: 0.6 },
            { min: 55, max: 154, color: '#ffff00', label: 'Moderate', opacity: 0.7 },
            { min: 155, max: 254, color: '#ff7e00', label: 'Unhealthy for Sensitive', opacity: 0.8 },
            { min: 255, max: 354, color: '#ff0000', label: 'Unhealthy', opacity: 0.8 },
            { min: 355, max: 424, color: '#8f3f97', label: 'Very Unhealthy', opacity: 0.9 },
            { min: 425, max: 604, color: '#7e0023', label: 'Hazardous', opacity: 1.0 }
        ]
    },
    co: {
        name: 'Carbon Monoxide',
        unit: 'ppm',
        ranges: [
            { min: 0, max: 4.4, color: '#00e400', label: 'Good', opacity: 0.6 },
            { min: 4.5, max: 9.4, color: '#ffff00', label: 'Moderate', opacity: 0.7 },
            { min: 9.5, max: 12.4, color: '#ff7e00', label: 'Unhealthy for Sensitive', opacity: 0.8 },
            { min: 12.5, max: 15.4, color: '#ff0000', label: 'Unhealthy', opacity: 0.8 },
            { min: 15.5, max: 30.4, color: '#8f3f97', label: 'Very Unhealthy', opacity: 0.9 },
            { min: 30.5, max: 50.4, color: '#7e0023', label: 'Hazardous', opacity: 1.0 }
        ]
    },
    no2: {
        name: 'Nitrogen Dioxide',
        unit: 'µg/m³',
        ranges: [
            { min: 0, max: 53, color: '#00e400', label: 'Good', opacity: 0.6 },
            { min: 54, max: 100, color: '#ffff00', label: 'Moderate', opacity: 0.7 },
            { min: 101, max: 360, color: '#ff7e00', label: 'Unhealthy for Sensitive', opacity: 0.8 },
            { min: 361, max: 649, color: '#ff0000', label: 'Unhealthy', opacity: 0.8 },
            { min: 650, max: 1249, color: '#8f3f97', label: 'Very Unhealthy', opacity: 0.9 },
            { min: 1250, max: 2049, color: '#7e0023', label: 'Hazardous', opacity: 1.0 }
        ]
    }
};

// Utility functions
const degreesToMeters = (degrees, latitude) => {
    const earthRadius = 6371000; // meters
    const metersPerDegreeLat = (Math.PI * earthRadius) / 180;
    const metersPerDegreeLng = metersPerDegreeLat * Math.cos(latitude * (Math.PI / 180));

    return {
        latMeters: degrees * metersPerDegreeLat,
        lngMeters: degrees * metersPerDegreeLng
    };
};

const metersTodegrees = (meters, latitude) => {
    const earthRadius = 6371000; // meters
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
    const halfGrid = gridSizeM / 2;

    // Calculate degree conversions at center latitude
    const { latDegrees: gridLatDegrees, lngDegrees: gridLngDegrees } =
        metersTodegrees(gridSizeM, center.lat);

    // Calculate how many grid cells fit in the radius
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
                // Calculate grid boundaries
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
                    // Grid corners for polygon rendering
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

// Generate time series data for a grid cell
const generateTimeSeriesData = (grid, startTime = new Date()) => {
    const timeSeriesData = [];
    const baselineAQI = 100 + (grid.distanceFromCenter / 1000) * 20; // Higher AQI closer to center

    for (let hour = 0; hour < TIME_SERIES_HOURS; hour++) {
        const timestamp = new Date(startTime.getTime() + (hour * 60 * 60 * 1000));
        const hourOfDay = timestamp.getHours();
        const dayOfWeek = timestamp.getDay(); // 0 = Sunday

        // Calculate pollution levels based on sources and time
        let totalPollution = {
            aqi: baselineAQI,
            pm25: 50,
            pm10: 80,
            co: 1.0,
            no2: 40,
            so2: 15,
            rh: 45 + Math.random() * 20, // Relative humidity varies
            temperature: 25 + Math.random() * 15, // Temperature variation
            windSpeed: 2 + Math.random() * 8
        };

        // Apply source influences
        Object.values(POLLUTION_SOURCES).forEach(source => {
            const isPeakHour = source.peakHours.includes(hourOfDay);
            const multiplier = isPeakHour ? source.peakMultiplier : source.baseMultiplier;
            const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0; // Less pollution on weekends

            Object.keys(source.pollutants).forEach(pollutant => {
                if (totalPollution[pollutant] !== undefined) {
                    const increase = source.pollutants[pollutant] * multiplier * weekendFactor;
                    totalPollution[pollutant] += increase * (0.8 + Math.random() * 0.4); // Add randomness
                }
            });
        });

        // Add weather effects
        const weatherVariation = 0.8 + Math.random() * 0.4;
        Object.keys(totalPollution).forEach(key => {
            if (key !== 'rh' && key !== 'temperature' && key !== 'windSpeed') {
                totalPollution[key] *= weatherVariation;
            }
        });

        // Recalculate AQI based on individual pollutants
        totalPollution.aqi = Math.max(
            totalPollution.pm25 * 2,
            totalPollution.pm10 * 1.2,
            totalPollution.co * 20,
            totalPollution.no2 * 1.5,
            baselineAQI
        );

        // Round values
        Object.keys(totalPollution).forEach(key => {
            totalPollution[key] = Math.round(totalPollution[key] * 100) / 100;
        });

        timeSeriesData.push({
            timestamp: timestamp.toISOString(),
            hour: hourOfDay,
            dayOfWeek,
            ...totalPollution,
            // Determine dominant pollution source
            dominantSource: getDominantSource(totalPollution, hourOfDay),
            // Weather conditions
            weather: getWeatherCondition(totalPollution.rh, totalPollution.windSpeed)
        });
    }

    return timeSeriesData;
};

// Helper function to determine dominant pollution source
const getDominantSource = (pollution, hour) => {
    if (pollution.co > 3.0 || pollution.no2 > 80) return 'traffic';
    if (pollution.pm10 > 200 && hour >= 10 && hour <= 16) return 'construction';
    if (pollution.pm10 > pollution.pm25 * 2 && hour >= 12 && hour <= 15) return 'dust';
    if (pollution.so2 > 25 && hour >= 9 && hour <= 17) return 'industrial';
    return 'residential';
};

// Helper function to determine weather condition
const getWeatherCondition = (humidity, windSpeed) => {
    if (humidity > 70) return 'humid';
    if (windSpeed > 6) return 'windy';
    if (humidity < 30 && windSpeed > 4) return 'dusty';
    return 'normal';
};

// Main function to generate complete grid dataset
export const generateGridBasedAQIData = (options = {}) => {
    const {
        center = ANAND_VIHAR_CENTER,
        radiusKm = COVERAGE_RADIUS_KM,
        gridSizeM = GRID_SIZE_METERS,
        startTime = new Date(),
        includeTimeSeries = true
    } = options;

    console.log(`Generating grid-based AQI data...`);
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
            dataQuality: 'generated' // vs 'measured'
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
        colorSchemes: POLLUTANT_COLOR_SCHEMES
    };
};

// Helper function to get color for a value based on pollutant type
export const getColorForValue = (pollutant, value) => {
    const scheme = POLLUTANT_COLOR_SCHEMES[pollutant];
    if (!scheme) return { color: '#gray', opacity: 0.5, label: 'Unknown' };

    for (const range of scheme.ranges) {
        if (value >= range.min && value <= range.max) {
            return range;
        }
    }

    // If value exceeds all ranges, return the highest range
    const highestRange = scheme.ranges[scheme.ranges.length - 1];
    return { ...highestRange, opacity: 1.0 };
};

// Export sample data generation
export const generateSampleGridData = () => {
    return generateGridBasedAQIData({
        center: ANAND_VIHAR_CENTER,
        radiusKm: 2.5, // 5km diameter coverage
        gridSizeM: 200, // 200m x 200m blocks
        includeTimeSeries: true
    });
};

// Statistics helper
export const getDatasetStatistics = (gridData) => {
    const stats = {};

    if (gridData.grids && gridData.grids.length > 0) {
        const pollutants = ['aqi', 'pm25', 'pm10', 'co', 'no2', 'so2'];

        pollutants.forEach(pollutant => {
            const values = gridData.grids.map(grid => grid[pollutant]).filter(v => v !== undefined);

            if (values.length > 0) {
                stats[pollutant] = {
                    min: Math.min(...values),
                    max: Math.max(...values),
                    avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
                    count: values.length
                };
            }
        });

        // Source distribution
        const sources = {};
        gridData.grids.forEach(grid => {
            const source = grid.dominantSource || 'unknown';
            sources[source] = (sources[source] || 0) + 1;
        });

        stats.sources = sources;
    }

    return stats;
};

// Example usage:
console.log('Grid Data Generator loaded');

// Generate sample data when module is imported
const sampleData = generateSampleGridData();
console.log('Sample grid data:', sampleData.metadata);
console.log('Sample statistics:', getDatasetStatistics(sampleData));