/**
 * Enhanced Source-Based Grid System for AQI Visualization
 * Per-pollutant source contributions with realistic patterns
 */

// Anand Vihar center coordinates
const ANAND_VIHAR_CENTER = { lat: 28.6469, lng: 77.3154 };

// Grid configuration
const GRID_SIZE_METERS = 200;
const COVERAGE_RADIUS_KM = 2.5;
const TIME_SERIES_HOURS = 72;

// Pollutant-specific color schemes
export const POLLUTANT_COLOR_SCHEMES = {
    aqi: {
        name: 'Air Quality Index',
        unit: 'AQI',
        baseColor: '#666',
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
        baseColor: '#3498db',
        ranges: [
            { min: 0, max: 12, color: '#85C1E9', label: 'Good', opacity: 0.6 },
            { min: 13, max: 35, color: '#5DADE2', label: 'Moderate', opacity: 0.7 },
            { min: 36, max: 55, color: '#3498DB', label: 'Unhealthy for Sensitive', opacity: 0.8 },
            { min: 56, max: 150, color: '#2E86AB', label: 'Unhealthy', opacity: 0.8 },
            { min: 151, max: 250, color: '#1B4F72', label: 'Very Unhealthy', opacity: 0.9 },
            { min: 251, max: 500, color: '#0D2439', label: 'Hazardous', opacity: 1.0 }
        ]
    },
    pm10: {
        name: 'PM10',
        unit: 'µg/m³',
        baseColor: '#9b59b6',
        ranges: [
            { min: 0, max: 54, color: '#D7BDE2', label: 'Good', opacity: 0.6 },
            { min: 55, max: 154, color: '#C39BD3', label: 'Moderate', opacity: 0.7 },
            { min: 155, max: 254, color: '#A569BD', label: 'Unhealthy for Sensitive', opacity: 0.8 },
            { min: 255, max: 354, color: '#8E44AD', label: 'Unhealthy', opacity: 0.8 },
            { min: 355, max: 424, color: '#6C3483', label: 'Very Unhealthy', opacity: 0.9 },
            { min: 425, max: 604, color: '#4A235A', label: 'Hazardous', opacity: 1.0 }
        ]
    },
    co: {
        name: 'Carbon Monoxide',
        unit: 'ppm',
        baseColor: '#e67e22',
        ranges: [
            { min: 0, max: 4.4, color: '#F8C471', label: 'Good', opacity: 0.6 },
            { min: 4.5, max: 9.4, color: '#F5B041', label: 'Moderate', opacity: 0.7 },
            { min: 9.5, max: 12.4, color: '#F39C12', label: 'Unhealthy for Sensitive', opacity: 0.8 },
            { min: 12.5, max: 15.4, color: '#E67E22', label: 'Unhealthy', opacity: 0.8 },
            { min: 15.5, max: 30.4, color: '#CA6F1E', label: 'Very Unhealthy', opacity: 0.9 },
            { min: 30.5, max: 50.4, color: '#A04000', label: 'Hazardous', opacity: 1.0 }
        ]
    },
    no2: {
        name: 'Nitrogen Dioxide',
        unit: 'µg/m³',
        baseColor: '#27ae60',
        ranges: [
            { min: 0, max: 53, color: '#A9DFBF', label: 'Good', opacity: 0.6 },
            { min: 54, max: 100, color: '#7DCEA0', label: 'Moderate', opacity: 0.7 },
            { min: 101, max: 360, color: '#58D68D', label: 'Unhealthy for Sensitive', opacity: 0.8 },
            { min: 361, max: 649, color: '#2ECC71', label: 'Unhealthy', opacity: 0.8 },
            { min: 650, max: 1249, color: '#27AE60', label: 'Very Unhealthy', opacity: 0.9 },
            { min: 1250, max: 2049, color: '#1E8449', label: 'Hazardous', opacity: 1.0 }
        ]
    },
    so2: {
        name: 'Sulfur Dioxide',
        unit: 'µg/m³',
        baseColor: '#e74c3c',
        ranges: [
            { min: 0, max: 35, color: '#F1948A', label: 'Good', opacity: 0.6 },
            { min: 36, max: 75, color: '#EC7063', label: 'Moderate', opacity: 0.7 },
            { min: 76, max: 185, color: '#E74C3C', label: 'Unhealthy for Sensitive', opacity: 0.8 },
            { min: 186, max: 304, color: '#CB4335', label: 'Unhealthy', opacity: 0.8 },
            { min: 305, max: 604, color: '#A93226', label: 'Very Unhealthy', opacity: 0.9 },
            { min: 605, max: 1004, color: '#7B241C', label: 'Hazardous', opacity: 1.0 }
        ]
    }
};

// Source information for contributions
export const POLLUTION_SOURCES = {
    construction: {
        name: 'Construction',
        icon: '🏗️',
        color: '#8B4513',
        description: 'Construction activities, machinery, dust from building sites',
        // Which pollutants this source primarily affects
        primaryPollutants: ['pm10', 'pm25', 'so2'],
        secondaryPollutants: ['aqi', 'no2']
    },
    vehicle: {
        name: 'Vehicle Emissions',
        icon: '🚗',
        color: '#DC143C',
        description: 'Vehicle exhaust, traffic congestion, road emissions',
        primaryPollutants: ['co', 'no2', 'aqi'],
        secondaryPollutants: ['pm25', 'pm10']
    },
    dust: {
        name: 'Dust Sources',
        icon: '🌪️',
        color: '#DAA520',
        description: 'Natural dust, unpaved areas, wind-blown particles',
        primaryPollutants: ['pm10', 'pm25'],
        secondaryPollutants: ['aqi']
    }
};

// Utility functions
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
                        [bounds.north, bounds.west],
                        [bounds.north, bounds.east],
                        [bounds.south, bounds.east],
                        [bounds.south, bounds.west]
                    ]
                });
            }
        }
    }

    return grids;
};

// Calculate realistic per-pollutant source contributions
const calculateSourceContributions = (grid, timestamp) => {
    const hour = new Date(timestamp).getHours();
    const dayOfWeek = new Date(timestamp).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const distanceKm = grid.distanceFromCenter / 1000;

    // Base pollutant values
    const pollutantValues = {
        aqi: 120 + (distanceKm * 15) + (Math.random() * 40 - 20),
        pm25: 60 + (distanceKm * 8) + (Math.random() * 25 - 12),
        pm10: 100 + (distanceKm * 12) + (Math.random() * 35 - 17),
        co: 2.5 + (distanceKm * 0.5) + (Math.random() * 2 - 1),
        no2: 45 + (distanceKm * 6) + (Math.random() * 20 - 10),
        so2: 20 + (distanceKm * 3) + (Math.random() * 15 - 7)
    };

    // Calculate source contributions per pollutant
    const sourceContributions = {};

    Object.keys(pollutantValues).forEach(pollutant => {
        sourceContributions[pollutant] = {
            construction: 0,
            vehicle: 0,
            dust: 0
        };

        // Construction contributions (higher during work hours, weekdays)
        let constructionFactor = 1.0;
        if (!isWeekend && hour >= 8 && hour <= 18) {
            constructionFactor = 2.0;
            if (hour >= 10 && hour <= 16) {
                constructionFactor = 2.5; // Peak hours
            }
        } else {
            constructionFactor = 0.3; // Minimal during off-hours
        }

        // Vehicle contributions (rush hours, distance from roads)
        let vehicleFactor = 1.0;
        const rushHours = [8, 9, 17, 18, 19, 20];
        if (rushHours.includes(hour)) {
            vehicleFactor = 2.2;
        }
        if (isWeekend) {
            vehicleFactor *= 0.6;
        }
        // Higher near center (more roads)
        if (distanceKm < 1) {
            vehicleFactor *= 1.5;
        }

        // Dust contributions (afternoon winds, dry conditions)
        let dustFactor = 1.0;
        if (hour >= 12 && hour <= 16) {
            dustFactor = 1.8; // Afternoon peak
        }
        const isDusty = Math.random() > 0.7;
        if (isDusty) {
            dustFactor *= 2.0;
        }

        // Calculate contributions based on pollutant type
        switch (pollutant) {
            case 'pm25':
                sourceContributions[pollutant].construction = (15 + Math.random() * 40) * constructionFactor;
                sourceContributions[pollutant].vehicle = (10 + Math.random() * 25) * vehicleFactor;
                sourceContributions[pollutant].dust = (20 + Math.random() * 35) * dustFactor;
                break;

            case 'pm10':
                sourceContributions[pollutant].construction = (20 + Math.random() * 50) * constructionFactor;
                sourceContributions[pollutant].vehicle = (8 + Math.random() * 20) * vehicleFactor;
                sourceContributions[pollutant].dust = (25 + Math.random() * 45) * dustFactor;
                break;

            case 'co':
                sourceContributions[pollutant].construction = (5 + Math.random() * 15) * constructionFactor;
                sourceContributions[pollutant].vehicle = (30 + Math.random() * 40) * vehicleFactor;
                sourceContributions[pollutant].dust = (2 + Math.random() * 8) * dustFactor;
                break;

            case 'no2':
                sourceContributions[pollutant].construction = (8 + Math.random() * 20) * constructionFactor;
                sourceContributions[pollutant].vehicle = (25 + Math.random() * 35) * vehicleFactor;
                sourceContributions[pollutant].dust = (3 + Math.random() * 10) * dustFactor;
                break;

            case 'so2':
                sourceContributions[pollutant].construction = (15 + Math.random() * 30) * constructionFactor;
                sourceContributions[pollutant].vehicle = (10 + Math.random() * 20) * vehicleFactor;
                sourceContributions[pollutant].dust = (5 + Math.random() * 12) * dustFactor;
                break;

            case 'aqi':
                // AQI contributions are weighted average of other pollutants
                sourceContributions[pollutant].construction = (20 + Math.random() * 35) * constructionFactor;
                sourceContributions[pollutant].vehicle = (18 + Math.random() * 30) * vehicleFactor;
                sourceContributions[pollutant].dust = (12 + Math.random() * 25) * dustFactor;
                break;
        }

        // Round to 1 decimal place
        Object.keys(sourceContributions[pollutant]).forEach(source => {
            sourceContributions[pollutant][source] = Math.round(sourceContributions[pollutant][source] * 10) / 10;
        });
    });

    // Round pollutant values
    Object.keys(pollutantValues).forEach(key => {
        pollutantValues[key] = Math.round(pollutantValues[key] * 100) / 100;
    });

    return {
        pollutantValues,
        sourceContributions,
        dominantSource: getDominantSource(sourceContributions, 'aqi')
    };
};

// Helper to determine dominant source for a pollutant
const getDominantSource = (contributions, pollutant) => {
    const pollutantContribs = contributions[pollutant];
    return Object.keys(pollutantContribs).reduce((a, b) =>
        pollutantContribs[a] > pollutantContribs[b] ? a : b
    );
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
            // Base pollutant measurements
            ...sourceData.pollutantValues,
            // Per-pollutant source contributions
            sourceContributions: sourceData.sourceContributions,
            dominantSource: sourceData.dominantSource,
            // Environmental data
            rh: 35 + Math.random() * 30,
            temperature: 25 + Math.random() * 15,
            windSpeed: 2 + Math.random() * 6
        });
    }

    return timeSeriesData;
};

// Main function to generate enhanced grid data
export const generateEnhancedGridData = (options = {}) => {
    const {
        center = ANAND_VIHAR_CENTER,
        radiusKm = COVERAGE_RADIUS_KM,
        gridSizeM = GRID_SIZE_METERS,
        startTime = new Date(),
        includeTimeSeries = true
    } = options;

    console.log(`Generating enhanced grid data with per-pollutant contributions...`);

    const grids = generateGridCoordinates(center, radiusKm, gridSizeM);
    console.log(`Generated ${grids.length} grid cells`);

    const gridData = grids.map(grid => {
        const timeSeries = includeTimeSeries ? generateTimeSeriesData(grid, startTime) : [];
        const currentData = timeSeries.length > 0 ? timeSeries[0] : generateTimeSeriesData(grid, startTime)[0];

        return {
            ...grid,
            ...currentData,
            timeSeries,
            gridSizeMeters: gridSizeM,
            generatedAt: new Date().toISOString(),
            dataQuality: 'generated'
        };
    });

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
        pollutantColorSchemes: POLLUTANT_COLOR_SCHEMES,
        pollutionSources: POLLUTION_SOURCES
    };
};

// Helper function to get color for pollutant value
export const getPollutantColor = (pollutant, value) => {
    const scheme = POLLUTANT_COLOR_SCHEMES[pollutant];
    if (!scheme) return { color: '#gray', opacity: 0.5, label: 'Unknown' };

    for (const range of scheme.ranges) {
        if (value >= range.min && value <= range.max) {
            return range;
        }
    }

    const highestRange = scheme.ranges[scheme.ranges.length - 1];
    return { ...highestRange, opacity: 1.0 };
};

// Calculate combined source intensity for selected sources and pollutant
export const calculateCombinedSourceIntensity = (gridCell, selectedSources, selectedPollutant) => {
    if (!gridCell.sourceContributions || !gridCell.sourceContributions[selectedPollutant]) {
        return 0;
    }

    const contributions = gridCell.sourceContributions[selectedPollutant];
    let totalContribution = 0;

    selectedSources.forEach(source => {
        if (contributions[source]) {
            totalContribution += contributions[source];
        }
    });

    // Convert percentage to opacity (0-1), with max opacity of 1.0
    return Math.min(totalContribution / 100, 1.0);
};

// Export for easy usage
export const generateSampleEnhancedGridData = () => {
    return generateEnhancedGridData({
        center: ANAND_VIHAR_CENTER,
        radiusKm: 2.5,
        gridSizeM: 200,
        includeTimeSeries: true
    });
};

// Example usage
console.log('Enhanced Grid Generator loaded');
const sampleData = generateSampleEnhancedGridData();
console.log('Enhanced grid data:', sampleData.metadata);

// Show sample contributions
console.log('Sample per-pollutant contributions:');
sampleData.grids.slice(0, 2).forEach((grid, index) => {
    console.log(`\n=== Grid ${index + 1} ===`);
    console.log(`AQI: ${grid.aqi}, PM2.5: ${grid.pm25}, CO: ${grid.co}`);
    console.log('Source contributions:');
    Object.keys(grid.sourceContributions).forEach(pollutant => {
        console.log(`  ${pollutant.toUpperCase()}: Construction(${grid.sourceContributions[pollutant].construction}%) + Vehicle(${grid.sourceContributions[pollutant].vehicle}%) + Dust(${grid.sourceContributions[pollutant].dust}%)`);
    });
});