import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getColorForValue } from '../../utils/gridDataGenerator';

const GridLayer = ({
    gridData,
    selectedPollutant = 'aqi',
    map,
    isVisible = true
}) => {
    const gridLayerRef = useRef(null);
    const gridPolygonsRef = useRef({});

    useEffect(() => {
        if (!map) return;

        // Create layer group if it doesn't exist
        if (!gridLayerRef.current) {
            gridLayerRef.current = L.layerGroup();
        }

        // Clear existing polygons
        if (gridLayerRef.current) {
            gridLayerRef.current.clearLayers();
            gridPolygonsRef.current = {};
        }

        // Add grid polygons
        if (gridData && gridData.grids && isVisible) {
            gridData.grids.forEach(grid => {
                const value = grid[selectedPollutant];
                if (value === undefined) return;

                const colorInfo = getColorForValue(selectedPollutant, value);

                // Create polygon from grid corners
                const polygon = L.polygon(grid.corners, {
                    fillColor: colorInfo.color,
                    fillOpacity: colorInfo.opacity,
                    color: colorInfo.color,
                    weight: 1,
                    opacity: 0.8
                });

                // Create popup content
                const popupContent = `
          <div class="grid-popup">
            <h3>Grid Cell #${grid.id}</h3>
            <div class="popup-content">
              <p><strong>${selectedPollutant.toUpperCase()}:</strong> 
                <span style="color: ${colorInfo.color}; font-weight: bold;">${value}</span>
                ${gridData.colorSchemes[selectedPollutant]?.unit || ''}
              </p>
              <p><strong>Status:</strong> ${colorInfo.label}</p>
              <p><strong>Dominant Source:</strong> ${grid.dominantSource}</p>
              <p><strong>Weather:</strong> ${grid.weather}</p>
              <hr/>
              <p class="popup-coords">
                Center: ${grid.centerLat.toFixed(5)}, ${grid.centerLng.toFixed(5)}<br/>
                Distance from Anand Vihar: ${(grid.distanceFromCenter / 1000).toFixed(1)}km
              </p>
              <p class="popup-time">
                Data Time: ${new Date(grid.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        `;

                polygon.bindPopup(popupContent);

                // Add hover effects
                polygon.on('mouseover', function (e) {
                    this.setStyle({
                        weight: 2,
                        opacity: 1.0,
                        fillOpacity: Math.min(colorInfo.opacity + 0.2, 1.0)
                    });
                });

                polygon.on('mouseout', function (e) {
                    this.setStyle({
                        weight: 1,
                        opacity: 0.8,
                        fillOpacity: colorInfo.opacity
                    });
                });

                gridLayerRef.current.addLayer(polygon);
                gridPolygonsRef.current[grid.id] = polygon;
            });

            // Add to map if not already added
            if (!map.hasLayer(gridLayerRef.current)) {
                map.addLayer(gridLayerRef.current);
            }
        }

        return () => {
            if (gridLayerRef.current && map.hasLayer(gridLayerRef.current)) {
                map.removeLayer(gridLayerRef.current);
            }
        };
    }, [map, gridData, selectedPollutant, isVisible]);

    // Handle visibility toggle
    useEffect(() => {
        if (!map || !gridLayerRef.current) return;

        if (isVisible) {
            if (!map.hasLayer(gridLayerRef.current)) {
                map.addLayer(gridLayerRef.current);
            }
        } else {
            if (map.hasLayer(gridLayerRef.current)) {
                map.removeLayer(gridLayerRef.current);
            }
        }
    }, [map, isVisible]);

    return null; // This is a map layer component, no JSX render needed
};

export default GridLayer;