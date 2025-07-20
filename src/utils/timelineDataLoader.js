// src/utils/timelineDataLoader.js
import Papa from 'papaparse';

class TimelineDataLoader {
    constructor() {
        this.cache = new Map();
        this.isLoading = false;
    }

    /**
     * Load all timeline data from CSV files
     */
    async loadTimelineData() {
        if (this.isLoading) {
            console.log('Timeline data loading already in progress...');
            return this.cache.get('timeline') || null;
        }

        if (this.cache.has('timeline')) {
            console.log('Returning cached timeline data');
            return this.cache.get('timeline');
        }

        this.isLoading = true;
        console.log('Loading timeline data from CSV files...');

        try {
            // Try to load all CSV files, but handle missing files gracefully
            const loadPromises = [
                this.loadCSVFile('grid_historical.csv').catch(e => {
                    console.warn('grid_historical.csv not found, using empty data');
                    return [];
                }),
                this.loadCSVFile('grid_predicted.csv').catch(e => {
                    console.warn('grid_predicted.csv not found, using empty data');
                    return [];
                }),
                this.loadCSVFile('historical_reading.csv').catch(e => {
                    console.warn('historical_reading.csv not found, using empty data');
                    return [];
                }),
                this.loadCSVFile('predicted_reading.csv').catch(e => {
                    console.warn('predicted_reading.csv not found, using empty data');
                    return [];
                })
            ];

            const [gridHistorical, gridPredicted, sensorHistorical, sensorPredicted] = await Promise.all(loadPromises);

            const timelineData = {
                historical: {
                    gridData: this.processGridData(gridHistorical),
                    sensorData: this.processSensorData(sensorHistorical),
                    dataType: 'historical',
                    totalGridCells: gridHistorical.length,
                    totalSensors: sensorHistorical.length
                },
                predicted: {
                    gridData: this.processGridData(gridPredicted),
                    sensorData: this.processSensorData(sensorPredicted),
                    dataType: 'predicted',
                    totalGridCells: gridPredicted.length,
                    totalSensors: sensorPredicted.length
                },
                timeline: {
                    start: new Date('2025-07-15T00:00:00Z'),
                    current: new Date('2025-07-20T14:30:00Z'),
                    end: new Date('2025-07-25T23:59:59Z'),
                    totalDuration: 10 * 24 * 60 * 60 * 1000 // 10 days
                },
                metadata: {
                    loadedAt: new Date().toISOString(),
                    version: '1.0',
                    source: 'CSV files',
                    filesFound: {
                        gridHistorical: gridHistorical.length > 0,
                        gridPredicted: gridPredicted.length > 0,
                        sensorHistorical: sensorHistorical.length > 0,
                        sensorPredicted: sensorPredicted.length > 0
                    }
                }
            };

            // Cache the processed data
            this.cache.set('timeline', timelineData);

            console.log('Timeline data loaded successfully:', {
                historicalGrids: timelineData.historical.totalGridCells,
                predictedGrids: timelineData.predicted.totalGridCells,
                historicalSensors: timelineData.historical.totalSensors,
                predictedSensors: timelineData.predicted.totalSensors,
                filesFound: timelineData.metadata.filesFound
            });

            return timelineData;

        } catch (error) {
            console.error('Error loading timeline data:', error);
            // Return fallback/demo data
            return this.getFallbackData();
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load individual CSV file with error handling (Browser-compatible version)
     */
    async loadCSVFile(filename) {
        try {
            console.log(`Loading CSV file: ${filename}`);

            // Check if window.fs is available (Claude environment)
            if (typeof window !== 'undefined' && window.fs && window.fs.readFile) {
                const response = await window.fs.readFile(`generated_data/${filename}`, { encoding: 'utf8' });
                return this.parseCSVString(response, filename);
            }

            // Fallback: Use fetch for standard browser environment
            const response = await fetch(`/generated_data/${filename}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const csvText = await response.text();
            return this.parseCSVString(csvText, filename);

        } catch (error) {
            console.error(`Error reading file ${filename}:`, error);

            // If file not found, return empty array instead of throwing
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                console.warn(`CSV file ${filename} not found, using empty data`);
                return [];
            }

            throw error;
        }
    }

    /**
     * Parse CSV string using Papa Parse
     */
    parseCSVString(csvText, filename) {
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                delimitersToGuess: [',', '\t', '|', ';'],
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.warn(`Parsing warnings for ${filename}:`, results.errors);
                    }
                    console.log(`Successfully parsed ${filename}: ${results.data.length} rows`);
                    resolve(results.data);
                },
                error: (error) => {
                    console.error(`Error parsing ${filename}:`, error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Process grid data and ensure proper format for user's CSV structure
     */
    processGridData(rawGridData) {
        return rawGridData.map((row, index) => {
            // Process user's specific CSV structure
            const gridData = {
                id: row.grid_id || `grid_${index}`,
                centerLat: this.parseFloat(row.center_lat),
                centerLng: this.parseFloat(row.center_lng),

                // Core pollutant values
                aqi: this.parseFloat(row.aqi || 0),
                pm25: this.parseFloat(row.pm25 || 0),
                pm10: this.parseFloat(row.pm10 || 0),
                co: this.parseFloat(row.co || 0),
                no2: this.parseFloat(row.no2 || 0),
                so2: this.parseFloat(row.so2 || 0),

                // Additional metadata
                timestamp: row.timestamp || new Date().toISOString(),
                distanceFromCenter: this.parseFloat(row.distance_from_center || 0),

                // Source contributions - detailed breakdown matching user's CSV
                sourceContributions: this.parseDetailedSourceContributions(row),

                // Generate grid corners for map display (required by EnhancedGridLayer)
                corners: this.generateGridCorners(
                    this.parseFloat(row.center_lat),
                    this.parseFloat(row.center_lng)
                ),

                // Data quality indicators
                dataQuality: row.dataQuality || 'csv_data',
                dataSource: 'timeline_csv'
            };

            return gridData;
        }).filter(grid => !isNaN(grid.centerLat) && !isNaN(grid.centerLng));
    }

    /**
     * Parse detailed source contributions from user's CSV structure
     */
    parseDetailedSourceContributions(row) {
        return {
            aqi: {
                construction: this.parseFloat(row.construction_contrib_aqi || 0),
                vehicle: this.parseFloat(row.vehicle_contrib_aqi || 0),
                dust: this.parseFloat(row.dust_contrib_aqi || 0)
            },
            pm25: {
                construction: this.parseFloat(row.construction_contrib_pm25 || 0),
                vehicle: this.parseFloat(row.vehicle_contrib_pm25 || 0),
                dust: this.parseFloat(row.dust_contrib_pm25 || 0)
            },
            pm10: {
                construction: this.parseFloat(row.construction_contrib_pm10 || 0),
                vehicle: this.parseFloat(row.vehicle_contrib_pm10 || 0),
                dust: this.parseFloat(row.dust_contrib_pm10 || 0)
            },
            co: {
                construction: this.parseFloat(row.construction_contrib_co || 0),
                vehicle: this.parseFloat(row.vehicle_contrib_co || 0),
                dust: this.parseFloat(row.dust_contrib_co || 0)
            },
            no2: {
                construction: this.parseFloat(row.construction_contrib_no2 || 0),
                vehicle: this.parseFloat(row.vehicle_contrib_no2 || 0),
                dust: this.parseFloat(row.dust_contrib_no2 || 0)
            },
            so2: {
                construction: this.parseFloat(row.construction_contrib_so2 || 0),
                vehicle: this.parseFloat(row.vehicle_contrib_so2 || 0),
                dust: this.parseFloat(row.dust_contrib_so2 || 0)
            }
        };
    }

    /**
     * Generate grid cell corners from center point (approximate 200m x 200m grid)
     */
    generateGridCorners(centerLat, centerLng) {
        // Approximate 200m grid cell (adjust as needed)
        const latOffset = 0.0009; // ~100m in latitude
        const lngOffset = 0.0012; // ~100m in longitude (adjusted for Delhi's longitude)

        return [
            [centerLat - latOffset, centerLng - lngOffset], // SW corner
            [centerLat - latOffset, centerLng + lngOffset], // SE corner  
            [centerLat + latOffset, centerLng + lngOffset], // NE corner
            [centerLat + latOffset, centerLng - lngOffset]  // NW corner
        ];
    }

    /**
     * Process sensor data and ensure proper format
     */
    processSensorData(rawSensorData) {
        return rawSensorData.map((row, index) => {
            const cleanRow = this.cleanHeaders(row);

            return {
                id: cleanRow.id || cleanRow.sensor_id || `sensor_${index}`,
                station: cleanRow.station || cleanRow.name || `Station ${index + 1}`,
                lat: this.parseFloat(cleanRow.lat || cleanRow.latitude),
                lng: this.parseFloat(cleanRow.lng || cleanRow.longitude),

                // Pollutant readings
                aqi: this.parseFloat(cleanRow.aqi || cleanRow.AQI || 0),
                pm25: this.parseFloat(cleanRow.pm25 || cleanRow.PM25 || cleanRow['PM2.5'] || 0),
                pm10: this.parseFloat(cleanRow.pm10 || cleanRow.PM10 || 0),
                co: this.parseFloat(cleanRow.co || cleanRow.CO || 0),
                no2: this.parseFloat(cleanRow.no2 || cleanRow.NO2 || 0),
                so2: this.parseFloat(cleanRow.so2 || cleanRow.SO2 || 0),

                // Environmental data
                temperature: this.parseFloat(cleanRow.temperature || cleanRow.temp || 25),
                humidity: this.parseFloat(cleanRow.humidity || cleanRow.rh || 50),
                windSpeed: this.parseFloat(cleanRow.windSpeed || cleanRow.wind_speed || 2),

                // Metadata
                source: cleanRow.source || this.determineSource(cleanRow),
                severity: cleanRow.severity || this.calculateSeverity(cleanRow.aqi || 0),
                timestamp: cleanRow.timestamp || cleanRow.time || new Date().toISOString(),
                description: cleanRow.description || `${cleanRow.station || 'Unknown'} monitoring station`,

                // Confidence (for predicted data)
                confidence: this.parseFloat(cleanRow.confidence || 85),

                // Data quality
                dataQuality: cleanRow.dataQuality || cleanRow.quality || 'generated'
            };
        }).filter(sensor => !isNaN(sensor.lat) && !isNaN(sensor.lng));
    }

    /**
     * Clean and normalize header names (simplified for user's known CSV structure)
     */
    cleanHeaders(row) {
        // For user's CSV structure, headers are already clean
        // This method is kept for fallback compatibility
        return row;
    }

    /**
     * Determine pollution source based on data
     */
    determineSource(row) {
        // Look for explicit source field
        if (row.source) return row.source;

        // Try to infer from station name or other fields
        const station = (row.station || row.name || '').toLowerCase();
        if (station.includes('construction') || station.includes('building')) return 'construction';
        if (station.includes('traffic') || station.includes('vehicle') || station.includes('road')) return 'vehicle';
        if (station.includes('dust') || station.includes('open')) return 'dust';
        if (station.includes('industrial') || station.includes('factory')) return 'industrial';

        // Default fallback
        return 'mixed';
    }

    /**
     * Calculate severity based on AQI
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
     * Safe float parsing
     */
    parseFloat(value) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Get data for specific timestamp with proper grid structure
     */
    getDataForTime(timelineData, timestamp, mode = 'historical') {
        if (!timelineData || !timelineData[mode]) {
            console.warn(`No timeline data available for mode: ${mode}`);
            return null;
        }

        const data = timelineData[mode];

        console.log(`🕒 Getting ${mode} data for time:`, timestamp, `(${data.gridData.length} grid cells, ${data.sensorData.length} sensors)`);

        // Return the CSV data with proper structure
        return {
            gridData: data.gridData, // This now contains processed CSV data with corners, sourceContributions, etc.
            sensorData: data.sensorData,
            timestamp: timestamp,
            mode: mode,
            dataType: data.dataType,
            metadata: {
                totalGridCells: data.gridData.length,
                totalSensors: data.sensorData.length,
                source: 'csv_files',
                mode: mode
            }
        };
    }

    /**
     * Fallback data in case CSV loading fails
     */
    getFallbackData() {
        console.log('Using fallback timeline data');

        return {
            historical: {
                gridData: [],
                sensorData: [],
                dataType: 'historical',
                totalGridCells: 0,
                totalSensors: 0
            },
            predicted: {
                gridData: [],
                sensorData: [],
                dataType: 'predicted',
                totalGridCells: 0,
                totalSensors: 0
            },
            timeline: {
                start: new Date('2025-07-15T00:00:00Z'),
                current: new Date('2025-07-20T14:30:00Z'),
                end: new Date('2025-07-25T23:59:59Z'),
                totalDuration: 10 * 24 * 60 * 60 * 1000
            },
            metadata: {
                loadedAt: new Date().toISOString(),
                version: '1.0',
                source: 'fallback',
                error: 'CSV files not available'
            }
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Timeline data cache cleared');
    }
}

// Export singleton instance
export const timelineDataLoader = new TimelineDataLoader();
export default timelineDataLoader;