// compatible-data-generator.js - Generate data compatible with existing visualization
// Run: node compatible-data-generator.js

const fs = require('fs');
const path = require('path');

// Configuration matching your current system
const CONFIG = {
    // Area settings (matches your current Anand Vihar center)
    areaName: 'Anand Vihar',
    centerLat: 28.6469,
    centerLng: 77.3154,
    radiusKm: 2.5,  // Matches your current grid radius

    // Sensor counts by type (matches your current distribution)
    sensorCounts: {
        construction: 5,
        vehicle: 6,
        dust: 5,
        industrial: 4,  // Keep 0 for now to match current system
        residential: 8  // Keep 0 for now to match current system
    },

    // Time series configuration
    timeConfig: {
        // Historical data: July 15-20, 2025
        historicalStart: '2025-07-15T00:00:00Z',
        historicalEnd: '2025-07-20T23:59:59Z',

        // Current data: July 20, 2025 (latest reading)
        currentTime: '2025-07-20T14:30:00Z',

        // Predicted data: July 20-23, 2025
        predictedStart: '2025-07-20T15:00:00Z',
        predictedEnd: '2025-07-23T23:59:59Z',

        // Data interval in minutes
        intervalMinutes: 60  // Generate data every hour
    },

    // Grid configuration (matches your current system)
    gridConfig: {
        radiusKm: 2.5,
        gridSizeM: 200,  // 200m x 200m cells like current system
        includeSourceContributions: true
    },

    // Output configuration
    output: {
        folder: './generated_data/',
        files: {
            // Sensor files
            current: 'current_reading.csv',
            historical: 'historical_reading.csv',
            predicted: 'predicted_reading.csv',
            sensors: 'sensor_locations.json',

            // Grid files (compatible with your grid system)
            gridCurrent: 'grid_current.csv',
            gridHistorical: 'grid_historical.csv',
            gridPredicted: 'grid_predicted.csv'
        }
    },

    // Environmental conditions for July 2025 (Delhi summer)
    environmentalBase: {
        temperature: { min: 32, max: 44, avg: 38 },
        humidity: { min: 25, max: 75, avg: 45 },
        windSpeed: { min: 1.5, max: 8.5, avg: 4.2 },
        monsoonFactor: 0.15
    }
};

// Sensor templates matching your current system exactly
const SENSOR_TEMPLATES = {
    construction: {
        names: ['Metro Construction', 'Building Project', 'Highway Expansion', 'Active Construction', 'Industrial Building Site'],
        stationSuffixes: ['A', 'B', 'C', 'D', 'E'],
        baseValues: {
            aqi: { min: 120, max: 220 },
            pm25: { min: 80, max: 180 },
            pm10: { min: 150, max: 370 },
            co: { min: 1.0, max: 3.0 },
            no2: { min: 35, max: 85 },
            so2: { min: 8, max: 25 }
        },
        peakHours: [9, 10, 11, 12, 13, 14, 15, 16],
        descriptions: [
            'Metro construction with heavy machinery',
            'Building project with dust and emissions',
            'Highway expansion with earthmoving equipment',
            'Active construction site with concrete mixing'
        ]
    },
    vehicle: {
        names: ['Bus Terminal', 'Traffic Junction', 'Highway Monitor', 'Parking Complex'],
        stationSuffixes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        baseValues: {
            aqi: { min: 100, max: 200 },
            pm25: { min: 60, max: 140 },
            pm10: { min: 80, max: 200 },
            co: { min: 2.0, max: 4.5 },
            no2: { min: 40, max: 90 },
            so2: { min: 15, max: 30 }
        },
        peakHours: [7, 8, 9, 17, 18, 19, 20],
        descriptions: [
            'Major bus terminal with heavy traffic congestion',
            'Traffic junction with high vehicle density',
            'Highway monitoring point with diesel emissions',
            'Parking complex with vehicle idling'
        ]
    },
    dust: {
        names: ['Open Ground', 'Vacant Plot', 'Quarry Site', 'Unpaved Area', 'Demolished Building Site'],
        stationSuffixes: ['A', 'B', 'C', 'D', 'E'],
        baseValues: {
            aqi: { min: 140, max: 225 },
            pm25: { min: 100, max: 200 },
            pm10: { min: 200, max: 430 },
            co: { min: 0.5, max: 1.5 },
            no2: { min: 20, max: 45 },
            so2: { min: 5, max: 15 }
        },
        peakHours: [12, 13, 14, 15, 16],
        descriptions: [
            'Large unpaved area with loose soil',
            'Vacant plot with exposed soil and debris',
            'Quarry site with crushing operations',
            'Open area with construction debris'
        ]
    }
};

// Generate random value within range
function generateRandomInRange(range) {
    return range.min + Math.random() * (range.max - range.min);
}

// Generate static sensor locations (matches your current sensor distribution)
function generateStaticSensors() {
    console.log('📍 Generating sensor locations...');

    const sensors = [];
    let sensorCounter = 1;

    Object.entries(CONFIG.sensorCounts).forEach(([sourceType, count]) => {
        if (count === 0) return;

        const template = SENSOR_TEMPLATES[sourceType];
        if (!template) return;

        for (let i = 0; i < count; i++) {
            // Generate coordinates within radius around center
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * CONFIG.radiusKm * 1000; // meters

            const lat = CONFIG.centerLat + (distance * Math.cos(angle)) / 111000;
            const lng = CONFIG.centerLng + (distance * Math.sin(angle)) / (111000 * Math.cos(CONFIG.centerLat * Math.PI / 180));

            const station = `${template.names[i % template.names.length]} ${template.stationSuffixes[i]}`;

            sensors.push({
                id: `${sourceType}_${String(sensorCounter).padStart(3, '0')}`,
                lat: Math.round(lat * 1000000) / 1000000,
                lng: Math.round(lng * 1000000) / 1000000,
                station: station,
                source: sourceType,
                staticDescription: template.descriptions[i % template.descriptions.length]
            });

            sensorCounter++;
        }
    });

    console.log(`   Generated ${sensors.length} sensor locations`);
    return sensors;
}

// Calculate severity based on AQI (matches your current system)
function calculateSeverity(aqi) {
    if (aqi >= 300) return 'hazardous';
    if (aqi >= 200) return 'very_high';
    if (aqi >= 150) return 'high';
    return 'moderate';
}

// Generate description (matches your current format)
function generateDescription(sensor) {
    return `${sensor.station} - ${sensor.staticDescription}`;
}

// Generate environmental data
function generateEnvironmentalData(datetime, dataType = 'historical') {
    const hour = new Date(datetime).getHours();
    const base = CONFIG.environmentalBase;

    // Temperature variation by hour
    let tempMultiplier = 1.0;
    if (hour >= 6 && hour <= 18) {
        tempMultiplier = 0.8 + 0.4 * Math.sin((hour - 6) * Math.PI / 12);
    } else {
        tempMultiplier = 0.6;
    }

    // Humidity is inverse of temperature generally
    const humidityMultiplier = 1.5 - tempMultiplier;

    return {
        rh: Math.round(base.humidity.avg * humidityMultiplier + (Math.random() - 0.5) * 20),
        temperature: Math.round((base.temperature.avg * tempMultiplier + (Math.random() - 0.5) * 5) * 10) / 10,
        windSpeed: Math.round((base.windSpeed.avg + (Math.random() - 0.5) * 3) * 10) / 10
    };
}

// Get time-based multiplier for pollution
function getTimeBasedMultiplier(datetime, template, dataType) {
    const hour = new Date(datetime).getHours();
    const dayOfWeek = new Date(datetime).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let multiplier = 1.0;

    // Peak hour effect
    if (template.peakHours.includes(hour)) {
        multiplier *= 1.8;
    } else if (hour >= 22 || hour <= 5) {
        multiplier *= 0.6; // Night time reduction
    }

    // Weekend effect
    if (isWeekend) {
        multiplier *= 0.7;
    }

    // Data type specific adjustments
    if (dataType === 'predicted') {
        multiplier *= (0.95 + Math.random() * 0.1); // Small prediction uncertainty
    }

    return multiplier;
}

// Generate sensor reading (matches your current data structure EXACTLY)
function generateSensorReading(sensor, datetime, dataType = 'current') {
    const template = SENSOR_TEMPLATES[sensor.source];
    const timeMultiplier = getTimeBasedMultiplier(datetime, template, dataType);
    const environmental = generateEnvironmentalData(datetime, dataType);

    // Weather impact (rain reduces particulates)
    const isRainy = Math.random() < CONFIG.environmentalBase.monsoonFactor;
    const weatherMultiplier = isRainy ? 0.7 : 1.0;

    // Generate pollutant values
    const readings = {};
    Object.entries(template.baseValues).forEach(([pollutant, range]) => {
        let value = generateRandomInRange(range) * timeMultiplier * weatherMultiplier;

        // Add measurement noise
        value *= (0.95 + Math.random() * 0.1);

        // Round appropriately
        readings[pollutant] = pollutant === 'co' ?
            Math.round(value * 100) / 100 :
            Math.round(value * 10) / 10;
    });

    const aqi = readings.aqi;

    // Return data structure that EXACTLY matches your current sensor data
    return {
        id: sensor.id,
        lat: sensor.lat,
        lng: sensor.lng,
        station: sensor.station,
        source: sensor.source,
        aqi: Math.round(aqi),
        pm25: readings.pm25,
        pm10: readings.pm10,
        co: readings.co,
        no2: readings.no2,
        so2: readings.so2,
        rh: environmental.rh,
        temperature: environmental.temperature,
        windSpeed: environmental.windSpeed,
        timestamp: datetime,
        severity: calculateSeverity(aqi),
        description: generateDescription(sensor)
    };
}

// Generate current data (single timestamp)
function generateCurrentData(sensors) {
    console.log('📈 Generating current readings...');

    const currentTime = new Date(CONFIG.timeConfig.currentTime);
    const readings = sensors.map(sensor =>
        generateSensorReading(sensor, currentTime.toISOString(), 'current')
    );

    console.log(`   Generated ${readings.length} current readings`);
    return readings;
}

// Generate time series data (for historical/predicted)
function generateTimeSeriesData(sensors, startDate, endDate, dataType) {
    console.log(`📊 Generating ${dataType} data from ${startDate} to ${endDate}...`);

    const readings = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const intervalMs = CONFIG.timeConfig.intervalMinutes * 60 * 1000;

    let currentTime = new Date(start);
    let totalReadings = 0;

    while (currentTime <= end) {
        sensors.forEach(sensor => {
            const reading = generateSensorReading(sensor, currentTime.toISOString(), dataType);
            readings.push(reading);
            totalReadings++;
        });

        currentTime = new Date(currentTime.getTime() + intervalMs);
    }

    console.log(`   Generated ${totalReadings} readings (${Math.round(totalReadings / sensors.length)} timestamps per sensor)`);
    return readings;
}

// Generate grid data (compatible with your current grid system)
function generateGridData(sensors, datetime, dataType = 'current') {
    console.log(`🏗️ Generating ${dataType} grid data...`);

    const grids = [];
    const { centerLat, centerLng } = CONFIG;
    const { radiusKm, gridSizeM } = CONFIG.gridConfig;

    // Grid generation logic (matches your enhancedGridGenerator.js)
    const radiusM = radiusKm * 1000;
    const gridLatDegrees = gridSizeM / 111000; // ~111km per degree latitude
    const gridLngDegrees = gridSizeM / (111000 * Math.cos(centerLat * Math.PI / 180));

    let gridId = 1;

    // Generate grid coordinates (same as your current system)
    const latRangeKm = radiusKm * 1000 / 111000; // Convert km to degrees
    const lngRangeKm = radiusKm * 1000 / (111000 * Math.cos(centerLat * Math.PI / 180)); // Convert km to degrees

    for (let latOffset = -latRangeKm; latOffset <= latRangeKm; latOffset += gridLatDegrees) {
        for (let lngOffset = -lngRangeKm; lngOffset <= lngRangeKm; lngOffset += gridLngDegrees) {
            const gridCenterLat = centerLat + latOffset;
            const gridCenterLng = centerLng + lngOffset;

            // Check if grid is within radius
            const distance = Math.sqrt(
                Math.pow((gridCenterLat - centerLat) * 111000, 2) +
                Math.pow((gridCenterLng - centerLng) * 111000 * Math.cos(centerLat * Math.PI / 180), 2)
            );

            if (distance <= radiusM) {
                // Calculate grid bounds
                const bounds = {
                    north: gridCenterLat + (gridLatDegrees / 2),
                    south: gridCenterLat - (gridLatDegrees / 2),
                    east: gridCenterLng + (gridLngDegrees / 2),
                    west: gridCenterLng - (gridLngDegrees / 2)
                };

                // Generate pollutant values for this grid cell
                const distanceKm = distance / 1000;
                const hour = new Date(datetime).getHours();

                // Base pollutant values influenced by distance from center
                const baseValues = {
                    aqi: 120 + (distanceKm * 15) + (Math.random() * 40 - 20),
                    pm25: 60 + (distanceKm * 8) + (Math.random() * 25 - 12),
                    pm10: 100 + (distanceKm * 12) + (Math.random() * 35 - 17),
                    co: 2.5 + (distanceKm * 0.5) + (Math.random() * 2 - 1),
                    no2: 45 + (distanceKm * 6) + (Math.random() * 20 - 10),
                    so2: 20 + (distanceKm * 3) + (Math.random() * 15 - 7)
                };

                // Generate source contributions (matches your current system)
                const sourceContributions = {};
                Object.keys(baseValues).forEach(pollutant => {
                    // Time-based factors
                    const isWorkHour = hour >= 8 && hour <= 18;
                    const isRushHour = [8, 9, 17, 18, 19, 20].includes(hour);
                    const isAfternoon = hour >= 12 && hour <= 16;

                    let constructionContrib, vehicleContrib, dustContrib;

                    switch (pollutant) {
                        case 'pm25':
                            constructionContrib = (15 + Math.random() * 25) * (isWorkHour ? 2.0 : 0.5);
                            vehicleContrib = (10 + Math.random() * 20) * (isRushHour ? 2.2 : 1.0);
                            dustContrib = (20 + Math.random() * 25) * (isAfternoon ? 1.8 : 1.0);
                            break;
                        case 'pm10':
                            constructionContrib = (20 + Math.random() * 30) * (isWorkHour ? 2.0 : 0.5);
                            vehicleContrib = (8 + Math.random() * 15) * (isRushHour ? 2.2 : 1.0);
                            dustContrib = (25 + Math.random() * 35) * (isAfternoon ? 1.8 : 1.0);
                            break;
                        case 'co':
                            constructionContrib = (5 + Math.random() * 10) * (isWorkHour ? 2.0 : 0.5);
                            vehicleContrib = (30 + Math.random() * 25) * (isRushHour ? 2.2 : 1.0);
                            dustContrib = (2 + Math.random() * 5) * (isAfternoon ? 1.8 : 1.0);
                            break;
                        case 'no2':
                            constructionContrib = (8 + Math.random() * 15) * (isWorkHour ? 2.0 : 0.5);
                            vehicleContrib = (25 + Math.random() * 25) * (isRushHour ? 2.2 : 1.0);
                            dustContrib = (3 + Math.random() * 8) * (isAfternoon ? 1.8 : 1.0);
                            break;
                        case 'so2':
                            constructionContrib = (15 + Math.random() * 20) * (isWorkHour ? 2.0 : 0.5);
                            vehicleContrib = (10 + Math.random() * 15) * (isRushHour ? 2.2 : 1.0);
                            dustContrib = (5 + Math.random() * 10) * (isAfternoon ? 1.8 : 1.0);
                            break;
                        case 'aqi':
                            constructionContrib = (20 + Math.random() * 25) * (isWorkHour ? 2.0 : 0.5);
                            vehicleContrib = (18 + Math.random() * 22) * (isRushHour ? 2.2 : 1.0);
                            dustContrib = (12 + Math.random() * 20) * (isAfternoon ? 1.8 : 1.0);
                            break;
                    }

                    // Round to 1 decimal place
                    sourceContributions[pollutant] = {
                        construction: Math.round(constructionContrib * 10) / 10,
                        vehicle: Math.round(vehicleContrib * 10) / 10,
                        dust: Math.round(dustContrib * 10) / 10
                    };
                });

                // Round pollutant values
                Object.keys(baseValues).forEach(key => {
                    baseValues[key] = Math.round(baseValues[key] * 100) / 100;
                });

                // Create grid cell (matches your current grid structure)
                grids.push({
                    id: `grid_${gridId++}`,
                    centerLat: Math.round(gridCenterLat * 1000000) / 1000000,
                    centerLng: Math.round(gridCenterLng * 1000000) / 1000000,
                    timestamp: datetime,
                    bounds: bounds,
                    corners: [
                        [bounds.north, bounds.west],
                        [bounds.north, bounds.east],
                        [bounds.south, bounds.east],
                        [bounds.south, bounds.west]
                    ],
                    distanceFromCenter: Math.round(distance),
                    ...baseValues,
                    sourceContributions: sourceContributions
                });
            }
        }
    }

    console.log(`   Generated ${grids.length} grid cells`);
    return grids;
}

// Ensure output directory exists
function ensureOutputDirectory() {
    if (!fs.existsSync(CONFIG.output.folder)) {
        fs.mkdirSync(CONFIG.output.folder, { recursive: true });
        console.log(`📁 Created output directory: ${CONFIG.output.folder}`);
    }
}

// Save sensor data as CSV
function saveCSV(data, filename) {
    if (!data || data.length === 0) {
        console.warn(`⚠️  No data to save for ${filename}`);
        return;
    }

    const filepath = path.join(CONFIG.output.folder, filename);
    const headers = Object.keys(data[0]).join(',');

    let csvContent = headers + '\n';
    data.forEach(row => {
        const values = Object.values(row).map(value => {
            // Escape strings that contain commas
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });

    fs.writeFileSync(filepath, csvContent, 'utf8');
    console.log(`   💾 Saved ${data.length} records to ${filename}`);
}

// Save grid data as CSV (flattened structure)
function saveGridCSV(data, filename) {
    if (!data || data.length === 0) {
        console.warn(`⚠️  No grid data to save for ${filename}`);
        return;
    }

    const filepath = path.join(CONFIG.output.folder, filename);

    // Create flattened structure for CSV
    const flattenedData = data.map(grid => {
        const flattened = {
            grid_id: grid.id,
            center_lat: grid.centerLat,
            center_lng: grid.centerLng,
            timestamp: grid.timestamp,
            aqi: grid.aqi,
            pm25: grid.pm25,
            pm10: grid.pm10,
            co: grid.co,
            no2: grid.no2,
            so2: grid.so2,
            distance_from_center: grid.distanceFromCenter
        };

        // Add source contributions as flat columns
        Object.keys(grid.sourceContributions).forEach(pollutant => {
            Object.keys(grid.sourceContributions[pollutant]).forEach(source => {
                flattened[`${source}_contrib_${pollutant}`] = grid.sourceContributions[pollutant][source];
            });
        });

        return flattened;
    });

    const headers = Object.keys(flattenedData[0]).join(',');
    let csvContent = headers + '\n';

    flattenedData.forEach(row => {
        const values = Object.values(row).map(value => {
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });

    fs.writeFileSync(filepath, csvContent, 'utf8');
    console.log(`   💾 Saved ${data.length} grid cells to ${filename}`);
}

// Save sensor locations as JSON
function saveSensorLocations(sensors) {
    const filepath = path.join(CONFIG.output.folder, CONFIG.output.files.sensors);
    const sensorData = {
        metadata: {
            areaName: CONFIG.areaName,
            center: { lat: CONFIG.centerLat, lng: CONFIG.centerLng },
            radiusKm: CONFIG.radiusKm,
            totalSensors: sensors.length,
            generatedAt: new Date().toISOString(),
            distribution: CONFIG.sensorCounts
        },
        sensors: sensors
    };

    fs.writeFileSync(filepath, JSON.stringify(sensorData, null, 2), 'utf8');
    console.log(`   💾 Saved ${sensors.length} sensor locations to ${CONFIG.output.files.sensors}`);
}

// Generate data summary
function generateDataSummary(currentData, historicalData, predictedData) {
    console.log('\n📊 Data Generation Summary:');
    console.log('=====================================');

    const sourceStats = {};
    currentData.forEach(reading => {
        sourceStats[reading.source] = (sourceStats[reading.source] || 0) + 1;
    });

    console.log('📍 Sensor Distribution:');
    Object.entries(sourceStats).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} sensors`);
    });

    console.log('\n📈 Data Volumes:');
    console.log(`   Current readings: ${currentData.length}`);
    console.log(`   Historical readings: ${historicalData.length}`);
    console.log(`   Predicted readings: ${predictedData.length}`);

    const avgAQI = Math.round(currentData.reduce((sum, r) => sum + r.aqi, 0) / currentData.length);
    console.log(`\n🌫️ Current Average AQI: ${avgAQI}`);
}

// Main execution function
async function main() {
    console.log('\n🌍 Compatible AQI Data Generator');
    console.log('==================================');
    console.log(`Configuration:`);
    console.log(`  Area: ${CONFIG.areaName}`);
    console.log(`  Center: ${CONFIG.centerLat}, ${CONFIG.centerLng}`);
    console.log(`  Radius: ${CONFIG.radiusKm}km`);
    console.log(`  Current: ${CONFIG.timeConfig.currentTime}`);
    console.log(`  Data interval: ${CONFIG.timeConfig.intervalMinutes} minutes`);

    try {
        // Ensure output directory exists
        ensureOutputDirectory();

        // Step 1: Generate static sensor locations
        const sensors = generateStaticSensors();
        saveSensorLocations(sensors);

        // Step 2: Generate current sensor readings
        const currentData = generateCurrentData(sensors);
        saveCSV(currentData, CONFIG.output.files.current);

        // Step 3: Generate current grid data
        const currentGridData = generateGridData(sensors, CONFIG.timeConfig.currentTime, 'current');
        saveGridCSV(currentGridData, CONFIG.output.files.gridCurrent);

        // Step 4: Generate historical sensor data
        const historicalData = generateTimeSeriesData(
            sensors,
            CONFIG.timeConfig.historicalStart,
            CONFIG.timeConfig.historicalEnd,
            'historical'
        );
        saveCSV(historicalData, CONFIG.output.files.historical);

        // Step 5: Generate predicted sensor data
        const predictedData = generateTimeSeriesData(
            sensors,
            CONFIG.timeConfig.predictedStart,
            CONFIG.timeConfig.predictedEnd,
            'predicted'
        );
        saveCSV(predictedData, CONFIG.output.files.predicted);

        // Step 6: Generate summary
        generateDataSummary(currentData, historicalData, predictedData);

        console.log('\n✅ Compatible data generation completed successfully!');
        console.log(`📁 Files saved in: ${CONFIG.output.folder}`);
        console.log('\n📋 Generated Files:');
        console.log(`   ${CONFIG.output.files.current} - Current sensor readings (${currentData.length} records)`);
        console.log(`   ${CONFIG.output.files.gridCurrent} - Current grid data (${currentGridData.length} cells)`);
        console.log(`   ${CONFIG.output.files.historical} - Historical sensor data (${historicalData.length} records)`);
        console.log(`   ${CONFIG.output.files.predicted} - Predicted sensor data (${predictedData.length} records)`);
        console.log(`   ${CONFIG.output.files.sensors} - Sensor location metadata`);

        console.log('\n🎯 Next Steps:');
        console.log('1. Test current_reading.csv with your visualization first');
        console.log('2. Verify sensor data displays correctly on the map');
        console.log('3. Then integrate historical and predicted data later');
        console.log('4. Optional: Use grid_current.csv to enhance your grid system');

    } catch (error) {
        console.error('❌ Error during data generation:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Export for programmatic usage
module.exports = {
    CONFIG,
    main,
    generateStaticSensors,
    generateCurrentData,
    generateTimeSeriesData,
    generateGridData
};

// Run if called directly
if (require.main === module) {
    main();
}