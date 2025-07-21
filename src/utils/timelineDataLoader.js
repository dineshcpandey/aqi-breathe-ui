// src/utils/timelineDataLoader.js - TIMEZONE FIXED VERSION
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
        console.log('🔄 Loading timeline data from CSV files...');

        try {
            // Try to load all CSV files, but handle missing files gracefully
            const loadPromises = [
                this.loadCSVFile('grid_historical.csv').catch(e => {
                    console.warn('❌ grid_historical.csv not found, using empty data');
                    return [];
                }),
                this.loadCSVFile('grid_predicted.csv').catch(e => {
                    console.warn('❌ grid_predicted.csv not found, using empty data');
                    return [];
                }),
                this.loadCSVFile('historical_reading.csv').catch(e => {
                    console.warn('❌ historical_reading.csv not found, using empty data');
                    return [];
                }),
                this.loadCSVFile('predicted_reading.csv').catch(e => {
                    console.warn('❌ predicted_reading.csv not found, using empty data');
                    return [];
                })
            ];

            const [gridHistorical, gridPredicted, sensorHistorical, sensorPredicted] = await Promise.all(loadPromises);

            console.log('📊 Raw CSV Data Loaded:');
            console.log('  Grid Historical:', gridHistorical.length, 'rows');
            console.log('  Grid Predicted:', gridPredicted.length, 'rows');
            console.log('  Sensor Historical:', sensorHistorical.length, 'rows');
            console.log('  Sensor Predicted:', sensorPredicted.length, 'rows');

            // 🔧 TIMEZONE FIX: Analyze timestamps during processing
            if (gridHistorical.length > 0) {
                console.log('🕒 TIMEZONE Analysis - Historical Grid Sample:', {
                    raw_timestamp: gridHistorical[0].timestamp,
                    timestamp_type: typeof gridHistorical[0].timestamp,
                    is_string: typeof gridHistorical[0].timestamp === 'string',
                    parsed_as_date: new Date(gridHistorical[0].timestamp).toISOString(),
                    timezone_suffix: gridHistorical[0].timestamp?.includes('Z') ? 'UTC (Z)' : 'No timezone specified'
                });
            }

            // Process the data
            const processedGridHistorical = this.processGridData(gridHistorical, 'historical');
            const processedGridPredicted = this.processGridData(gridPredicted, 'predicted');
            const processedSensorHistorical = this.processSensorData(sensorHistorical, 'historical');
            const processedSensorPredicted = this.processSensorData(sensorPredicted, 'predicted');

            console.log('🔄 Processed Data:');
            console.log('  Grid Historical:', processedGridHistorical.length, 'processed');
            console.log('  Grid Predicted:', processedGridPredicted.length, 'processed');
            console.log('  Sensor Historical:', processedSensorHistorical.length, 'processed');
            console.log('  Sensor Predicted:', processedSensorPredicted.length, 'processed');

            // 🔧 TIMEZONE FIX: Log unique timestamps from processed data
            if (processedGridHistorical.length > 0) {
                const uniqueTimestamps = [...new Set(processedGridHistorical.map(g => g.timestamp))].sort().slice(0, 5);
                console.log('🕒 TIMEZONE Analysis - Unique processed timestamps (first 5):', uniqueTimestamps);
            }

            const timelineData = {
                historical: {
                    gridData: processedGridHistorical,
                    sensorData: processedSensorHistorical,
                    dataType: 'historical',
                    totalGridCells: processedGridHistorical.length,
                    totalSensors: processedSensorHistorical.length
                },
                predicted: {
                    gridData: processedGridPredicted,
                    sensorData: processedSensorPredicted,
                    dataType: 'predicted',
                    totalGridCells: processedGridPredicted.length,
                    totalSensors: processedSensorPredicted.length
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
                    },
                    timezoneInfo: {
                        csvTimezone: 'UTC (Z suffix)',
                        processingTimezone: 'UTC preserved',
                        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    }
                }
            };

            // Cache the processed data
            this.cache.set('timeline', timelineData);

            console.log('✅ Timeline data loaded successfully:', {
                historicalGrids: timelineData.historical.totalGridCells,
                predictedGrids: timelineData.predicted.totalGridCells,
                historicalSensors: timelineData.historical.totalSensors,
                predictedSensors: timelineData.predicted.totalSensors,
                filesFound: timelineData.metadata.filesFound,
                timezoneInfo: timelineData.metadata.timezoneInfo
            });

            return timelineData;

        } catch (error) {
            console.error('❌ Error loading timeline data:', error);
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
            console.log(`📂 Loading CSV file: ${filename}`);

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
            console.error(`❌ Error reading file ${filename}:`, error);

            // If file not found, return empty array instead of throwing
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                console.warn(`📁 CSV file ${filename} not found, using empty data`);
                return [];
            }

            throw error;
        }
    }

    /**
     * Parse CSV string using Papa Parse with timezone preservation
     */
    parseCSVString(csvText, filename) {
        return new Promise((resolve, reject) => {
            console.log(`📊 Parsing ${filename}, size: ${csvText.length} characters`);

            Papa.parse(csvText, {
                header: true,
                // 🔧 TIMEZONE FIX: Use dynamicTyping: false to keep timestamps as strings
                // This prevents Papa Parse from converting timestamps to Date objects in local timezone
                dynamicTyping: false, // Keep timestamps as strings to preserve UTC
                skipEmptyLines: true,
                delimitersToGuess: [',', '\t', '|', ';'],
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.warn(`⚠️ Parsing warnings for ${filename}:`, results.errors);
                    }

                    console.log(`✅ Successfully parsed ${filename}: ${results.data.length} rows`);
                    console.log(`📋 Columns found:`, Object.keys(results.data[0] || {}));

                    // Log first row for debugging
                    if (results.data.length > 0) {
                        console.log(`🔍 Sample row from ${filename}:`, results.data[0]);

                        // 🔧 TIMEZONE FIX: Verify timestamp format in CSV
                        if (results.data[0].timestamp) {
                            console.log(`🕒 TIMEZONE Check for ${filename}:`, {
                                timestamp_raw: results.data[0].timestamp,
                                is_string: typeof results.data[0].timestamp === 'string',
                                contains_Z: results.data[0].timestamp.includes('Z'),
                                would_parse_to: new Date(results.data[0].timestamp).toISOString()
                            });
                        }
                    }

                    resolve(results.data);
                },
                error: (error) => {
                    console.error(`❌ Error parsing ${filename}:`, error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Process grid data and ensure proper format for user's CSV structure
     * TIMEZONE FIXED VERSION - preserves UTC timestamps
     */
    processGridData(rawGridData, dataType = 'historical') {
        if (!rawGridData || rawGridData.length === 0) {
            console.warn(`⚠️ No raw grid data provided for ${dataType}`);
            return [];
        }

        console.log(`🔄 Processing ${rawGridData.length} grid rows for ${dataType}...`);

        const processedData = rawGridData.map((row, index) => {
            // Clean and validate the row data
            const cleanRow = this.cleanHeaders(row);

            // Parse coordinates - your CSV uses center_lat, center_lng
            const centerLat = this.parseFloat(cleanRow.center_lat);
            const centerLng = this.parseFloat(cleanRow.center_lng);

            // Validate coordinates
            if (isNaN(centerLat) || isNaN(centerLng)) {
                console.warn(`⚠️ Invalid coordinates in row ${index}:`, {
                    center_lat: cleanRow.center_lat,
                    center_lng: cleanRow.center_lng,
                    centerLat,
                    centerLng
                });
                return null; // Skip this row
            }

            // 🔧 TIMEZONE FIX: Preserve timestamp as-is from CSV (should be UTC string)
            const timestamp = this.preserveTimestamp(cleanRow.timestamp);

            // Process the grid data according to your CSV structure
            const gridData = {
                // Basic identification
                id: cleanRow.grid_id || `grid_${index}`,
                centerLat: centerLat,
                centerLng: centerLng,

                // Core pollutant values - your CSV column names
                aqi: this.parseFloat(cleanRow.aqi || 0),
                pm25: this.parseFloat(cleanRow.pm25 || 0),
                pm10: this.parseFloat(cleanRow.pm10 || 0),
                co: this.parseFloat(cleanRow.co || 0),
                no2: this.parseFloat(cleanRow.no2 || 0),
                so2: this.parseFloat(cleanRow.so2 || 0),

                // 🔧 TIMEZONE FIX: Store timestamp as UTC string, not Date object
                timestamp: timestamp,
                distanceFromCenter: this.parseFloat(cleanRow.distance_from_center || 0),

                // Source contributions - detailed breakdown matching your CSV
                sourceContributions: this.parseDetailedSourceContributions(cleanRow),

                // Generate grid corners for map display (required by EnhancedGridLayer)
                corners: this.generateGridCorners(centerLat, centerLng),

                // Data quality indicators
                dataQuality: cleanRow.dataQuality || 'csv_data',
                dataSource: 'timeline_csv',
                dataType: dataType
            };

            return gridData;
        }).filter(grid => grid !== null); // Remove null entries (invalid coordinates)

        console.log(`✅ Successfully processed ${processedData.length}/${rawGridData.length} grid cells for ${dataType}`);

        if (processedData.length > 0) {
            console.log(`🔍 Sample processed grid:`, {
                id: processedData[0].id,
                coords: [processedData[0].centerLat, processedData[0].centerLng],
                aqi: processedData[0].aqi,
                timestamp: processedData[0].timestamp,
                timestamp_type: typeof processedData[0].timestamp,
                hasCorners: !!processedData[0].corners,
                hasSourceContrib: !!processedData[0].sourceContributions
            });
        }

        return processedData;
    }

    /**
     * 🔧 TIMEZONE FIX: Preserve timestamp exactly as it appears in CSV
     */
    preserveTimestamp(rawTimestamp) {
        if (!rawTimestamp) {
            return new Date().toISOString(); // Fallback to current UTC time
        }

        // If it's already a string (which it should be with dynamicTyping: false), return as-is
        if (typeof rawTimestamp === 'string') {
            // Ensure it ends with Z if it's missing (assumes UTC)
            if (rawTimestamp.includes('T') && !rawTimestamp.includes('Z') && !rawTimestamp.includes('+')) {
                return rawTimestamp + 'Z';
            }
            return rawTimestamp;
        }

        // If it's somehow a Date object, convert back to UTC string
        if (rawTimestamp instanceof Date) {
            return rawTimestamp.toISOString();
        }

        // Fallback: try to parse whatever it is
        try {
            return new Date(rawTimestamp).toISOString();
        } catch (e) {
            console.warn('⚠️ Could not parse timestamp:', rawTimestamp);
            return new Date().toISOString();
        }
    }

    /**
     * Parse detailed source contributions from your CSV structure
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
        // Approximate 200m grid cell (adjust as needed for your specific grid size)
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
     * TIMEZONE FIXED VERSION
     */
    processSensorData(rawSensorData, dataType = 'historical') {
        if (!rawSensorData || rawSensorData.length === 0) {
            console.warn(`⚠️ No raw sensor data provided for ${dataType}`);
            return [];
        }

        console.log(`🔄 Processing ${rawSensorData.length} sensor rows for ${dataType}...`);

        const processedData = rawSensorData.map((row, index) => {
            const cleanRow = this.cleanHeaders(row);

            // Parse coordinates - your sensor CSV uses lat, lng
            const lat = this.parseFloat(cleanRow.lat || cleanRow.latitude);
            const lng = this.parseFloat(cleanRow.lng || cleanRow.longitude);

            // Validate coordinates
            if (isNaN(lat) || isNaN(lng)) {
                console.warn(`⚠️ Invalid sensor coordinates in row ${index}:`, { lat, lng });
                return null;
            }

            return {
                // Basic identification
                id: cleanRow.id || cleanRow.sensor_id || `sensor_${index}`,
                station: cleanRow.station || cleanRow.name || `Station ${index + 1}`,
                lat: lat,
                lng: lng,

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

                // Additional attributes from your CSV
                source: cleanRow.source || 'unknown',
                severity: cleanRow.severity || 'moderate',
                description: cleanRow.description || '',

                // 🔧 TIMEZONE FIX: Preserve timestamp format
                timestamp: this.preserveTimestamp(cleanRow.timestamp),
                dataQuality: 'csv_data',
                dataSource: 'timeline_csv',
                dataType: dataType
            };
        }).filter(sensor => sensor !== null);

        console.log(`✅ Successfully processed ${processedData.length}/${rawSensorData.length} sensors for ${dataType}`);

        return processedData;
    }

    /**
     * Clean headers by trimming whitespace and handling common variations
     */
    cleanHeaders(row) {
        // For your known CSV structure, headers should be clean
        // But we'll add some basic cleaning just in case
        const cleaned = {};
        Object.keys(row).forEach(key => {
            const trimmedKey = key.trim();
            // Convert numeric values from strings, but keep timestamps as strings
            const value = row[key];
            if (trimmedKey.toLowerCase().includes('timestamp') || trimmedKey.toLowerCase().includes('time')) {
                // Keep timestamps as strings
                cleaned[trimmedKey] = value;
            } else {
                // Convert other values to numbers if they look numeric
                cleaned[trimmedKey] = this.maybeParseNumber(value);
            }
        });
        return cleaned;
    }

    /**
     * Maybe parse a value as a number, but leave strings as strings
     */
    maybeParseNumber(value) {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return value;

        const trimmed = value.trim();
        if (trimmed === '') return 0;

        const parsed = parseFloat(trimmed);
        return isNaN(parsed) ? value : parsed;
    }

    /**
     * Safe float parsing with debugging
     */
    parseFloat(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * 🔧 TIMEZONE FIX: Get data for specific timestamp with exact string matching
     */
    getDataForTime(timelineData, timestamp, mode = 'historical') {
        if (!timelineData || !timelineData[mode]) {
            console.warn(`No timeline data available for mode: ${mode}`);
            return null;
        }

        const data = timelineData[mode];

        // Convert timestamp to ISO string for comparison
        const targetTimestamp = timestamp.toISOString();

        console.log(`🕒 TIMEZONE-FIXED: Getting ${mode} data for time:`, targetTimestamp);
        console.log(`📊 Available data: ${data.gridData.length} grid cells, ${data.sensorData.length} sensors`);

        // 🔧 TIMEZONE FIX: Find exact timestamp matches
        const matchingGridData = data.gridData.filter(grid => grid.timestamp === targetTimestamp);
        const matchingSensorData = data.sensorData.filter(sensor => sensor.timestamp === targetTimestamp);

        console.log(`🎯 TIMEZONE-FIXED: Exact matches found:`, {
            targetTimestamp,
            gridMatches: matchingGridData.length,
            sensorMatches: matchingSensorData.length,
            sampleAvailableTimestamps: data.gridData.slice(0, 3).map(g => g.timestamp)
        });

        // If no exact matches, return all data (fallback behavior)
        if (matchingGridData.length === 0 && matchingSensorData.length === 0) {
            console.log(`⚠️ No exact timestamp matches, returning all available data for ${mode}`);
            return {
                gridData: data.gridData,
                sensorData: data.sensorData,
                timestamp: timestamp,
                mode: mode,
                dataType: data.dataType,
                metadata: {
                    totalGridCells: data.gridData.length,
                    totalSensors: data.sensorData.length,
                    source: 'csv_files_fallback',
                    mode: mode,
                    exactMatch: false
                }
            };
        }

        // Return exact matches
        return {
            gridData: matchingGridData.length > 0 ? matchingGridData : data.gridData,
            sensorData: matchingSensorData.length > 0 ? matchingSensorData : data.sensorData,
            timestamp: timestamp,
            mode: mode,
            dataType: data.dataType,
            metadata: {
                totalGridCells: matchingGridData.length || data.gridData.length,
                totalSensors: matchingSensorData.length || data.sensorData.length,
                source: 'csv_files_exact_match',
                mode: mode,
                exactMatch: matchingGridData.length > 0 || matchingSensorData.length > 0
            }
        };
    }

    /**
     * Fallback data in case CSV loading fails
     */
    getFallbackData() {
        console.log('⚠️ Using fallback timeline data');

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
                error: 'CSV files not available',
                timezoneInfo: {
                    note: 'Fallback data, no timezone issues'
                }
            }
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Timeline data cache cleared');
    }
}

// Export singleton instance
export const timelineDataLoader = new TimelineDataLoader();
export default timelineDataLoader;