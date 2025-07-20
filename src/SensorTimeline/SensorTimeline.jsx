import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SensorTimeline = ({ sensorData, selectedSensor, selectedPollutant = 'aqi' }) => {
    const [timeRange, setTimeRange] = useState(24); // hours

    const chartData = useMemo(() => {
        if (!selectedSensor || !selectedSensor.timeSeries) return [];

        const now = new Date();
        const cutoff = new Date(now.getTime() - timeRange * 60 * 60 * 1000);

        return selectedSensor.timeSeries
            .filter(point => new Date(point.timestamp) >= cutoff)
            .map(point => ({
                time: new Date(point.timestamp).toLocaleTimeString(),
                [selectedPollutant]: point[selectedPollutant],
                timestamp: point.timestamp
            }));
    }, [selectedSensor, selectedPollutant, timeRange]);

    const pollutantConfig = {
        aqi: { color: '#e74c3c', unit: 'AQI' },
        pm25: { color: '#3498db', unit: 'µg/m³' },
        pm10: { color: '#9b59b6', unit: 'µg/m³' },
        co: { color: '#e67e22', unit: 'ppm' },
        no2: { color: '#27ae60', unit: 'µg/m³' },
        so2: { color: '#f39c12', unit: 'µg/m³' }
    };

    const config = pollutantConfig[selectedPollutant] || pollutantConfig.aqi;

    return (
        <div className="sensor-timeline">
            <div className="timeline-header">
                <h3>{selectedSensor?.station} - {selectedPollutant.toUpperCase()}</h3>
                <div className="timeline-controls">
                    <select value={timeRange} onChange={(e) => setTimeRange(Number(e.target.value))}>
                        <option value={1}>Last Hour</option>
                        <option value={6}>Last 6 Hours</option>
                        <option value={24}>Last 24 Hours</option>
                        <option value={168}>Last Week</option>
                    </select>
                </div>
            </div>

            <div className="timeline-chart">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => [`${value} ${config.unit}`, selectedPollutant.toUpperCase()]}
                            labelFormatter={(label) => `Time: ${label}`}
                        />
                        <Line
                            type="monotone"
                            dataKey={selectedPollutant}
                            stroke={config.color}
                            strokeWidth={2}
                            dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};