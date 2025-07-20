// run-generator.js - Simple one-file script to generate Anand Vihar data
// Save this file and run: node run-generator.js

const fs = require('fs');
const path = require('path');

// Quick configuration - easily modifiable
const QUICK_CONFIG = {
    // Area settings (currently Anand Vihar)
    areaName: 'Anand Vihar',
    centerLat: 28.6469,
    centerLng: 77.3154,
    radiusKm: 5.0,

    // How many sensors of each type
    sensorCounts: {
        construction: 6,    // Construction sites
        vehicle: 8,         // Traffic/transport hubs  
        dust: 4,           // Open areas, dust sources
        industrial: 4,     // Small industries
        residential: 3     // Residential areas
    },

    // Output files
    jsonFileName: 'sensor_data.json',
    csvFileName: 'sensor_data.csv',
    outputFolder: './generated_data/'
};

// Sensor templates with realistic data ranges
const SENSOR_TEMPLATES = {
    construction: {
        names: ['Construction Site', 'Metro Construction', 'Building Project', 'Highway Expansion'],
        aqiRange: [150, 250], pm25Range: [80, 160], pm10Range: [150, 350],
        coRange: [1.5, 3.5], no2Range: [40, 85], so2Range: [15, 35]
    },
    vehicle: {
        names: ['Traffic Junction', 'Bus Terminal', 'Highway Monitor', 'Parking Complex'],
        aqiRange: [130, 220], pm25Range: [70, 140], pm10Range: [120, 250],
        coRange: [2.5, 5.5], no2Range: [60, 110], so2Range: [20, 40]
    },
    dust: {
        names: ['Open Ground', 'Vacant Plot', 'Riverbank Area', 'Quarry Site'],
        aqiRange: [160, 280], pm25Range: [90, 200], pm10Range: [200, 450],
        coRange: [0.8, 2.0], no2Range: [25, 55], so2Range: [8, 20]
    },
    industrial: {
        names: ['Industrial Zone', 'Factory Area', 'Manufacturing Hub', 'Processing Plant'],
        aqiRange: [140, 200], pm25Range: [75, 135], pm10Range: [140, 220],
        coRange: [1.8, 4.0], no2Range: [50, 95], so2Range: [25, 60]
    },
    residential: {
        names: ['Residential Area', 'Community Center', 'School Zone', 'Market Area'],
        aqiRange: [100, 160], pm25Range: [50, 90], pm10Range: [90, 150],
        coRange: [1.0, 2.5], no2Range: [35, 65], so2Range: [10, 25]
    }
};

function generateRandomInRange([min, max]) {
    return min + Math.random() * (max - min);
}

function generateCoordinate(center, radiusKm) {
    const radiusDegrees = radiusKm / 111.32; // Approximate conversion
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDegrees;

    const lat = center.lat + (distance * Math.cos(angle));
    const lng = center.lng + (distance * Math.sin(angle) / Math.cos(center.lat * Math.PI / 180));

    return {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6))
    };
}

function generateSensor(sourceType, index) {
    const template = SENSOR_TEMPLATES[sourceType];
    const center = { lat: QUICK_CONFIG.centerLat, lng: QUICK_CONFIG.centerLng };
    const coords = generateCoordinate(center, QUICK_CONFIG.radiusKm);

    // Seasonal factor for July (summer in Delhi)
    const summerFactor = 1.15;
    const variation = 0.85 + Math.random() * 0.3; // ±15% variation

    // Generate pollutant values
    const aqi = Math.round(generateRandomInRange(template.aqiRange) * summerFactor * variation);
    const pm25 = Math.round(generateRandomInRange(template.pm25Range) * summerFactor * variation * 10) / 10;
    const pm10 = Math.round(generateRandomInRange(template.pm10Range) * summerFactor * variation * 10) / 10;
    const co = Math.round(generateRandomInRange(template.coRange) * variation * 100) / 100;
    const no2 = Math.round(generateRandomInRange(template.no2Range) * variation * 10) / 10;
    const so2 = Math.round(generateRandomInRange(template.so2Range) * variation * 10) / 10;

    // Environmental data for July in Delhi
    const temperature = Math.round((32 + Math.random() * 12) * 10) / 10; // 32-44°C
    const humidity = Math.round((35 + Math.random() * 35) * 10) / 10;    // 35-70%
    const windSpeed = Math.round((1.5 + Math.random() * 6) * 10) / 10;   // 1.5-7.5 m/s

    // Calculate severity
    let severity;
    if (aqi <= 100) severity = 'moderate';
    else if (aqi <= 150) severity = 'high';
    else if (aqi <= 300) severity = 'very_high';
    else severity = 'hazardous';

    // Generate station name
    const baseName = template.names[Math.floor(Math.random() * template.names.length)];
    const station = `${baseName} ${String.fromCharCode(65 + index)}`; // A, B, C, etc.

    return {
        id: `sensor_${sourceType}_${String(index + 1).padStart(3, '0')}`,
        station,
        lat: coords.lat,
        lng: coords.lng,
        aqi,
        pm25,
        pm10,
        co,
        no2,
        so2,
        temperature,
        humidity,
        windSpeed,
        source: sourceType,
        severity,
        timestamp: new Date().toISOString(),
        description: `${station} - Monitoring station for ${sourceType} pollution source`,
        area: QUICK_CONFIG.areaName,
        dataQuality: 'generated'
    };
}

function generateAllSensors() {
    console.log(`🚀 Generating sensors for ${QUICK_CONFIG.areaName}...`);
    console.log(`📍 Center: ${QUICK_CONFIG.centerLat}, ${QUICK_CONFIG.centerLng}`);
    console.log(`📏 Coverage: ${QUICK_CONFIG.radiusKm * 2}km diameter`);

    const sensors = [];

    // Generate sensors for each type
    Object.entries(QUICK_CONFIG.sensorCounts).forEach(([sourceType, count]) => {
        console.log(`   Creating ${count} ${sourceType} sensors...`);

        for (let i = 0; i < count; i++) {
            sensors.push(generateSensor(sourceType, i));
        }
    });

    // Sort by ID
    sensors.sort((a, b) => a.id.localeCompare(b.id));

    const totalSensors = sensors.length;
    console.log(`✅ Generated ${totalSensors} sensors total`);

    return sensors;
}

function ensureOutputDir() {
    if (!fs.existsSync(QUICK_CONFIG.outputFolder)) {
        fs.mkdirSync(QUICK_CONFIG.outputFolder, { recursive: true });
        console.log(`📁 Created output directory: ${QUICK_CONFIG.outputFolder}`);
    }
}

function saveJSONFile(sensors) {
    const jsonPath = path.join(QUICK_CONFIG.outputFolder, QUICK_CONFIG.jsonFileName);

    // Simple format - just the sensors array
    const jsonContent = JSON.stringify(sensors, null, 2);

    fs.writeFileSync(jsonPath, jsonContent, 'utf8');
    const sizeKB = (fs.statSync(jsonPath).size / 1024).toFixed(1);
    console.log(`💾 Saved JSON: ${jsonPath} (${sizeKB} KB)`);
}

function saveCSVFile(sensors) {
    const csvPath = path.join(QUICK_CONFIG.outputFolder, QUICK_CONFIG.csvFileName);

    // CSV headers
    const headers = [
        'id', 'station', 'lat', 'lng', 'aqi', 'pm25', 'pm10', 'co', 'no2', 'so2',
        'temperature', 'humidity', 'windSpeed', 'source', 'severity', 'timestamp', 'description'
    ];

    // Build CSV content
    let csvContent = headers.join(',') + '\n';

    sensors.forEach(sensor => {
        const row = headers.map(header => {
            let value = sensor[header];
            // Escape description field
            if (header === 'description' && typeof value === 'string') {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvContent += row.join(',') + '\n';
    });

    fs.writeFileSync(csvPath, csvContent, 'utf8');
    const sizeKB = (fs.statSync(csvPath).size / 1024).toFixed(1);
    console.log(`💾 Saved CSV: ${csvPath} (${sizeKB} KB)`);
}

function generateSummary(sensors) {
    // Calculate statistics
    const sourceStats = {};
    let totalAQI = 0;
    let minAQI = Infinity;
    let maxAQI = -Infinity;

    sensors.forEach(sensor => {
        sourceStats[sensor.source] = (sourceStats[sensor.source] || 0) + 1;
        totalAQI += sensor.aqi;
        minAQI = Math.min(minAQI, sensor.aqi);
        maxAQI = Math.max(maxAQI, sensor.aqi);
    });

    const avgAQI = Math.round(totalAQI / sensors.length);

    console.log('\n📊 Generation Summary:');
    console.log(`   Area: ${QUICK_CONFIG.areaName}`);
    console.log(`   Total Sensors: ${sensors.length}`);
    console.log(`   AQI Range: ${minAQI} - ${maxAQI} (avg: ${avgAQI})`);
    console.log('   Source Distribution:');
    Object.entries(sourceStats).forEach(([source, count]) => {
        console.log(`     ${source}: ${count} sensors`);
    });

    return { sourceStats, minAQI, maxAQI, avgAQI };
}

// Main execution
async function main() {
    console.log('\n🌍 Quick AQI Data Generator');
    console.log('============================');

    try {
        // Create output directory
        ensureOutputDir();

        // Generate sensors
        const sensors = generateAllSensors();

        // Save files
        saveJSONFile(sensors);
        saveCSVFile(sensors);

        // Show summary
        generateSummary(sensors);

        console.log('\n✅ Data generation completed!');
        console.log(`📁 Files saved in: ${QUICK_CONFIG.outputFolder}`);
        console.log('\n📋 Next Steps:');
        console.log('1. Copy the generated files to your React app');
        console.log('2. Update your app configuration to use these files');
        console.log('3. The system will auto-generate time series for July 15-20, 2025');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Configuration examples for other areas (uncomment to use):

/*
// For Connaught Place
QUICK_CONFIG.areaName = 'Connaught Place';
QUICK_CONFIG.centerLat = 28.6315;
QUICK_CONFIG.centerLng = 77.2167;
QUICK_CONFIG.radiusKm = 2.5;
QUICK_CONFIG.sensorCounts.vehicle = 10; // More traffic focus
QUICK_CONFIG.jsonFileName = 'connaught_place_sensors.json';
QUICK_CONFIG.csvFileName = 'connaught_place_sensors.csv';
*/

/*
// For Gurgaon Cyber City  
QUICK_CONFIG.areaName = 'Gurgaon Cyber City';
QUICK_CONFIG.centerLat = 28.4595;
QUICK_CONFIG.centerLng = 77.0266;
QUICK_CONFIG.radiusKm = 4.0;
QUICK_CONFIG.sensorCounts.construction = 8; // More construction
QUICK_CONFIG.jsonFileName = 'gurgaon_sensors.json';
QUICK_CONFIG.csvFileName = 'gurgaon_sensors.csv';
*/

// Run the generator
if (require.main === module) {
    main();
}   