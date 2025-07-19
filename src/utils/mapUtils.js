import L from 'leaflet';

export const baseLayers = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }),

    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap contributors'
    }),

    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri'
    }),

    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO'
    })
};

export const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400';      // Good (Green)
    else if (aqi <= 100) return '#ffff00'; // Moderate (Yellow)
    else if (aqi <= 150) return '#ff7e00'; // Unhealthy for Sensitive (Orange)
    else if (aqi <= 200) return '#ff0000'; // Unhealthy (Red)
    else if (aqi <= 300) return '#8f3f97'; // Very Unhealthy (Purple)
    else return '#7e0023';                  // Hazardous (Maroon)
};

export const getAQIStatus = (aqi) => {
    if (aqi <= 50) return 'Good';
    else if (aqi <= 100) return 'Moderate';
    else if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    else if (aqi <= 200) return 'Unhealthy';
    else if (aqi <= 300) return 'Very Unhealthy';
    else return 'Hazardous';
};