// src/services/apiService.js
class APIService {
    constructor() {
        this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        this.authToken = localStorage.getItem('auth_token');
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
        this.cache = new Map();
        this.isOnline = navigator.onLine;

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onConnectionRestored();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // Generic HTTP request method with retry logic
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
                ...options.headers
            },
            ...options
        };

        let lastError;

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`API Request [Attempt ${attempt}]: ${options.method || 'GET'} ${url}`);

                const response = await fetch(url, config);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log(`API Response: ${data?.data?.length || 'N/A'} items received`);

                return data;

            } catch (error) {
                console.error(`API Request failed (attempt ${attempt}):`, error.message);
                lastError = error;

                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt); // Exponential backoff
                }
            }
        }

        // If all retries failed and we're offline, try cache
        if (!this.isOnline) {
            const cached = this.getCachedData(endpoint);
            if (cached) {
                console.log('Returning cached data due to offline mode');
                return cached;
            }
        }

        throw lastError;
    }

    // Sensor data endpoints
    async getSensorData(cityId = 'delhi', filters = {}) {
        const queryParams = new URLSearchParams({
            city: cityId,
            ...filters,
            timestamp: Date.now() // Cache busting
        }).toString();

        const endpoint = `/api/sensors?${queryParams}`;

        try {
            const response = await this.request(endpoint);

            // Transform and validate data
            const transformedData = this.transformSensorData(response.data || response);

            // Cache successful response
            this.setCachedData(endpoint, { data: transformedData }, 5 * 60 * 1000); // 5 minutes

            return transformedData;

        } catch (error) {
            console.error('Failed to fetch sensor data:', error);

            // Fallback to cached data
            const cached = this.getCachedData(endpoint);
            if (cached) {
                console.log('Using cached sensor data as fallback');
                return cached.data;
            }

            // Ultimate fallback to dummy data
            console.log('Using dummy data as final fallback');
            return this.getFallbackSensorData(cityId);
        }
    }

    async getSensorHistory(sensorId, timeRange = '24h') {
        const endpoint = `/api/sensors/${sensorId}/history?range=${timeRange}`;

        try {
            const response = await this.request(endpoint);
            return this.transformHistoryData(response.data || response);
        } catch (error) {
            console.error(`Failed to fetch history for sensor ${sensorId}:`, error);
            return this.generateFallbackHistory(sensorId, timeRange);
        }
    }

    async getGridData(bounds, resolution = 200) {
        const endpoint = `/api/grid-data`;
        const body = { bounds, resolution };

        try {
            const response = await this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            return this.transformGridData(response.data || response);
        } catch (error) {
            console.error('Failed to fetch grid data:', error);
            return null; // Let the app use generated grid data
        }
    }

    // City and configuration endpoints
    async getCities() {
        const endpoint = '/api/cities';

        try {
            const response = await this.request(endpoint);
            return response.data || response;
        } catch (error) {
            console.error('Failed to fetch cities:', error);
            return this.getDefaultCities();
        }
    }

    async getCityConfig(cityId) {
        const endpoint = `/api/cities/${cityId}/config`;

        try {
            const response = await this.request(endpoint);
            return response.data || response;
        } catch (error) {
            console.error(`Failed to fetch config for city ${cityId}:`, error);
            return this.getDefaultCityConfig(cityId);
        }
    }

    // Data transformation methods
    transformSensorData(rawData) {
        if (!Array.isArray(rawData)) {
            console.warn('Expected array for sensor data, got:', typeof rawData);
            return [];
        }

        return rawData.map(sensor => ({
            id: sensor.station_id || sensor.id || `sensor_${Date.now()}_${Math.random()}`,
            lat: parseFloat(sensor.latitude || sensor.lat),
            lng: parseFloat(sensor.longitude || sensor.lng),
            station: sensor.station_name || sensor.name || 'Unknown Station',
            aqi: Math.round(parseFloat(sensor.air_quality_index || sensor.aqi || 0)),
            pm25: parseFloat(sensor.pm2_5 || sensor.pm25 || 0),
            pm10: parseFloat(sensor.pm10 || 0),
            co: parseFloat(sensor.carbon_monoxide || sensor.co || 0),
            no2: parseFloat(sensor.nitrogen_dioxide || sensor.no2 || 0),
            so2: parseFloat(sensor.sulfur_dioxide || sensor.so2 || 0),
            rh: parseFloat(sensor.humidity || sensor.rh || 0),
            temperature: parseFloat(sensor.temperature || 0),
            windSpeed: parseFloat(sensor.wind_speed || sensor.windSpeed || 0),
            timestamp: sensor.last_updated || sensor.timestamp || new Date().toISOString(),
            source: this.determineSource(sensor),
            severity: this.calculateSeverity(sensor.aqi || 0),
            description: sensor.description || `${sensor.station_name || 'Unknown'} monitoring station`,
            dataQuality: sensor.data_quality || 'measured'
        })).filter(sensor =>
            !isNaN(sensor.lat) && !isNaN(sensor.lng) && sensor.aqi >= 0
        );
    }

    transformHistoryData(rawData) {
        if (!Array.isArray(rawData)) return [];

        return rawData.map(point => ({
            timestamp: point.timestamp || point.time,
            aqi: parseFloat(point.aqi || 0),
            pm25: parseFloat(point.pm25 || 0),
            pm10: parseFloat(point.pm10 || 0),
            co: parseFloat(point.co || 0),
            no2: parseFloat(point.no2 || 0),
            so2: parseFloat(point.so2 || 0)
        }));
    }

    determineSource(sensor) {
        // Logic to determine pollution source based on sensor data or metadata
        const sourceHints = sensor.source || sensor.category || '';
        const location = (sensor.station_name || '').toLowerCase();

        if (sourceHints.includes('construction') || location.includes('construction')) {
            return 'construction';
        } else if (sourceHints.includes('vehicle') || sourceHints.includes('traffic') || location.includes('road')) {
            return 'vehicle';
        } else if (sourceHints.includes('dust') || location.includes('dust')) {
            return 'dust';
        } else if (sourceHints.includes('industrial') || location.includes('industrial')) {
            return 'industrial';
        } else {
            // Default based on PM10/PM2.5 ratio
            const pm10 = parseFloat(sensor.pm10 || 0);
            const pm25 = parseFloat(sensor.pm25 || 0);

            if (pm25 > 0 && pm10 / pm25 > 2) {
                return 'dust';
            } else if (parseFloat(sensor.co || 0) > 2) {
                return 'vehicle';
            } else {
                return 'residential';
            }
        }
    }

    calculateSeverity(aqi) {
        if (aqi <= 100) return 'moderate';
        else if (aqi <= 150) return 'high';
        else if (aqi <= 300) return 'very_high';
        else return 'hazardous';
    }

    // Caching methods
    setCachedData(key, data, ttl = 300000) { // 5 minutes default
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    getCachedData(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached;
    }

    // Fallback data methods
    getFallbackSensorData(cityId) {
        // Return dummy data when API fails
        const { anandViharAQIData } = require('../utils/dummyData');
        console.log(`Using fallback data: ${anandViharAQIData.length} sensors`);
        return anandViharAQIData;
    }

    generateFallbackHistory(sensorId, timeRange) {
        const hours = timeRange.includes('h') ? parseInt(timeRange) : 24;
        const history = [];

        for (let i = hours; i >= 0; i--) {
            history.push({
                timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
                aqi: 100 + Math.random() * 100,
                pm25: 50 + Math.random() * 50,
                pm10: 75 + Math.random() * 75,
                co: 1 + Math.random() * 2,
                no2: 40 + Math.random() * 40,
                so2: 15 + Math.random() * 15
            });
        }

        return history;
    }

    getDefaultCities() {
        return [
            { id: 'delhi', name: 'Delhi NCR', center: [28.6139, 77.2090] },
            { id: 'mumbai', name: 'Mumbai', center: [19.0760, 72.8777] },
            { id: 'bangalore', name: 'Bangalore', center: [12.9716, 77.5946] }
        ];
    }

    getDefaultCityConfig(cityId) {
        return {
            id: cityId,
            name: cityId.charAt(0).toUpperCase() + cityId.slice(1),
            center: [28.6139, 77.2090], // Default to Delhi
            bounds: [[28.4041, 76.8370], [28.8831, 77.3480]],
            timezone: 'Asia/Kolkata',
            language: 'en'
        };
    }

    // Connection management
    onConnectionRestored() {
        console.log('Connection restored, refreshing data...');
        // Trigger data refresh in components that use this service
        window.dispatchEvent(new CustomEvent('api-connection-restored'));
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setAuthToken(token) {
        this.authToken = token;
        localStorage.setItem('auth_token', token);
    }

    clearAuth() {
        this.authToken = null;
        localStorage.removeItem('auth_token');
    }

    // Health check
    async healthCheck() {
        try {
            const response = await this.request('/api/health');
            return { status: 'ok', ...response };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
}

// Export singleton instance
const apiService = new APIService();
export default apiService;