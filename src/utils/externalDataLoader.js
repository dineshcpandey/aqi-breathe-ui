// src/utils/externalDataLoader.js - COMPLETE VERSION with ALL original functionality
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
                const timeBasedMultiplier = this.getVariationMultiplier(hour, isWeekend);
                const seasonalFactor = 1.2; // July factor for Delhi

                // Apply variations to different pollutants
                const windVariation = this.getWindVariation(hour, seasonalFactor);
                const humidityVariation = this.getHumidityVariation(hour, seasonalFactor);
                const temperatureVariation = this.getTemperatureVariation(hour, seasonalFactor);

                const dataPoint = {
                    timestamp: timestamp.toISOString(),
                    aqi: Math.max(25, Math.round(sensor.aqi * timeBasedMultiplier * (0.9 + Math.random() * 0.2))),
                    pm25: Math.max(5, Math.round(sensor.pm25 * timeBasedMultiplier * (0.85 + Math.random() * 0.3))),
                    pm10: Math.max(10, Math.round(sensor.pm10 * timeBasedMultiplier * (0.8 + Math.random() * 0.4))),
                    co: Math.max(0.1, +(sensor.co * timeBasedMultiplier * (0.7 + Math.random() * 0.6)).toFixed(2)),
                    no2: Math.max(5, Math.round(sensor.no2 * timeBasedMultiplier * (0.75 + Math.random() * 0.5))),
                    so2: Math.max(2, Math.round(sensor.so2 * timeBasedMultiplier * (0.6 + Math.random() * 0.8))),

                    // Environmental variations
                    rh: Math.max(20, Math.min(95, Math.round(sensor.rh + humidityVariation))),
                    temperature: Math.max(15, Math.min(50, Math.round(sensor.temperature + temperatureVariation))),
                    windSpeed: Math.max(0.1, +(sensor.windSpeed + windVariation).toFixed(1)),

                    // Additional metadata
                    hour: hour,
                    isWeekend: isWeekend,
                    dataQuality: 'generated'
                };

                sensorTimeSeries.push(dataPoint);
            }

            return {
                ...sensor,
                timeSeries: sensorTimeSeries,
                timeRange: { start: startDate, end: endDate }
            };
        });

        // Cache the result
        this.timeSeriesCache.set(cacheKey, timeSeriesData);

        console.log(`Generated time series for ${timeSeriesData.length} sensors with ${timeSeriesData[0]?.timeSeries?.length || 0} data points each`);
        return timeSeriesData;
    }

    /**
     * Get variation multiplier based on time of day and day of week
     */
    getVariationMultiplier(hour, isWeekend) {
        // Rush hour patterns for weekdays
        const weekdayMultipliers = {
            0: 0.6, 1: 0.5, 2: 0.4, 3: 0.4, 4: 0.5, 5: 0.7,
            6: 1.0, 7: 1.4, 8: 1.6, 9: 1.3, 10: 1.1, 11: 1.1,
            12: 1.2, 13: 1.2, 14: 1.1, 15: 1.1, 16: 1.3, 17: 1.6,
            18: 1.8, 19: 1.5, 20: 1.2, 21: 1.0, 22: 0.8, 23: 0.7
        };

        // Weekend patterns (generally lower and later peaks)
        const weekendMultipliers = {
            0: 0.5, 1: 0.4, 2: 0.3, 3: 0.3, 4: 0.3, 5: 0.4,
            6: 0.6, 7: 0.7, 8: 0.8, 9: 0.9, 10: 1.0, 11: 1.1,
            12: 1.2, 13: 1.2, 14: 1.1, 15: 1.1, 16: 1.0, 17: 1.1,
            18: 1.2, 19: 1.1, 20: 1.0, 21: 0.9, 22: 0.7, 23: 0.6
        };

        return isWeekend ? weekendMultipliers[hour] : weekdayMultipliers[hour];
    }

    /**
     * Get wind speed variation based on time and season
     */
    getWindVariation(hour, seasonalFactor) {
        // Wind typically picks up during day and calms at night
        const windHourlyPattern = {
            0: -1.2, 1: -1.5, 2: -1.8, 3: -2.0, 4: -1.8, 5: -1.2,
            6: -0.8, 7: -0.2, 8: 0.5, 9: 1.2, 10: 1.8, 11: 2.2,
            12: 2.5, 13: 2.8, 14: 3.0, 15: 2.8, 16: 2.2, 17: 1.5,
            18: 0.8, 19: 0.2, 20: -0.2, 21: -0.5, 22: -0.8, 23: -1.0
        };

        const baseVariation = windHourlyPattern[hour] || 0;
        const seasonalAdjustment = seasonalFactor > 1 ? 0.8 : -0.5; // July has more wind
        const randomVariation = (Math.random() - 0.5) * 2;

        return baseVariation + seasonalAdjustment + randomVariation;
    }

    /**
     * Get humidity variation based on time and season
     */
    getHumidityVariation(hour, seasonalFactor) {
        // Humidity typically higher at night, lower during day
        const humidityHourlyPattern = {
            0: 10, 1: 12, 2: 15, 3: 15, 4: 12, 5: 8,
            6: 5, 7: 0, 8: -5, 9: -8, 10: -10, 11: -12,
            12: -15, 13: -18, 14: -20, 15: -18, 16: -15, 17: -10,
            18: -5, 19: 0, 20: 3, 21: 5, 22: 7, 23: 8
        };

        const baseVariation = humidityHourlyPattern[hour] || hour > 12 ? -10 : -5;
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