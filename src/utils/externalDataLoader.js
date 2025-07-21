// src/utils/externalDataLoader.js - FIXED VERSION (Safe API handling)
import Papa from 'papaparse';

class ExternalDataLoader {
    constructor() {
        this.cache = new Map();
    }

    /**
     * 🔧 FIXED: Load sensor data from CSV with safe API checking
     */
    async loadSensorDataFromCSV(filePath) {
        try {
            console.log(`📂 SAFE External: Attempting to load sensor data from ${filePath}`);

            // Check what APIs are available
            console.log('🔍 SAFE External: API availability check:');
            console.log('  window exists:', typeof window !== 'undefined');
            console.log('  window.fs exists:', typeof window !== 'undefined' && !!window.fs);
            console.log('  window.fs.readFile exists:', typeof window !== 'undefined' && window.fs && typeof window.fs.readFile === 'function');
            console.log('  fetch available:', typeof fetch !== 'undefined');

            let csvContent = '';

            // Method 1: Try window.fs with proper null checking
            if (typeof window !== 'undefined' &&
                window.fs &&
                typeof window.fs.readFile === 'function') {

                console.log('📂 SAFE External: Using window.fs API');
                try {
                    csvContent = await window.fs.readFile(filePath, { encoding: 'utf8' });
                    console.log(`✅ SAFE External: Loaded via window.fs, size: ${csvContent.length} chars`);
                } catch (fsError) {
                    console.warn('⚠️ SAFE External: window.fs failed:', fsError.message);
                    throw fsError;
                }
            }
            // Method 2: Try fetch API  
            else if (typeof fetch === 'function') {
                console.log('📂 SAFE External: Using fetch API');
                const response = await fetch(`/${filePath}`);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                csvContent = await response.text();
                console.log(`✅ SAFE External: Loaded via fetch, size: ${csvContent.length} chars`);
            }
            // No methods available
            else {
                throw new Error('No file loading methods available (neither window.fs nor fetch)');
            }

            // Validate content
            if (!csvContent || csvContent.length < 10) {
                throw new Error(`Invalid or empty CSV content (${csvContent.length} chars)`);
            }

            // Parse CSV safely
            const sensorData = await this.parseCSVSafely(csvContent, filePath);

            console.log(`✅ SAFE External: Successfully loaded ${sensorData.length} sensors from ${filePath}`);
            return sensorData;

        } catch (error) {
            console.error(`❌ SAFE External: Failed to load CSV data from ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * 🔧 SAFE: Parse CSV with proper error handling
     */
    async parseCSVSafely(csvContent, filePath) {
        return new Promise((resolve, reject) => {
            console.log(`📊 SAFE External: Parsing CSV content for ${filePath}...`);

            Papa.parse(csvContent, {
                header: true,
                dynamicTyping: false,
                skipEmptyLines: true,
                delimitersToGuess: [',', '\t', '|', ';'],
                complete: (results) => {
                    try {
                        // Safe access to results
                        if (!results) {
                            throw new Error('No results object returned from Papa Parse');
                        }

                        if (!results.data || !Array.isArray(results.data)) {
                            throw new Error('Invalid data structure in Papa Parse results');
                        }

                        const rawData = results.data;
                        console.log(`📊 SAFE External: Parsed ${rawData.length} rows from ${filePath}`);

                        // Show parsing warnings
                        if (results.errors && results.errors.length > 0) {
                            console.warn(`⚠️ SAFE External: Parse warnings for ${filePath}:`, results.errors.slice(0, 3));
                        }

                        // Process sensor data
                        const processedSensors = this.processSensorRows(rawData);
                        resolve(processedSensors);

                    } catch (error) {
                        console.error(`❌ SAFE External: Error processing Papa Parse results:`, error);
                        reject(error);
                    }
                },
                error: (error) => {
                    console.error(`❌ SAFE External: Papa Parse error:`, error);
                    reject(new Error(`Papa Parse failed: ${error.message || error}`));
                }
            });
        });
    }

    /**
     * Process sensor rows with validation
     */
    processSensorRows(rawData) {
        if (!rawData || rawData.length === 0) {
            console.warn('⚠️ SAFE External: No raw sensor data to process');
            return [];
        }

        console.log(`🔄 SAFE External: Processing ${rawData.length} sensor rows...`);

        let validCount = 0;
        const processedSensors = rawData.map((row, index) => {
            try {
                // Validate row structure
                if (!row || typeof row !== 'object') {
                    if (index < 3) console.warn(`⚠️ SAFE External: Invalid row ${index}:`, row);
                    return null;
                }

                // Parse coordinates with multiple possible column names
                const lat = this.parseFloatSafe(row.lat || row.latitude || row.Lat || row.Latitude);
                const lng = this.parseFloatSafe(row.lng || row.longitude || row.Lng || row.Longitude);

                // Validate coordinates
                if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                    if (index < 3) {
                        console.warn(`⚠️ SAFE External: Invalid coordinates in row ${index}:`, {
                            lat: row.lat || row.latitude,
                            lng: row.lng || row.longitude,
                            parsed: { lat, lng }
                        });
                    }
                    return null;
                }

                // Build sensor object
                const sensor = {
                    id: row.id || row.sensor_id || `sensor_${index}`,
                    station: row.station || row.name || row.station_name || `Station ${index + 1}`,
                    lat: lat,
                    lng: lng,

                    // Pollutant readings with multiple possible column names
                    aqi: this.parseFloatSafe(row.aqi || row.AQI || row.air_quality_index),
                    pm25: this.parseFloatSafe(row.pm25 || row.PM25 || row['PM2.5'] || row.pm2_5),
                    pm10: this.parseFloatSafe(row.pm10 || row.PM10),
                    co: this.parseFloatSafe(row.co || row.CO || row.carbon_monoxide),
                    no2: this.parseFloatSafe(row.no2 || row.NO2 || row.nitrogen_dioxide),
                    so2: this.parseFloatSafe(row.so2 || row.SO2 || row.sulfur_dioxide),

                    // Environmental data
                    temperature: this.parseFloatSafe(row.temperature || row.temp || row.Temperature, 25),
                    humidity: this.parseFloatSafe(row.humidity || row.rh || row.relative_humidity, 50),
                    windSpeed: this.parseFloatSafe(row.windSpeed || row.wind_speed || row.WindSpeed, 2),

                    // Additional properties
                    source: row.source || this.determineSourceFromName(row.station || row.name || ''),
                    severity: row.severity || this.calculateSeverity(this.parseFloatSafe(row.aqi || row.AQI)),
                    description: row.description || `${row.station || row.name || 'Unknown'} monitoring station`,
                    timestamp: row.timestamp || row.last_updated || new Date().toISOString(),

                    // Metadata
                    dataQuality: row.data_quality || 'csv_external',
                    dataSource: 'external_csv'
                };

                validCount++;
                return sensor;

            } catch (error) {
                if (index < 3) {
                    console.warn(`⚠️ SAFE External: Error processing sensor row ${index}:`, error.message);
                }
                return null;
            }
        }).filter(sensor => sensor !== null);

        console.log(`✅ SAFE External: Processed ${validCount}/${rawData.length} valid sensors`);

        if (processedSensors.length > 0) {
            console.log(`🔍 SAFE External: Sample sensor:`, processedSensors[0]);
        }

        return processedSensors;
    }

    /**
     * Determine source from station name
     */
    determineSourceFromName(name) {
        const nameLower = name.toLowerCase();
        if (nameLower.includes('construction') || nameLower.includes('building')) return 'construction';
        if (nameLower.includes('traffic') || nameLower.includes('vehicle') || nameLower.includes('road')) return 'vehicle';
        if (nameLower.includes('dust') || nameLower.includes('open')) return 'dust';
        if (nameLower.includes('industrial') || nameLower.includes('factory')) return 'industrial';
        return 'mixed';
    }

    /**
     * Calculate severity from AQI
     */
    calculateSeverity(aqi) {
        if (aqi <= 50) return 'good';
        if (aqi <= 100) return 'moderate';
        if (aqi <= 150) return 'unhealthy_sensitive';
        if (aqi <= 200) return 'unhealthy';
        if (aqi <= 300) return 'very_unhealthy';
        return 'hazardous';
    }

    /**
     * Safe float parsing with fallback
     */
    parseFloatSafe(value, fallback = 0) {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? fallback : parsed;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 SAFE External: Cache cleared');
    }
}

// Export singleton instance
const externalDataLoader = new ExternalDataLoader();
export default externalDataLoader;