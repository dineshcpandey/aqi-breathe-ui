export const sampleAQIData = [
    { lat: 40.7589, lng: -73.9851, aqi: 85, station: "Times Square" },
    { lat: 40.6892, lng: -74.0445, aqi: 120, station: "Brooklyn Bridge" },
    { lat: 40.7831, lng: -73.9712, aqi: 65, station: "Central Park" },
    { lat: 40.7505, lng: -73.9934, aqi: 95, station: "Penn Station" },
    { lat: 40.7282, lng: -74.0776, aqi: 110, station: "Battery Park" }
];

export const MAP_STYLES = {
    OSM: 'osm',
    TOPO: 'topo',
    SATELLITE: 'satellite',
    DARK: 'dark'
};

export const DEFAULT_MAP_CONFIG = {
    center: [
        parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LAT) || 28.6469,
        parseFloat(process.env.REACT_APP_MAP_DEFAULT_CENTER_LNG) || 77.3154
    ],
    zoom: parseInt(process.env.REACT_APP_MAP_DEFAULT_ZOOM) || 12
};