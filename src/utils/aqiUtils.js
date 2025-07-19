import L from 'leaflet';

export const calculateDistance = (point1, point2) => {
    const latlng1 = L.latLng(point1.lat, point1.lng);
    const latlng2 = L.latLng(point2.lat, point2.lng);
    return latlng1.distanceTo(latlng2);
};

export const addAQIData = (existingData, newData) => {
    return [...existingData, ...newData];
};

export const filterAQIByThreshold = (data, threshold) => {
    return data.filter(point => point.aqi >= threshold);
};

export const getAverageAQI = (data) => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, point) => acc + point.aqi, 0);
    return sum / data.length;
};