// configuration-examples.js - Different scenarios for data generation

const { setConfiguration, main } = require('./enhanced-data-generator');

// Example 1: Default Anand Vihar Configuration (July 15-23, 2025)
async function generateAnandViharData() {
    console.log('🚀 Generating Anand Vihar data with default settings...');
    await main();
}

// Example 2: Custom date range for different period
async function generateCustomDateRange() {
    console.log('🚀 Generating data for custom date range...');

    setConfiguration({
        timeConfig: {
            // Historical: June 1-7, 2025
            historicalStart: '2025-06-01T00:00:00Z',
            historicalEnd: '2025-06-07T23:59:59Z',

            // Current: June 7, 2025
            currentTime: '2025-06-07T16:30:00Z',

            // Predicted: June 7-10, 2025
            predictedStart: '2025-06-07T17:00:00Z',
            predictedEnd: '2025-06-10T23:59:59Z',

            // More frequent data (every 30 minutes)
            intervalMinutes: 30
        },
        output: {
            folder: './june_data/',
            files: {
                current: 'june_current.csv',
                historical: 'june_historical.csv',
                predicted: 'june_predicted.csv',
                sensors: 'june_sensors.json'
            }
        }
    });

    await main();
}

// Example 3: Different area (Connaught Place)
async function generateConnaughtPlaceData() {
    console.log('🚀 Generating Connaught Place data...');

    setConfiguration({
        areaName: 'Connaught Place',
        centerLat: 28.6315,
        centerLng: 77.2167,
        radiusKm: 2.5,

        // More vehicle sensors for central area
        sensorCounts: {
            construction: 3,
            vehicle: 12,
            dust: 2,
            industrial: 2,
            residential: 6
        },

        output: {
            folder: './connaught_place_data/',
            files: {
                current: 'cp_current.csv',
                historical: 'cp_historical.csv',
                predicted: 'cp_predicted.csv',
                sensors: 'cp_sensors.json'
            }
        }
    });

    await main();
}

// Example 4: High-frequency monitoring scenario
async function generateHighFrequencyData() {
    console.log('🚀 Generating high-frequency monitoring data...');

    setConfiguration({
        timeConfig: {
            // 24 hours of detailed data
            historicalStart: '2025-07-20T00:00:00Z',
            historicalEnd: '2025-07-20T23:59:59Z',

            currentTime: '2025-07-21T00:00:00Z',

            // Next 12 hours prediction
            predictedStart: '2025-07-21T00:15:00Z',
            predictedEnd: '2025-07-21T11:59:59Z',

            // Every 15 minutes for detailed analysis
            intervalMinutes: 15
        },

        // More sensors for detailed coverage
        sensorCounts: {
            construction: 10,
            vehicle: 15,
            dust: 8,
            industrial: 7,
            residential: 5
        },

        output: {
            folder: './high_frequency_data/',
            files: {
                current: 'hf_current.csv',
                historical: 'hf_historical.csv',
                predicted: 'hf_predicted.csv',
                sensors: 'hf_sensors.json'
            }
        }
    });

    await main();
}

// Example 5: Monsoon season scenario (different environmental conditions)
async function generateMonsoonData() {
    console.log('🚀 Generating monsoon season data...');

    setConfiguration({
        timeConfig: {
            historicalStart: '2025-08-15T00:00:00Z',
            historicalEnd: '2025-08-20T23:59:59Z',
            currentTime: '2025-08-20T14:30:00Z',
            predictedStart: '2025-08-20T15:00:00Z',
            predictedEnd: '2025-08-23T23:59:59Z',
            intervalMinutes: 60
        },

        // Monsoon environmental conditions
        environmentalBase: {
            temperature: { min: 26, max: 38, avg: 32 }, // Lower temps due to rain
            humidity: { min: 60, max: 95, avg: 78 },     // High humidity
            windSpeed: { min: 2, max: 12, avg: 6.5 },   // Higher winds
            monsoonFactor: 0.8  // 80% chance of rain effect
        },

        output: {
            folder: './monsoon_data/',
            files: {
                current: 'monsoon_current.csv',
                historical: 'monsoon_historical.csv',
                predicted: 'monsoon_predicted.csv',
                sensors: 'monsoon_sensors.json'
            }
        }
    });

    await main();
}

// Example 6: Winter season scenario
async function generateWinterData() {
    console.log('🚀 Generating winter season data...');

    setConfiguration({
        areaName: 'Anand Vihar Winter',

        timeConfig: {
            historicalStart: '2025-12-15T00:00:00Z',
            historicalEnd: '2025-12-20T23:59:59Z',
            currentTime: '2025-12-20T14:30:00Z',
            predictedStart: '2025-12-20T15:00:00Z',
            predictedEnd: '2025-12-23T23:59:59Z',
            intervalMinutes: 60
        },

        // Winter environmental conditions (higher pollution due to temperature inversion)
        environmentalBase: {
            temperature: { min: 8, max: 22, avg: 15 },   // Cold winter
            humidity: { min: 40, max: 90, avg: 65 },     // Foggy conditions
            windSpeed: { min: 0.5, max: 4, avg: 2 },    // Low wind speeds
            monsoonFactor: 0.02  // Minimal rain
        },

        output: {
            folder: './winter_data/',
            files: {
                current: 'winter_current.csv',
                historical: 'winter_historical.csv',
                predicted: 'winter_predicted.csv',
                sensors: 'winter_sensors.json'
            }
        }
    });

    await main();
}

// Usage function to run different scenarios
async function runScenario(scenario) {
    switch (scenario) {
        case 'default':
        case 'anand-vihar':
            await generateAnandViharData();
            break;
        case 'custom-dates':
            await generateCustomDateRange();
            break;
        case 'connaught-place':
            await generateConnaughtPlaceData();
            break;
        case 'high-frequency':
            await generateHighFrequencyData();
            break;
        case 'monsoon':
            await generateMonsoonData();
            break;
        case 'winter':
            await generateWinterData();
            break;
        default:
            console.log('Available scenarios: default, custom-dates, connaught-place, high-frequency, monsoon, winter');
            console.log('Usage: node configuration-examples.js <scenario>');
            return;
    }
}

// Command line usage
if (require.main === module) {
    const scenario = process.argv[2] || 'default';
    runScenario(scenario).catch(console.error);
}

// Export for programmatic use
module.exports = {
    generateAnandViharData,
    generateCustomDateRange,
    generateConnaughtPlaceData,
    generateHighFrequencyData,
    generateMonsoonData,
    generateWinterData,
    runScenario
};

/* 
USAGE EXAMPLES:

1. Default generation:
   node enhanced-data-generator.js

2. Specific scenario:
   node configuration-examples.js monsoon

3. Programmatic usage:
   const { generateMonsoonData } = require('./configuration-examples');
   await generateMonsoonData();

4. Custom configuration:
   const { setConfiguration, main } = require('./enhanced-data-generator');
   setConfiguration({
     areaName: 'My Area',
     centerLat: 28.7041,
     centerLng: 77.1025,
     timeConfig: {
       historicalStart: '2025-08-01T00:00:00Z',
       historicalEnd: '2025-08-05T23:59:59Z',
       currentTime: '2025-08-05T18:00:00Z',
       predictedStart: '2025-08-05T18:30:00Z',
       predictedEnd: '2025-08-08T23:59:59Z'
     }
   });
   await main();
*/