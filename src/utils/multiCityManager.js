/ src/utils / multiCityManager.js - Scale to multiple cities
export class MultiCityManager {
    constructor() {
        this.cities = new Map();
        this.currentCity = null;
        this.sensorCache = new Map();
    }

    // Add city configuration
    addCity(cityConfig) {
        this.cities.set(cityConfig.id, {
            id: cityConfig.id,
            name: cityConfig.name,
            center: cityConfig.center,
            bounds: cityConfig.bounds,
            apiEndpoint: cityConfig.apiEndpoint,
            sensorTypes: cityConfig.sensorTypes || ['construction', 'vehicle', 'dust'],
            timezone: cityConfig.timezone,
            language: cityConfig.language || 'en',
            thresholds: cityConfig.thresholds || this.getDefaultThresholds(),
            lastUpdate: null
        });
    }

    // Switch between cities
    async switchCity(cityId) {
        if (!this.cities.has(cityId)) {
            throw new Error(`City ${cityId} not found`);
        }

        this.currentCity = cityId;
        const cityConfig = this.cities.get(cityId);

        // Load city-specific sensor data
        const sensorData = await this.loadCitySensorData(cityConfig);

        return {
            cityConfig,
            sensorData,
            bounds: cityConfig.bounds,
            center: cityConfig.center
        };
    }

    async loadCitySensorData(cityConfig) {
        const cacheKey = `${cityConfig.id}_sensors`;

        // Check cache first
        if (this.sensorCache.has(cacheKey)) {
            const cached = this.sensorCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${cityConfig.apiEndpoint}/sensors`, {
                headers: {
                    'Content-Type': 'application/json',
                    'City-ID': cityConfig.id
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const transformedData = this.transformSensorData(data, cityConfig);

            // Cache the data
            this.sensorCache.set(cacheKey, {
                data: transformedData,
                timestamp: Date.now()
            });

            return transformedData;

        } catch (error) {
            console.error(`Failed to load data for ${cityConfig.name}:`, error);

            // Return fallback data specific to city
            return this.getFallbackData(cityConfig.id);
        }
    }

    transformSensorData(rawData, cityConfig) {
        return rawData.map(sensor => ({
            id: sensor.station_id || sensor.id,
            lat: parseFloat(sensor.latitude),
            lng: parseFloat(sensor.longitude),
            aqi: Math.round(sensor.air_quality_index || sensor.aqi),
            pm25: parseFloat(sensor.pm2_5 || sensor.pm25),
            pm10: parseFloat(sensor.pm10),
            co: parseFloat(sensor.carbon_monoxide || sensor.co),
            no2: parseFloat(sensor.nitrogen_dioxide || sensor.no2),
            so2: parseFloat(sensor.sulfur_dioxide || sensor.so2),
            rh: parseFloat(sensor.humidity || sensor.rh),
            temperature: parseFloat(sensor.temperature),
            windSpeed: parseFloat(sensor.wind_speed || sensor.windSpeed),
            station: sensor.station_name || sensor.name,
            source: this.determineSource(sensor, cityConfig),
            severity: this.calculateSeverity(sensor.aqi, cityConfig.thresholds),
            timestamp: sensor.last_updated || sensor.timestamp,
            description: sensor.description || `${sensor.station_name} monitoring station`,
            cityId: cityConfig.id,
            dataQuality: sensor.data_quality || 'measured'
        }));
    }

    getDefaultThresholds() {
        return {
            moderate: { min: 0, max: 100 },
            high: { min: 101, max: 150 },
            very_high: { min: 151, max: 300 },
            hazardous: { min: 301, max: 500 }
        };
    }

    getAllCities() {
        return Array.from(this.cities.values());
    }

    getCurrentCity() {
        return this.currentCity ? this.cities.get(this.currentCity) : null;
    }
}

// City configurations for Indian metros
export const INDIAN_CITIES = {
    DELHI: {
        id: 'delhi',
        name: 'Delhi NCR',
        center: [28.6139, 77.2090],
        bounds: [[28.4041, 76.8370], [28.8831, 77.3480]],
        apiEndpoint: 'https://api.cpcb.nic.in/delhi',
        sensorTypes: ['traffic', 'construction', 'industrial', 'residential'],
        timezone: 'Asia/Kolkata',
        language: 'en'
    },
    MUMBAI: {
        id: 'mumbai',
        name: 'Mumbai',
        center: [19.0760, 72.8777],
        bounds: [[18.8932, 72.7731], [19.2720, 73.0306]],
        apiEndpoint: 'https://api.cpcb.nic.in/mumbai',
        sensorTypes: ['traffic', 'industrial', 'coastal', 'construction'],
        timezone: 'Asia/Kolkata'
    },
    BANGALORE: {
        id: 'bangalore',
        name: 'Bangalore',
        center: [12.9716, 77.5946],
        bounds: [[12.8342, 77.4601], [13.1398, 77.7840]],
        apiEndpoint: 'https://api.cpcb.nic.in/bangalore',
        sensorTypes: ['traffic', 'construction', 'industrial'],
        timezone: 'Asia/Kolkata'
    }
};