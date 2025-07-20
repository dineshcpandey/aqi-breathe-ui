// enhanced-data-generator.js - Generate time series AQI data for multiple scenarios
// Save this file and run: node enhanced-data-generator.js

const fs = require('fs');
const path = require('path');

// Enhanced Configuration - easily modifiable
const CONFIG = {
    // Area settings
    areaName: 'Anand Vihar',
    centerLat: 28.6469,
    centerLng: 77.3154,
    radiusKm: 5.0,

    // Sensor counts by type
    sensorCounts: {
        construction: 6,
        vehicle: 8,
        dust: 4,
        industrial: 4,
        residential: 3
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

    // Output configuration
    output: {
        folder: './generated_data/',
        files: {
            current: 'current_reading.csv',
            historical: 'historical_reading.csv',
            predicted: 'predicted_reading.csv',
            sensors: 'sensor_locations.json'  // Static sensor info
        }
    },

    // Weather and seasonal factors for July 2025 (Delhi summer)
    environmentalBase: {
        temperature: { min: 32, max: 44, avg: 38 },
        humidity: { min: 25, max: 75, avg: 45 },
        windSpeed: { min: 1.5, max: 8.5, avg: 4.2 },
        // Monsoon probability (increases towards end of July)
        monsoonFactor: 0.15
    }
};

// Enhanced sensor templates with time-based variations
const SENSOR_TEMPLATES = {
    construction: {
        names: ['Construction Site', 'Metro Construction', 'Building Project', 'Highway Expansion'],
        baseValues: {
            aqi: [150, 250], pm25: [80, 160], pm10: [150, 350],
            co: [1.5, 3.5], no2: [40, 85], so2: [15, 35]
        },
        dailyPattern: {
            // Work hours have higher pollution
            peakHours: [9, 10, 11, 14, 15, 16, 17],
            peakMultiplier: 1.8,
            nightMultiplier: 0.3
        },
        weekendReduction: 0.4, // 60% reduction on weekends
        trendFactor: 0.02 // Slight increase over time due to ongoing work
    },
    vehicle: {
        names: ['Traffic Junction', 'Bus Terminal', 'Highway Monitor', 'Parking Complex'],
        baseValues: {
            aqi: [130, 220], pm25: [70, 140], pm10: [120, 250],
            co: [2.5, 5.5], no2: [60, 110], so2: [20, 40]
        },
        dailyPattern: {
            peakHours: [7, 8, 9, 17, 18, 19, 20],
            peakMultiplier: 1.9,
            nightMultiplier: 0.5
        },
        weekendReduction: 0.25, // 25% reduction on weekends
        trendFactor: 0.01
    },
    dust: {
        names: ['Open Ground', 'Vacant Plot', 'Riverbank Area', 'Quarry Site'],
        baseValues: {
            aqi: [160, 280], pm25: [90, 200], pm10: [200, 450],
            co: [0.8, 2.0], no2: [25, 55], so2: [8, 20]
        },
        dailyPattern: {
            peakHours: [12, 13, 14, 15, 16], // Afternoon winds
            peakMultiplier: 2.2,
            nightMultiplier: 0.6
        },
        weekendReduction: 0.1, // Minimal weekend change
        trendFactor: -0.005 // Slight decrease due to some dust control measures
    },
    industrial: {
        names: ['Industrial Zone', 'Factory Area', 'Manufacturing Hub', 'Processing Plant'],
        baseValues: {
            aqi: [140, 200], pm25: [75, 135], pm10: [140, 220],
            co: [1.8, 4.0], no2: [50, 95], so2: [25, 60]
        },
        dailyPattern: {
            peakHours: [9, 10, 11, 14, 15, 16, 17],
            peakMultiplier: 1.6,
            nightMultiplier: 0.7
        },
        weekendReduction: 0.3,
        trendFactor: 0.005
    },
    residential: {
        names: ['Residential Area', 'Community Center', 'School Zone', 'Market Area'],
        baseValues: {
            aqi: [100, 160], pm25: [50, 90], pm10: [90, 150],
            co: [1.0, 2.5], no2: [35, 65], so2: [10, 25]
        },
        dailyPattern: {
            peakHours: [6, 7, 8, 18, 19, 20], // Cooking times
            peakMultiplier: 1.4,
            nightMultiplier: 0.8
        },
        weekendReduction: 0.05,
        trendFactor: 0.003
    }
};

// Utility functions
function generateRandomInRange([min, max]) {
    return min + Math.random() * (max - min);
}

function generateCoordinate(center, radiusKm) {
    const radiusDegrees = radiusKm / 111.32;
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDegrees;

    const lat = center.lat + (distance * Math.cos(angle));
    const lng = center.lng + (distance * Math.sin(angle) / Math.cos(center.lat * Math.PI / 180));

    return {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6))
    };
}

function calculateSeverity(aqi) {
    if (aqi <= 100) return 'moderate';
    else if (aqi <= 150) return 'high';
    else if (aqi <= 300) return 'very_high';
    else return 'hazardous';
}

function getTimeBasedMultiplier(datetime, template, dataType = 'historical') {
    const hour = datetime.getHours();
    const dayOfWeek = datetime.getDay(); // 0 = Sunday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let multiplier = 1.0;

    // Apply daily pattern
    if (template.dailyPattern.peakHours.includes(hour)) {
        multiplier = template.dailyPattern.peakMultiplier;
    } else if (hour >= 0 && hour <= 5) {
        multiplier = template.dailyPattern.nightMultiplier;
    }

    // Apply weekend reduction
    if (isWeekend) {
        multiplier *= (1 - template.weekendReduction);
    }

    // Add prediction uncertainty for future data
    if (dataType === 'predicted') {
        const uncertaintyFactor = 0.85 + Math.random() * 0.3; // ±15% uncertainty
        multiplier *= uncertaintyFactor;
    }

    return multiplier;
}

function generateEnvironmentalData(datetime, dataType = 'historical') {
    const hour = datetime.getHours();
    const base = CONFIG.environmentalBase;

    // Temperature varies by hour and season
    let temperature = base.avg + Math.sin((hour - 6) * Math.PI / 12) * 6; // Peak at 2 PM
    temperature += (Math.random() - 0.5) * 4; // Random variation
    temperature = Math.max(base.min, Math.min(base.max, temperature));

    // Humidity inversely related to temperature
    let humidity = base.avg + (base.avg - temperature) * 1.2;
    humidity += (Math.random() - 0.5) * 20;
    humidity = Math.max(base.min, Math.min(base.max, humidity));

    // Wind speed varies with time of day
    let windSpeed = base.avg + Math.sin((hour - 12) * Math.PI / 12) * 2;
    windSpeed += (Math.random() - 0.5) * 3;
    windSpeed = Math.max(base.min, Math.min(base.max, windSpeed));

    // Add prediction uncertainty
    if (dataType === 'predicted') {
        const uncertainty = 0.9 + Math.random() * 0.2;
        temperature *= uncertainty;
        humidity *= (0.95 + Math.random() * 0.1);
        windSpeed *= uncertainty;
    }

    return {
        temperature: Math.round(temperature * 10) / 10,
        humidity: Math.round(humidity * 10) / 10,
        windSpeed: Math.round(windSpeed * 10) / 10
    };
}

function generateDescription(sensor) {
    const descriptions = {
        construction: [
            "Active construction site with concrete mixing",
            "Metro construction with heavy machinery",
            "Building project with dust and emissions",
            "Highway expansion with earthmoving equipment"
        ],
        vehicle: [
            "Major bus terminal with heavy traffic congestion",
            "Traffic junction with high vehicle density",
            "Highway monitoring point with diesel emissions",
            "Parking complex with vehicle idling"
        ],
        dust: [
            "Open area with loose soil and construction debris",
            "Vacant plot with exposed earth",
            "Riverbank area with dust storms",
            "Quarry site with crushing operations"
        ],
        industrial: [
            "Industrial zone with manufacturing emissions",
            "Factory area with processing activities",
            "Manufacturing hub with chemical processes",
            "Processing plant with stack emissions"
        ],
        residential: [
            "Residential area with cooking and heating",
            "Community center with local emissions",
            "Housing complex with domestic activities",
            "Neighborhood with mixed residential sources"
        ]
    };

    const sourceDescriptions = descriptions[sensor.source] || descriptions.residential;
    const randomDesc = sourceDescriptions[Math.floor(Math.random() * sourceDescriptions.length)];

    return `${sensor.station} - ${randomDesc}`;
}

function generateSensorReading(sensor, datetime, dataType = 'historical') {
    const template = SENSOR_TEMPLATES[sensor.source];
    const timeMultiplier = getTimeBasedMultiplier(datetime, template, dataType);
    const environmental = generateEnvironmentalData(datetime, dataType);

    // Apply trend factor based on days elapsed
    const referenceDate = new Date('2025-07-15T00:00:00Z');
    const daysElapsed = (datetime - referenceDate) / (1000 * 60 * 60 * 24);
    const trendMultiplier = 1 + (template.trendFactor * daysElapsed);

    // Weather impact (rain reduces particulates)
    const isRainy = Math.random() < CONFIG.environmentalBase.monsoonFactor;
    const weatherMultiplier = isRainy ? 0.7 : 1.0;

    // Generate pollutant values
    const readings = {};
    Object.entries(template.baseValues).forEach(([pollutant, range]) => {
        const baseValue = generateRandomInRange(range);
        let value = baseValue * timeMultiplier * trendMultiplier * weatherMultiplier;

        // Add measurement noise
        const noise = 0.95 + Math.random() * 0.1;
        value *= noise;

        // Round appropriately
        readings[pollutant] = pollutant.includes('co') ?
            Math.round(value * 100) / 100 :
            Math.round(value * 10) / 10;
    });

    return {
        id: sensor.id,                    // Changed from sensor_id
        station: sensor.station,
        lat: sensor.lat,                  // Changed from latitude  
        lng: sensor.lng,                  // Changed from longitude
        timestamp: datetime.toISOString(),
        aqi: Math.round(readings.aqi),
        pm25: readings.pm25,
        pm10: readings.pm10,
        co: readings.co,
        no2: readings.no2,
        so2: readings.so2,
        temperature: environmental.temperature,
        rh: environmental.humidity,       // Changed from humidity
        windSpeed: environmental.windSpeed, // Changed from wind_speed  
        source: sensor.source,            // Changed from source_type
        severity: calculateSeverity(Math.round(readings.aqi)),
        description: generateDescription(sensor) // NEW: Add description
    };
}

function generateStaticSensors() {
    console.log(`🚀 Generating sensor locations for ${CONFIG.areaName}...`);

    const sensors = [];
    const center = { lat: CONFIG.centerLat, lng: CONFIG.centerLng };

    Object.entries(CONFIG.sensorCounts).forEach(([sourceType, count]) => {
        console.log(`   Creating ${count} ${sourceType} sensors...`);

        for (let i = 0; i < count; i++) {
            const template = SENSOR_TEMPLATES[sourceType];
            const coords = generateCoordinate(center, CONFIG.radiusKm);
            const baseName = template.names[Math.floor(Math.random() * template.names.length)];
            const station = `${baseName} ${String.fromCharCode(65 + i)}`;

            sensors.push({
                id: `sensor_${sourceType}_${String(i + 1).padStart(3, '0')}`,
                station,
                lat: coords.lat,
                lng: coords.lng,
                source: sourceType,
                area: CONFIG.areaName,
                description: `${station} - Monitoring station for ${sourceType} pollution source`
            });
        }
    });

    console.log(`✅ Generated ${sensors.length} sensor locations`);
    return sensors;
}

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
            const reading = generateSensorReading(sensor, new Date(currentTime), dataType);
            readings.push(reading);
            totalReadings++;
        });

        currentTime = new Date(currentTime.getTime() + intervalMs);
    }

    console.log(`   Generated ${totalReadings} readings (${readings.length / sensors.length} timestamps per sensor)`);
    return readings;
}

function generateCurrentData(sensors) {
    console.log('📈 Generating current readings...');

    const currentTime = new Date(CONFIG.timeConfig.currentTime);
    const readings = sensors.map(sensor =>
        generateSensorReading(sensor, currentTime, 'current')
    );

    console.log(`   Generated ${readings.length} current readings`);
    return readings;
}

function ensureOutputDirectory() {
    if (!fs.existsSync(CONFIG.output.folder)) {
        fs.mkdirSync(CONFIG.output.folder, { recursive: true });
        console.log(`📁 Created output directory: ${CONFIG.output.folder}`);
    }
}

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
    const sizeKB = (fs.statSync(filepath).size / 1024).toFixed(1);
    console.log(`💾 Saved: ${filepath} (${sizeKB} KB, ${data.length} records)`);
}

function saveSensorLocations(sensors) {
    const filepath = path.join(CONFIG.output.folder, CONFIG.output.files.sensors);
    const sensorData = {
        metadata: {
            area: CONFIG.areaName,
            center: { lat: CONFIG.centerLat, lng: CONFIG.centerLng },
            radius_km: CONFIG.radiusKm,
            total_sensors: sensors.length,
            generated_at: new Date().toISOString(),
            sensor_types: CONFIG.sensorCounts
        },
        sensors: sensors
    };

    fs.writeFileSync(filepath, JSON.stringify(sensorData, null, 2), 'utf8');
    const sizeKB = (fs.statSync(filepath).size / 1024).toFixed(1);
    console.log(`💾 Saved sensor locations: ${filepath} (${sizeKB} KB)`);
}

function generateDataSummary(currentData, historicalData, predictedData) {
    console.log('\n📊 Data Generation Summary:');
    console.log('============================');
    console.log(`Area: ${CONFIG.areaName}`);
    console.log(`Total Sensors: ${CONFIG.sensorCounts.construction + CONFIG.sensorCounts.vehicle + CONFIG.sensorCounts.dust + CONFIG.sensorCounts.industrial + CONFIG.sensorCounts.residential}`);
    console.log(`\nDataset Sizes:`);
    console.log(`  Current readings: ${currentData.length} records`);
    console.log(`  Historical readings: ${historicalData.length} records`);
    console.log(`  Predicted readings: ${predictedData.length} records`);
    console.log(`  Total readings: ${currentData.length + historicalData.length + predictedData.length} records`);

    // Calculate AQI statistics for current data
    const aqiValues = currentData.map(r => r.aqi);
    const avgAQI = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
    const minAQI = Math.min(...aqiValues);
    const maxAQI = Math.max(...aqiValues);

    console.log(`\nCurrent AQI Stats:`);
    console.log(`  Range: ${minAQI} - ${maxAQI}`);
    console.log(`  Average: ${avgAQI}`);

    // Source distribution
    const sourceStats = {};
    currentData.forEach(reading => {
        // sourceStats[reading.source_type] = (sourceStats[reading.source_type] || 0) + 1;
        sourceStats[reading.source] = (sourceStats[reading.source] || 0) + 1;
    });

    console.log(`\nSource Distribution:`);
    Object.entries(sourceStats).forEach(([source, count]) => {
        console.log(`  ${source}: ${count} sensors`);
    });
}

// Main execution function
async function main() {
    console.log('\n🌍 Enhanced AQI Time Series Data Generator');
    console.log('===========================================');
    console.log(`Configuration:`);
    console.log(`  Area: ${CONFIG.areaName}`);
    console.log(`  Historical: ${CONFIG.timeConfig.historicalStart} to ${CONFIG.timeConfig.historicalEnd}`);
    console.log(`  Current: ${CONFIG.timeConfig.currentTime}`);
    console.log(`  Predicted: ${CONFIG.timeConfig.predictedStart} to ${CONFIG.timeConfig.predictedEnd}`);
    console.log(`  Data interval: ${CONFIG.timeConfig.intervalMinutes} minutes`);

    try {
        // Ensure output directory exists
        ensureOutputDirectory();

        // Step 1: Generate static sensor locations
        const sensors = generateStaticSensors();
        saveSensorLocations(sensors);

        // Step 2: Generate current readings
        const currentData = generateCurrentData(sensors);
        saveCSV(currentData, CONFIG.output.files.current);

        // Step 3: Generate historical data
        const historicalData = generateTimeSeriesData(
            sensors,
            CONFIG.timeConfig.historicalStart,
            CONFIG.timeConfig.historicalEnd,
            'historical'
        );
        saveCSV(historicalData, CONFIG.output.files.historical);

        // Step 4: Generate predicted data
        const predictedData = generateTimeSeriesData(
            sensors,
            CONFIG.timeConfig.predictedStart,
            CONFIG.timeConfig.predictedEnd,
            'predicted'
        );
        saveCSV(predictedData, CONFIG.output.files.predicted);

        // Step 5: Generate summary
        generateDataSummary(currentData, historicalData, predictedData);

        console.log('\n✅ Enhanced data generation completed successfully!');
        console.log(`📁 Files saved in: ${CONFIG.output.folder}`);
        console.log('\n📋 Generated Files:');
        console.log(`  ${CONFIG.output.files.current} - Latest sensor readings`);
        console.log(`  ${CONFIG.output.files.historical} - Historical time series (July 15-20)`);
        console.log(`  ${CONFIG.output.files.predicted} - Predicted time series (July 20-23)`);
        console.log(`  ${CONFIG.output.files.sensors} - Static sensor location data`);

        console.log('\n🎯 Next Steps:');
        console.log('1. Import these CSV files into your GIS dashboard');
        console.log('2. Use current_reading.csv for real-time display');
        console.log('3. Use historical_reading.csv for trend analysis');
        console.log('4. Use predicted_reading.csv for forecasting views');
        console.log('5. Use sensor_locations.json for sensor metadata');

    } catch (error) {
        console.error('❌ Error during data generation:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Allow easy configuration modification for different scenarios
function setConfiguration(customConfig) {
    Object.assign(CONFIG, customConfig);
    console.log('✅ Configuration updated');
}

// Export for programmatic usage
module.exports = {
    CONFIG,
    setConfiguration,
    main,
    generateStaticSensors,
    generateTimeSeriesData,
    generateCurrentData
};

// Run if called directly
if (require.main === module) {
    main();
}