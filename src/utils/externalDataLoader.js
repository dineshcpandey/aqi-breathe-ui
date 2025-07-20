// src/utils/externalDataLoader.js
import Papa from 'papaparse';

export class ExternalDataLoader {
    constructor() {
        this.cache = new Map();
        this.timeSeriesCache = new Map();
    }

    /**
     * Load sensor data from external JSON file
     */
    async loadSensorDataFromJSON(filename) {
        try {
            console.log(`Loading sensor data from: ${filename}`);

            const fileContent = await window.fs.readFile(filename, { encoding: 'utf8' });
            const data = JSON.parse(fileContent);

            // Validate and transform data
            const transformedData = this.transformSensorData(data);

            // Cache the data
            this.cache.set(filename, {
                data: transformedData,
                timestamp: Date.now(),
                type: 'json'
            });

            console.log(`Loaded ${transformedData.length} sensor stations from JSON`);
            return transformedData;

        } catch (error) {
            console.error(`Failed to load JSON data from ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Load sensor data from external CSV file
     */
    async loadSensorDataFromCSV(filename) {
        try {
            console.log(`Loading sensor data from: ${filename}`);

            const fileContent = await window.fs.readFile(filename, { encoding: 'utf8' });

            return new Promise((resolve, reject) => {
                Papa.parse(fileContent, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    delimitersToGuess: [',', '\t', '|', ';'],
                    complete: (results) => {
                        try {
                            if (results.errors.length > 0) {
                                console.warn('CSV parsing warnings:', results.errors);
                            }

                            const transformedData = this.transformSensorData(results.data);

                            // Cache the data
                            this.cache.set(filename, {
                                data: transformedData,
                                timestamp: Date.now(),
                                type: 'csv'
                            });

                            console.log(`Loaded ${transformedData.length} sensor stations from CSV`);
                            resolve(transformedData);

                        } catch (error) {
                            reject(error);
                        }
                    },
                    error: (error) => {
                        reject(error);
                    }
                });
            });

        } catch (error) {
            console.error(`Failed to load CSV data from ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Transform and validate sensor data to match expected format
     */
    transformSensorData(rawData) {
        if (!Array.isArray(rawData)) {
            throw new Error('Expected array of sensor data');
        }

        return rawData.map((sensor, index) => {
            // Handle different field name variations
            const transformedSensor = {
                id: sensor.id || sensor.station_id || sensor.sensorId || `sensor_${index}`,
                lat: this.parseFloat(sensor.lat || sensor.latitude || sensor.Latitude),
                lng: this.parseFloat(sensor.lng || sensor.longitude || sensor.Longitude),
                station: sensor.station || sensor.station_name || sensor.name || sensor.Station || `Station ${index + 1}`,

                // Pollutant readings
                aqi: this.parseFloat(sensor.aqi || sensor.AQI || 0),
                pm25: this.parseFloat(sensor.pm25 || sensor.PM25 || sensor['PM2.5'] || 0),
                pm10: this.parseFloat(sensor.pm10 || sensor.PM10 || 0),
                co: this.parseFloat(sensor.co || sensor.CO || 0),
                no2: this.parseFloat(sensor.no2 || sensor.NO2 || 0),
                so2: this.parseFloat(sensor.so2 || sensor.SO2 || 0),

                // Environmental data
                rh: this.parseFloat(sensor.rh || sensor.humidity || sensor.Humidity || 45),
                temperature: this.parseFloat(sensor.temperature || sensor.temp || sensor.Temperature || 25),
                windSpeed: this.parseFloat(sensor.windSpeed || sensor.wind_speed || sensor.WindSpeed || 2),

                // Metadata
                source: this.determineSource(sensor),
                severity: this.calculateSeverity(sensor.aqi || 0),
                timestamp: sensor.timestamp || new Date().toISOString(),
                description: sensor.description || `${sensor.station || 'Unknown'} monitoring station`
            };

            // Validate required fields
            if (isNaN(transformedSensor.lat) || isNaN(transformedSensor.lng)) {
                console.warn(`Invalid coordinates for sensor ${index}:`, sensor);
                return null;
            }

            return transformedSensor;
        }).filter(sensor => sensor !== null);
    }

    /**
     * Generate time series data for specific date range (July 15-20, 2025)
     * with 15-minute intervals
     */
    generateTimeSeriesData(baseSensorData, startDate = '2025-07-15', endDate = '2025-07-20') {
        const cacheKey = `timeseries_${startDate}_${endDate}_15min`;

        if (this.timeSeriesCache.has(cacheKey)) {
            console.log('Returning cached time series data');
            return this.timeSeriesCache.get(cacheKey);
        }

        console.log(`Generating time series data from ${startDate} to ${endDate} (15-min intervals)`);

        const start = new Date(`${startDate}T00:00:00Z`);
        const end = new Date(`${endDate}T23:59:59Z`);
        const intervalMinutes = 15;
        const intervalMs = intervalMinutes * 60 * 1000;

        const timeSeriesData = baseSensorData.map(sensor => {
            const sensorTimeSeries = [];

            for (let currentTime = start.getTime(); currentTime <= end.getTime(); currentTime += intervalMs) {
                const timestamp = new Date(currentTime);
                const hour = timestamp.getUTCHours();
                const dayOfWeek = timestamp.getUTCDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                // Generate realistic variations based on time patterns
                const timeBasedMultiplier = this.getTimeBasedMultiplier(hour, isWeekend);
                const randomVariation = 0.85 + Math.random() * 0.3; // ±15% random variation
                const seasonalFactor = this.getSeasonalFactor(timestamp); // July summer factor

                // Apply realistic patterns to each pollutant
                const dataPoint = {
                    timestamp: timestamp.toISOString(),
                    hour,
                    dayOfWeek,

                    // Core pollutants with realistic variations
                    aqi: Math.max(0, Math.round(sensor.aqi * timeBasedMultiplier * randomVariation * seasonalFactor)),
                    pm25: Math.max(0, Math.round((sensor.pm25 * timeBasedMultiplier * randomVariation * seasonalFactor) * 100) / 100),
                    pm10: Math.max(0, Math.round((sensor.pm10 * timeBasedMultiplier * randomVariation * seasonalFactor) * 100) / 100),
                    co: Math.max(0, Math.round((sensor.co * timeBasedMultiplier * randomVariation) * 100) / 100),
                    no2: Math.max(0, Math.round((sensor.no2 * timeBasedMultiplier * randomVariation) * 100) / 100),
                    so2: Math.max(0, Math.round((sensor.so2 * timeBasedMultiplier * randomVariation) * 100) / 100),

                    // Environmental factors
                    rh: Math.max(0, Math.min(100, Math.round((sensor.rh + this.getHumidityVariation(hour, seasonalFactor)) * 100) / 100)),
                    temperature: Math.round((sensor.temperature + this.getTemperatureVariation(hour, seasonalFactor)) * 100) / 100,
                    windSpeed: Math.max(0, Math.round((sensor.windSpeed * (0.7 + Math.random() * 0.6)) * 100) / 100),

                    // Metadata
                    source: sensor.source,
                    severity: null, // Will be calculated below
                    dataQuality: 'generated'
                };

                // Calculate severity based on generated AQI
                dataPoint.severity = this.calculateSeverity(dataPoint.aqi);

                sensorTimeSeries.push(dataPoint);
            }

            return {
                ...sensor,
                timeSeries: sensorTimeSeries,
                timeSeriesGenerated: true,
                timeSeriesStart: start.toISOString(),
                timeSeriesEnd: end.toISOString(),
                timeSeriesInterval: `${intervalMinutes}min`,
                totalDataPoints: sensorTimeSeries.length
            };
        });

        // Cache the generated time series
        this.timeSeriesCache.set(cacheKey, timeSeriesData);

        console.log(`Generated time series for ${timeSeriesData.length} sensors with ${timeSeriesData[0]?.timeSeries?.length || 0} data points each`);

        return timeSeriesData;
    }

    /**
     * Get time-based multiplier for realistic pollution patterns
     */
    getTimeBasedMultiplier(hour, isWeekend) {
        // Rush hour peaks (higher pollution)
        if (!isWeekend) {
            if (hour >= 7 && hour <= 10) return 1.4; // Morning rush
            if (hour >= 17 && hour <= 20) return 1.5; // Evening rush
            if (hour >= 11 && hour <= 16) return 1.1; // Daytime activity
        } else {
            // Weekend patterns (less traffic pollution)
            if (hour >= 10 && hour <= 16) return 1.2; // Daytime activity
            if (hour >= 18 && hour <= 21) return 1.3; // Evening social activity
        }

        // Night time (lower pollution)
        if (hour >= 22 || hour <= 6) return 0.6;

        return 1.0; // Base level
    }

    /**
     * Get seasonal factor for July (summer in India)
     */
    getSeasonalFactor(timestamp) {
        const month = timestamp.getUTCMonth(); // 0-based, July = 6
        const day = timestamp.getUTCDate();

        // July in Delhi - hot and humid, dust storms possible
        if (month === 6) { // July
            // Higher pollution due to heat and dust
            if (day <= 20) { // July 15-20
                return 1.1 + Math.random() * 0.2; // 10-30% increase
            }
        }

        return 1.0;
    }

    /**
     * Get humidity variation based on time and season
     */
    getHumidityVariation(hour, seasonalFactor) {
        // Higher humidity during night and early morning
        const baseVariation = hour <= 6 || hour >= 20 ? 10 : -5;
        const seasonalAdjustment = seasonalFactor > 1 ? 15 : 0; // July humidity
        const randomVariation = (Math.random() - 0.5) * 20;

        return baseVariation + seasonalAdjustment + randomVariation;
    }

    /**
     * Get temperature variation based on time and season
     */
    getTemperatureVariation(hour, seasonalFactor) {
        // Temperature curve throughout the day
        const hourMultipliers = {
            0: -8, 1: -10, 2: -12, 3: -12, 4: -10, 5: -8,  // Night cooling
            6: -5, 7: -2, 8: 2, 9: 5, 10: 8, 11: 10,        // Morning heating
            12: 12, 13: 15, 14: 18, 15: 15, 16: 12, 17: 8,  // Afternoon peak
            18: 5, 19: 2, 20: -1, 21: -3, 22: -5, 23: -6    // Evening cooling
        };

        const baseVariation = hourMultipliers[hour] || 0;
        const seasonalAdjustment = seasonalFactor > 1 ? 5 : 0; // July heat
        const randomVariation = (Math.random() - 0.5) * 6;

        return baseVariation + seasonalAdjustment + randomVariation;
    }

    /**
     * Helper methods
     */
    parseFloat(value, defaultValue = 0) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    determineSource(sensor) {
        const source = (sensor.source || sensor.type || '').toLowerCase();
        const location = (sensor.station || sensor.name || '').toLowerCase();

        if (source.includes('construction') || location.includes('construction')) return 'construction';
        if (source.includes('vehicle') || source.includes('traffic') || location.includes('road')) return 'vehicle';
        if (source.includes('dust') || location.includes('dust')) return 'dust';
        if (source.includes('industrial') || location.includes('industrial')) return 'industrial';

        // Default classification based on pollution levels
        const aqi = this.parseFloat(sensor.aqi);
        const pm10 = this.parseFloat(sensor.pm10);
        const pm25 = this.parseFloat(sensor.pm25);
        const co = this.parseFloat(sensor.co);

        if (pm25 > 0 && pm10 / pm25 > 2) return 'dust';
        if (co > 2) return 'vehicle';
        if (aqi > 150) return 'industrial';

        return 'residential';
    }

    calculateSeverity(aqi) {
        if (aqi <= 100) return 'moderate';
        if (aqi <= 150) return 'high';
        if (aqi <= 300) return 'very_high';
        return 'hazardous';
    }

    /**
     * Get cached data
     */
    getCachedData(filename) {
        return this.cache.get(filename);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.timeSeriesCache.clear();
    }
}

// Export singleton instance
const externalDataLoader = new ExternalDataLoader();
export default externalDataLoader;