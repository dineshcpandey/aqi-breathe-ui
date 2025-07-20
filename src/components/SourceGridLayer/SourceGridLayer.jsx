import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getSourceColorAndOpacity } from '../../utils/sourceBasedGridGenerator';

const SourceGridLayer = ({
    gridData,
    activeSourceFilters = [],
    map,
    isVisible = true
}) => {
    const sourceLayersRef = useRef({});

    useEffect(() => {
        if (!map || !gridData) return;

        // Clear existing layers
        Object.values(sourceLayersRef.current).forEach(layer => {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
        sourceLayersRef.current = {};

        if (!isVisible || activeSourceFilters.length === 0) {
            return;
        }

        // Create layers for each active source
        activeSourceFilters.forEach(sourceName => {
            const sourceLayer = L.layerGroup();

            gridData.grids.forEach(grid => {
                const contribution = grid.sourceContributions[sourceName];
                if (contribution <= 0) return; // Skip grids with no contribution

                const colorInfo = getSourceColorAndOpacity(sourceName, contribution);

                // Create polygon for this source
                const polygon = L.polygon(grid.corners, {
                    fillColor: colorInfo.color,
                    fillOpacity: colorInfo.opacity,
                    color: colorInfo.color,
                    weight: 0.5,
                    opacity: 0.7
                });

                // Create popup content
                const popupContent = `
          <div class="source-grid-popup">
            <h3>Grid Cell #${grid.id}</h3>
            <div class="source-contribution-info">
              <h4>${sourceName.charAt(0).toUpperCase() + sourceName.slice(1)} Contribution</h4>
              <p><strong>Contribution:</strong> 
                <span style="color: ${colorInfo.color}; font-weight: bold;">${contribution}%</span>
                of total AQI
              </p>
              <p><strong>Impact Level:</strong> ${colorInfo.label}</p>
              <p><strong>Total AQI:</strong> ${grid.aqi}</p>
              <hr/>
              <h5>All Source Contributions:</h5>
              <p>🏗️ Construction: ${grid.sourceContributions.construction}%</p>
              <p>🚗 Vehicle: ${grid.sourceContributions.vehicle}%</p>
              <p>🌪️ Dust: ${grid.sourceContributions.dust}%</p>
              <p>🏭 Other: ${grid.sourceContributions.other}%</p>
              <hr/>
              <p class="popup-coords">
                Center: ${grid.centerLat.toFixed(5)}, ${grid.centerLng.toFixed(5)}<br/>
                Distance: ${(grid.distanceFromCenter / 1000).toFixed(1)}km from Anand Vihar
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
                        weight: 0.5,
                        opacity: 0.7,
                        fillOpacity: colorInfo.opacity
                    });
                });

                sourceLayer.addLayer(polygon);
            });

            sourceLayersRef.current[sourceName] = sourceLayer;
            map.addLayer(sourceLayer);
        });

    }, [map, gridData, activeSourceFilters, isVisible]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(sourceLayersRef.current).forEach(layer => {
                if (map && map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            });
        };
    }, [map]);

    return null;
};

export default SourceGridLayer;