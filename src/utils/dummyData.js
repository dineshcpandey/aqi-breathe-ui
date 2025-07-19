// ==================== src/utils/dummyData.js ====================

// Generate realistic dummy data for pollution sources around Anand Vihar, New Delhi
export const generateAnandViharPollutionData = () => {
    const baseLocation = { lat: 28.6469, lng: 77.3154 }; // Anand Vihar center

    // Helper function to generate coordinates around a center point
    const generateNearbyCoordinate = (center, radiusKm, direction = null) => {
        const earthRadiusKm = 6371;
        const radiusInDegrees = radiusKm / earthRadiusKm * (180 / Math.PI);

        const angle = direction !== null ? direction : Math.random() * 2 * Math.PI;
        const radius = Math.random() * radiusInDegrees;

        return {
            lat: parseFloat((center.lat + radius * Math.cos(angle)).toFixed(6)),
            lng: parseFloat((center.lng + radius * Math.sin(angle)).toFixed(6))
        };
    };

    // Construction sites data
    const constructionSites = [
        {
            id: 'const_001',
            ...generateNearbyCoordinate(baseLocation, 2.5, 0), // North
            source: 'construction',
            station: 'Anand Vihar Metro Construction',
            aqi: 195,
            pm25: 145.5,
            pm10: 285.2,
            co: 1.8,
            no2: 68.3,
            so2: 15.2,
            rh: 45, // Relative Humidity %
            temperature: 32.5, // °C
            windSpeed: 2.1, // m/s
            timestamp: new Date().toISOString(),
            severity: 'high',
            description: 'Active metro line construction with heavy machinery'
        },
        {
            id: 'const_002',
            ...generateNearbyCoordinate(baseLocation, 1.8, Math.PI / 4), // NE
            source: 'construction',
            station: 'Residential Complex Site',
            aqi: 178,
            pm25: 125.3,
            pm10: 245.8,
            co: 1.2,
            no2: 52.1,
            so2: 12.8,
            rh: 48,
            temperature: 31.8,
            windSpeed: 1.9,
            timestamp: new Date().toISOString(),
            severity: 'moderate',
            description: 'High-rise residential building under construction'
        },
        {
            id: 'const_003',
            ...generateNearbyCoordinate(baseLocation, 3.2, Math.PI), // West
            source: 'construction',
            station: 'Highway Widening Project',
            aqi: 205,
            pm25: 158.7,
            pm10: 312.4,
            co: 2.3,
            no2: 75.6,
            so2: 18.9,
            rh: 42,
            temperature: 33.2,
            windSpeed: 2.5,
            timestamp: new Date().toISOString(),
            severity: 'very_high',
            description: 'Major highway expansion with concrete crushing'
        },
        {
            id: 'const_004',
            ...generateNearbyCoordinate(baseLocation, 2.1, -Math.PI / 2), // South
            source: 'construction',
            station: 'Commercial Complex',
            aqi: 167,
            pm25: 118.2,
            pm10: 228.5,
            co: 1.5,
            no2: 48.7,
            so2: 11.3,
            rh: 50,
            temperature: 30.9,
            windSpeed: 1.7,
            timestamp: new Date().toISOString(),
            severity: 'moderate',
            description: 'Shopping mall construction site'
        },
        {
            id: 'const_005',
            ...generateNearbyCoordinate(baseLocation, 4.1, 3 * Math.PI / 4), // NW
            source: 'construction',
            station: 'Industrial Building Site',
            aqi: 218,
            pm25: 175.4,
            pm10: 365.8,
            co: 2.8,
            no2: 82.3,
            so2: 21.7,
            rh: 38,
            temperature: 34.1,
            windSpeed: 3.2,
            timestamp: new Date().toISOString(),
            severity: 'hazardous',
            description: 'Large industrial facility construction'
        }
    ];

    // Vehicle pollution hotspots
    const vehiclePollutionSites = [
        {
            id: 'vehicle_001',
            lat: 28.6469,
            lng: 77.3154, // Exactly at Anand Vihar
            source: 'vehicle',
            station: 'Anand Vihar Terminal',
            aqi: 185,
            pm25: 135.8,
            pm10: 198.3,
            co: 4.5, // Higher CO from vehicles
            no2: 89.7, // Higher NOx from diesel
            so2: 25.4,
            rh: 52,
            temperature: 35.6, // Heat island effect
            windSpeed: 1.3,
            timestamp: new Date().toISOString(),
            severity: 'high',
            description: 'Major bus terminal with heavy traffic congestion'
        },
        {
            id: 'vehicle_002',
            lat: 28.6512,
            lng: 77.3089, // NH24 Junction
            source: 'vehicle',
            station: 'NH24 Traffic Junction',
            aqi: 198,
            pm25: 145.6,
            pm10: 223.7,
            co: 5.2,
            no2: 95.3,
            so2: 28.9,
            rh: 49,
            temperature: 36.2,
            windSpeed: 1.1,
            timestamp: new Date().toISOString(),
            severity: 'high',
            description: 'Major highway intersection with continuous heavy traffic'
        },
        {
            id: 'vehicle_003',
            lat: 28.6425,
            lng: 77.3201, // Ring Road
            source: 'vehicle',
            station: 'Ring Road Corridor',
            aqi: 172,
            pm25: 128.4,
            pm10: 186.9,
            co: 3.8,
            no2: 76.2,
            so2: 22.1,
            rh: 55,
            temperature: 34.8,
            windSpeed: 1.8,
            timestamp: new Date().toISOString(),
            severity: 'moderate',
            description: 'Busy ring road with mixed vehicle types'
        },
        {
            id: 'vehicle_004',
            lat: 28.6398,
            lng: 77.3087, // Local market area
            source: 'vehicle',
            station: 'Karkardooma Market',
            aqi: 163,
            pm25: 118.9,
            pm10: 175.4,
            co: 3.2,
            no2: 68.5,
            so2: 19.7,
            rh: 58,
            temperature: 33.9,
            windSpeed: 1.5,
            timestamp: new Date().toISOString(),
            severity: 'moderate',
            description: 'Commercial area with moderate vehicle density'
        },
        {
            id: 'vehicle_005',
            lat: 28.6543,
            lng: 77.3198, // Shahdara area
            source: 'vehicle',
            station: 'Shahdara Flyover',
            aqi: 191,
            pm25: 142.7,
            pm10: 215.3,
            co: 4.9,
            no2: 88.1,
            so2: 26.8,
            rh: 47,
            temperature: 35.9,
            windSpeed: 1.2,
            timestamp: new Date().toISOString(),
            severity: 'high',
            description: 'Major flyover with diesel truck traffic'
        },
        {
            id: 'vehicle_006',
            lat: 28.6321,
            lng: 77.3267, // Preet Vihar
            source: 'vehicle',
            station: 'Preet Vihar Metro Station',
            aqi: 156,
            pm25: 112.3,
            pm10: 168.7,
            co: 2.9,
            no2: 61.4,
            so2: 17.8,
            rh: 61,
            temperature: 32.7,
            windSpeed: 2.1,
            timestamp: new Date().toISOString(),
            severity: 'moderate',
            description: 'Metro station area with auto-rickshaw stand'
        }
    ];

    // Dust pollution sources
    const dustSources = [
        {
            id: 'dust_001',
            lat: 28.6589,
            lng: 77.3089, // North of Anand Vihar
            source: 'dust',
            station: 'Open Ground Yamuna Bank',
            aqi: 203,
            pm25: 165.7,
            pm10: 385.2, // Very high PM10 from dust
            co: 1.1,
            no2: 35.8,
            so2: 8.9,
            rh: 35, // Low humidity increases dust
            temperature: 38.5,
            windSpeed: 4.2, // High wind spreads dust
            timestamp: new Date().toISOString(),
            severity: 'very_high',
            description: 'Large unpaved area near Yamuna river with loose soil'
        },
        {
            id: 'dust_002',
            lat: 28.6378,
            lng: 77.3298, // SE of Anand Vihar
            source: 'dust',
            station: 'Vacant Plot Patparganj',
            aqi: 176,
            pm25: 132.4,
            pm10: 298.7,
            co: 0.8,
            no2: 28.3,
            so2: 6.7,
            rh: 42,
            temperature: 36.8,
            windSpeed: 3.1,
            timestamp: new Date().toISOString(),
            severity: 'moderate',
            description: 'Large vacant plot with exposed soil and debris'
        },
        {
            id: 'dust_003',
            lat: 28.6287,
            lng: 77.3045, // SW of Anand Vihar
            source: 'dust',
            station: 'Quarry Site Mayur Vihar',
            aqi: 225,
            pm25: 195.3,
            pm10: 425.8,
            co: 1.3,
            no2: 42.1,
            so2: 12.4,
            rh: 28,
            temperature: 41.2,
            windSpeed: 5.8,
            timestamp: new Date().toISOString(),
            severity: 'hazardous',
            description: 'Active stone quarry with crushing operations'
        },
        {
            id: 'dust_004',
            lat: 28.6621,
            lng: 77.3234, // NE of Anand Vihar
            source: 'dust',
            station: 'Unpaved Parking Lot',
            aqi: 154,
            pm25: 108.9,
            pm10: 245.3,
            co: 0.6,
            no2: 22.7,
            so2: 5.2,
            rh: 48,
            temperature: 34.3,
            windSpeed: 2.7,
            timestamp: new Date().toISOString(),
            severity: 'moderate',
            description: 'Large unpaved vehicle parking area'
        },
        {
            id: 'dust_005',
            lat: 28.6412,
            lng: 77.2987, // West of Anand Vihar
            source: 'dust',
            station: 'Demolished Building Site',
            aqi: 189,
            pm25: 148.6,
            pm10: 342.1,
            co: 1.0,
            no2: 31.5,
            so2: 9.8,
            rh: 39,
            temperature: 37.9,
            windSpeed: 3.8,
            timestamp: new Date().toISOString(),
            severity: 'high',
            description: 'Recently demolished building with concrete debris'
        }
    ];

    // Combine all data
    const allPollutionData = [
        ...constructionSites,
        ...vehiclePollutionSites,
        ...dustSources
    ];

    return {
        constructionSites,
        vehiclePollutionSites,
        dustSources,
        allPollutionData,
        summary: {
            totalSites: allPollutionData.length,
            constructionCount: constructionSites.length,
            vehicleCount: vehiclePollutionSites.length,
            dustCount: dustSources.length,
            averageAQI: Math.round(allPollutionData.reduce((sum, site) => sum + site.aqi, 0) / allPollutionData.length),
            maxAQI: Math.max(...allPollutionData.map(site => site.aqi)),
            minAQI: Math.min(...allPollutionData.map(site => site.aqi))
        }
    };
};

// Enhanced AQI data with pollution sources for Anand Vihar area
export const anandViharAQIData = generateAnandViharPollutionData().allPollutionData;

// Helper functions for filtering data
export const filterDataBySource = (data, source) => {
    return data.filter(item => item.source === source);
};

export const filterDataByAQIRange = (data, minAQI, maxAQI) => {
    return data.filter(item => item.aqi >= minAQI && item.aqi <= maxAQI);
};

export const filterDataBySeverity = (data, severity) => {
    return data.filter(item => item.severity === severity);
};

// Get pollution statistics
export const getPollutionStats = (data) => {
    const stats = {};

    // Group by source
    data.forEach(item => {
        if (!stats[item.source]) {
            stats[item.source] = {
                count: 0,
                totalAQI: 0,
                avgPM25: 0,
                avgCO: 0,
                sites: []
            };
        }

        stats[item.source].count++;
        stats[item.source].totalAQI += item.aqi;
        stats[item.source].avgPM25 += item.pm25;
        stats[item.source].avgCO += item.co;
        stats[item.source].sites.push(item.station);
    });

    // Calculate averages
    Object.keys(stats).forEach(source => {
        const count = stats[source].count;
        stats[source].avgAQI = Math.round(stats[source].totalAQI / count);
        stats[source].avgPM25 = Math.round((stats[source].avgPM25 / count) * 10) / 10;
        stats[source].avgCO = Math.round((stats[source].avgCO / count) * 10) / 10;
    });

    return stats;
};

// Sample usage and testing
console.log('Generated Anand Vihar Pollution Data:');
const data = generateAnandViharPollutionData();
console.log('Summary:', data.summary);
console.log('Construction sites:', data.constructionCount);
console.log('Vehicle pollution sites:', data.vehicleCount);
console.log('Dust sources:', data.dustCount);
console.log('Pollution statistics:', getPollutionStats(data.allPollutionData));

// ==================== Updated src/utils/constants.js ====================
import { anandViharAQIData } from './dummyData';

// Use the new comprehensive dummy data
export const sampleAQIData = anandViharAQIData;

export const MAP_STYLES = {
    OSM: 'osm',
    TOPO: 'topo',
    SATELLITE: 'satellite',
    DARK: 'dark'
};

// Default map configuration from environment variables
export const DEFAULT_MAP_CONFIG = {
    center: [
        parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LAT) || 28.6469,
        parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LNG) || 77.3154
    ],
    zoom: parseInt(process.env.REACT_APP_MAP_DEFAULT_ZOOM) || 12
};

// AQI Color and status definitions
export const AQI_RANGES = {
    GOOD: { min: 0, max: 50, color: '#00e400', label: 'Good' },
    MODERATE: { min: 51, max: 100, color: '#ffff00', label: 'Moderate' },
    UNHEALTHY_SENSITIVE: { min: 101, max: 150, color: '#ff7e00', label: 'Unhealthy for Sensitive Groups' },
    UNHEALTHY: { min: 151, max: 200, color: '#ff0000', label: 'Unhealthy' },
    VERY_UNHEALTHY: { min: 201, max: 300, color: '#8f3f97', label: 'Very Unhealthy' },
    HAZARDOUS: { min: 301, max: 999, color: '#7e0023', label: 'Hazardous' }
};

// Source-specific styling
export const SOURCE_STYLES = {
    construction: {
        color: '#95a5a6',
        icon: '🏗️',
        name: 'Construction'
    },
    vehicle: {
        color: '#2c3e50',
        icon: '🚗',
        name: 'Vehicle'
    },
    dust: {
        color: '#f39c12',
        icon: '🌪️',
        name: 'Dust'
    }
};
