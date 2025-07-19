// src/hooks/useMap.js
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export const useMap = (initialCenter, initialZoom) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current)
                .setView(initialCenter, initialZoom);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return { mapRef, mapInstance: mapInstanceRef.current };
};