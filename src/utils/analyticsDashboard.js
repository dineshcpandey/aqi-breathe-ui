import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard = ({
    sensorData = [],
    gridData = null,
    timeRange = '24h',
    onTimeRangeChange,
    isVisible = false
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedMetric, setSelectedMetric] = useState('aqi');
    const [isLoading, setIsLoading] = useState(false);
    const [alertsData, setAlertsData] = useState([]);

    // Time series data processing
    const timeSeriesData = useMemo(() => {
        if (!sensorData.length) return [];

        // Generate hourly aggregated data for the past 24 hours
        const hours = parseInt(timeRange) || 24;
        const now = new Date();
        const data = [];

        for (let i = hours - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hour = time.getHours();

            // Simulate historical data with some variation
            const baseValues = sensorData.reduce((acc, sensor) => {
                acc.aqi += sensor.aqi;
                acc.pm25 += sensor.pm25;
                acc.pm10 += sensor.pm10;
                acc.co += sensor.co;
                acc.no2 += sensor.no2;
                acc.so2 += sensor.so2;
                return acc;
            }, { aqi: 0, pm25: 0, pm10: 0, co: 0, no2: 0, so2: 0 });

            // Apply time-based variations
            const timeMultiplier = getTimeBasedMultiplier(hour);
            const randomVariation = 0.8 + Math.random() * 0.4;

            data.push({
                time: time.toISOString(),
                timeLabel: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                aqi: Math.round((baseValues.aqi / sensorData.length) * timeMultiplier * randomVariation),
                pm25: Math.round((baseValues.pm25 / sensorData.length) * timeMultiplier * randomVariation * 100) / 100,
                pm10: Math.round((baseValues.pm10 / sensorData.length) * timeMultiplier * randomVariation * 100) / 100,
                co: Math.round((baseValues.co / sensorData.length) * timeMultiplier * randomVariation * 100) / 100,
                no2: Math.round((baseValues.no2 / sensorData.length) * timeMultiplier * randomVariation * 100) / 100,
                so2: Math.round((baseValues.so2 / sensorData.length) * timeMultiplier * randomVariation * 100) / 100
            });
        }

        return data;
    }, [sensorData, timeRange]);

    // Key statistics
    const statistics = useMemo(() => {
        if (!sensorData.length) return {};

        const stats = {
            totalSensors: sensorData.length,
            averageAQI: Math.round(sensorData.reduce((sum, s) => sum + s.aqi, 0) / sensorData.length),
            maxAQI: Math.max(...sensorData.map(s => s.aqi)),
            minAQI: Math.min(...sensorData.map(s => s.aqi))
        };

        // Severity distribution
        stats.severityDistribution = sensorData.reduce((acc, sensor) => {
            acc[sensor.severity] = (acc[sensor.severity] || 0) + 1;
            return acc;
        }, {});

        // Source distribution
        stats.sourceDistribution = sensorData.reduce((acc, sensor) => {
            acc[sensor.source] = (acc[sensor.source] || 0) + 1;
            return acc;
        }, {});

        // Trend analysis
        if (timeSeriesData.length >= 2) {
            const latest = timeSeriesData[timeSeriesData.length - 1];
            const previous = timeSeriesData[timeSeriesData.length - 2];
            stats.trend = {
                aqi: latest.aqi - previous.aqi,
                pm25: latest.pm25 - previous.pm25,
                direction: latest.aqi > previous.aqi ? 'up' : latest.aqi < previous.aqi ? 'down' : 'stable'
            };
        }

        return stats;
    }, [sensorData, timeSeriesData]);

    // Hotspot analysis
    const hotspots = useMemo(() => {
        return sensorData
            .filter(sensor => sensor.aqi > 150)
            .sort((a, b) => b.aqi - a.aqi)
            .slice(0, 10)
            .map((sensor, index) => ({
                rank: index + 1,
                ...sensor
            }));
    }, [sensorData]);

    // Chart colors
    const colors = {
        aqi: '#e74c3c',
        pm25: '#3498db',
        pm10: '#9b59b6',
        co: '#f39c12',
        no2: '#27ae60',
        so2: '#e67e22'
    };

    const severityColors = {
        moderate: '#f39c12',
        high: '#e74c3c',
        very_high: '#8e44ad',
        hazardous: '#7b241c'
    };

    if (!isVisible) return null;

    return (
        <div className="analytics-dashboard">
            {/* Dashboard Header */}
            <div className="dashboard-header">
                <div className="header-content">
                    <h2>📊 Air Quality Analytics</h2>
                    <div className="header-controls">
                        <select
                            value={timeRange}
                            onChange={(e) => onTimeRangeChange(e.target.value)}
                            className="time-range-select"
                        >
                            <option value="1h">Last Hour</option>
                            <option value="6h">Last 6 Hours</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                        <button className="refresh-btn" onClick={() => window.location.reload()}>
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="tab-navigation">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📈 Overview
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
                        onClick={() => setActiveTab('trends')}
                    >
                        📊 Trends
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'hotspots' ? 'active' : ''}`}
                        onClick={() => setActiveTab('hotspots')}
                    >
                        🎯 Hotspots
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sources')}
                    >
                        🏭 Sources
                    </button>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="dashboard-content">

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        {/* Key Metrics Cards */}
                        <div className="metrics-grid">
                            <div className="metric-card primary">
                                <div className="metric-header">
                                    <h3>Average AQI</h3>
                                    <span className="metric-icon">🌫️</span>
                                </div>
                                <div className="metric-value">{statistics.averageAQI}</div>
                                <div className="metric-subtext">
                                    {statistics.trend && (
                                        <span className={`trend ${statistics.trend.direction}`}>
                                            {statistics.trend.direction === 'up' ? '↗️' :
                                                statistics.trend.direction === 'down' ? '↘️' : '➡️'}
                                            {statistics.trend.aqi > 0 ? '+' : ''}{statistics.trend.aqi}
                                        </span>
                                    )}
                                    from last hour
                                </div>
                            </div>

                            <div className="metric-card">
                                <div className="metric-header">
                                    <h3>Total Sensors</h3>
                                    <span className="metric-icon">📡</span>
                                </div>
                                <div className="metric-value">{statistics.totalSensors}</div>
                                <div className="metric-subtext">monitoring stations</div>
                            </div>

                            <div className="metric-card alert">
                                <div className="metric-header">
                                    <h3>High Alert</h3>
                                    <span className="metric-icon">⚠️</span>
                                </div>
                                <div className="metric-value">
                                    {statistics.severityDistribution?.high || 0 +
                                        statistics.severityDistribution?.very_high || 0 +
                                        statistics.severityDistribution?.hazardous || 0}
                                </div>
                                <div className="metric-subtext">stations need attention</div>
                            </div>

                            <div className="metric-card range">
                                <div className="metric-header">
                                    <h3>AQI Range</h3>
                                    <span className="metric-icon">📊</span>
                                </div>
                                <div className="metric-value-small">
                                    {statistics.minAQI} - {statistics.maxAQI}
                                </div>
                                <div className="metric-subtext">min - max values</div>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="charts-row">
                            {/* Time Series Chart */}
                            <div className="chart-container large">
                                <div className="chart-header">
                                    <h3>AQI Trend - Last {timeRange}</h3>
                                    <div className="chart-controls">
                                        <select
                                            value={selectedMetric}
                                            onChange={(e) => setSelectedMetric(e.target.value)}
                                        >
                                            <option value="aqi">AQI</option>
                                            <option value="pm25">PM2.5</option>
                                            <option value="pm10">PM10</option>
                                            <option value="co">CO</option>
                                            <option value="no2">NO₂</option>
                                            <option value="so2">SO₂</option>
                                        </select>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="timeLabel"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value) => [value, selectedMetric.toUpperCase()]}
                                            labelFormatter={(label) => `Time: ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey={selectedMetric}
                                            stroke={colors[selectedMetric]}
                                            fill={colors[selectedMetric]}
                                            fillOpacity={0.3}
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Severity Distribution */}
                            <div className="chart-container">
                                <div className="chart-header">
                                    <h3>Severity Distribution</h3>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={Object.entries(statistics.severityDistribution || {}).map(([severity, count]) => ({
                                                name: severity.replace('_', ' '),
                                                value: count,
                                                color: severityColors[severity]
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {Object.entries(statistics.severityDistribution || {}).map(([severity], index) => (
                                                <Cell key={`cell-${index}`} fill={severityColors[severity]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                    <div className="trends-tab">
                        <div className="multi-pollutant-chart">
                            <div className="chart-header">
                                <h3>Multi-Pollutant Trends</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={timeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timeLabel" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="aqi" stroke={colors.aqi} strokeWidth={2} />
                                    <Line type="monotone" dataKey="pm25" stroke={colors.pm25} strokeWidth={2} />
                                    <Line type="monotone" dataKey="pm10" stroke={colors.pm10} strokeWidth={2} />
                                    <Line type="monotone" dataKey="co" stroke={colors.co} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="correlation-analysis">
                            <h3>Pollutant Correlations</h3>
                            <div className="correlation-grid">
                                <div className="correlation-item">
                                    <span className="correlation-label">PM2.5 ↔ PM10</span>
                                    <div className="correlation-bar">
                                        <div className="correlation-fill" style={{ width: '85%' }}></div>
                                    </div>
                                    <span className="correlation-value">0.85</span>
                                </div>
                                <div className="correlation-item">
                                    <span className="correlation-label">CO ↔ NO₂</span>
                                    <div className="correlation-bar">
                                        <div className="correlation-fill" style={{ width: '72%' }}></div>
                                    </div>
                                    <span className="correlation-value">0.72</span>
                                </div>
                                <div className="correlation-item">
                                    <span className="correlation-label">AQI ↔ PM2.5</span>
                                    <div className="correlation-bar">
                                        <div className="correlation-fill" style={{ width: '91%' }}></div>
                                    </div>
                                    <span className="correlation-value">0.91</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hotspots Tab */}
                {activeTab === 'hotspots' && (
                    <div className="hotspots-tab">
                        <div className="hotspots-header">
                            <h3>🎯 Top 10 Pollution Hotspots</h3>
                            <p>Locations with highest AQI readings</p>
                        </div>

                        <div className="hotspots-list">
                            {hotspots.map((hotspot) => (
                                <div key={hotspot.id} className="hotspot-item">
                                    <div className="hotspot-rank">#{hotspot.rank}</div>
                                    <div className="hotspot-info">
                                        <div className="hotspot-name">{hotspot.station}</div>
                                        <div className="hotspot-source">
                                            {getSourceIcon(hotspot.source)} {hotspot.source}
                                        </div>
                                        <div className="hotspot-location">
                                            📍 {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
                                        </div>
                                    </div>
                                    <div className="hotspot-readings">
                                        <div className="hotspot-aqi" style={{ backgroundColor: getAQIColor(hotspot.aqi) }}>
                                            {hotspot.aqi}
                                        </div>
                                        <div className="hotspot-details">
                                            <div>PM2.5: {hotspot.pm25}</div>
                                            <div>PM10: {hotspot.pm10}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hotspots.length === 0 && (
                            <div className="no-hotspots">
                                <div className="no-hotspots-icon">🎉</div>
                                <h3>No High Pollution Areas</h3>
                                <p>All monitoring stations are within acceptable limits!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Sources Tab */}
                {activeTab === 'sources' && (
                    <div className="sources-tab">
                        <div className="source-distribution">
                            <div className="chart-header">
                                <h3>Pollution Sources Distribution</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={Object.entries(statistics.sourceDistribution || {}).map(([source, count]) => ({
                                    source: source.charAt(0).toUpperCase() + source.slice(1),
                                    count,
                                    percentage: Math.round((count / statistics.totalSensors) * 100)
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="source" />
                                    <YAxis />
                                    <Tooltip formatter={(value, name) => [
                                        name === 'count' ? `${value} stations` : `${value}%`,
                                        name === 'count' ? 'Station Count' : 'Percentage'
                                    ]} />
                                    <Bar dataKey="count" fill="#3498db" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="source-analysis">
                            <h3>Source Impact Analysis</h3>
                            <div className="source-cards">
                                {Object.entries(statistics.sourceDistribution || {}).map(([source, count]) => {
                                    const avgAQI = Math.round(
                                        sensorData.filter(s => s.source === source)
                                            .reduce((sum, s) => sum + s.aqi, 0) / count
                                    );

                                    return (
                                        <div key={source} className="source-card">
                                            <div className="source-card-header">
                                                <span className="source-icon">{getSourceIcon(source)}</span>
                                                <h4>{source.charAt(0).toUpperCase() + source.slice(1)}</h4>
                                            </div>
                                            <div className="source-stats">
                                                <div className="stat">
                                                    <span className="stat-value">{count}</span>
                                                    <span className="stat-label">Stations</span>
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-value">{avgAQI}</span>
                                                    <span className="stat-label">Avg AQI</span>
                                                </div>
                                                <div className="stat">
                                                    <span className="stat-value">
                                                        {Math.round((count / statistics.totalSensors) * 100)}%
                                                    </span>
                                                    <span className="stat-label">Share</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .analytics-dashboard {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: #f8f9fa;
                    overflow: hidden;
                }

                .dashboard-header {
                    background: white;
                    border-bottom: 1px solid #e0e0e0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                }

                .header-content h2 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 1.5rem;
                }

                .header-controls {
                    display: flex;
                    gap: 12px;
                }

                .time-range-select, .refresh-btn {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: white;
                    cursor: pointer;
                }

                .refresh-btn {
                    background: #3498db;
                    color: white;
                    border-color: #3498db;
                }

                .tab-navigation {
                    display: flex;
                    border-top: 1px solid #e0e0e0;
                }

                .tab-btn {
                    padding: 12px 20px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-bottom: 3px solid transparent;
                    font-weight: 500;
                }

                .tab-btn:hover {
                    background: #f8f9fa;
                }

                .tab-btn.active {
                    border-bottom-color: #3498db;
                    color: #3498db;
                    background: #f8f9fa;
                }

                .dashboard-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .metric-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border-left: 4px solid #3498db;
                }

                .metric-card.primary { border-left-color: #e74c3c; }
                .metric-card.alert { border-left-color: #f39c12; }
                .metric-card.range { border-left-color: #27ae60; }

                .metric-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .metric-header h3 {
                    margin: 0;
                    font-size: 0.9rem;
                    color: #7f8c8d;
                    text-transform: uppercase;
                    font-weight: 600;
                }

                .metric-icon {
                    font-size: 1.2rem;
                    opacity: 0.7;
                }

                .metric-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 4px;
                }

                .metric-value-small {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 4px;
                }

                .metric-subtext {
                    font-size: 0.8rem;
                    color: #7f8c8d;
                }

                .trend {
                    font-weight: 600;
                    margin-right: 4px;
                }
                .trend.up { color: #e74c3c; }
                .trend.down { color: #27ae60; }
                .trend.stable { color: #95a5a6; }

                .charts-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .chart-container {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .chart-container.large {
                    grid-column: span 1;
                }

                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .chart-header h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 1.1rem;
                }

                .chart-controls select {
                    padding: 4px 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 0.9rem;
                }

                .multi-pollutant-chart,
                .correlation-analysis {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }

                .correlation-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .correlation-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .correlation-label {
                    min-width: 100px;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .correlation-bar {
                    flex: 1;
                    height: 8px;
                    background: #f1f3f4;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .correlation-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #3498db, #2980b9);
                    border-radius: 4px;
                }

                .correlation-value {
                    min-width: 40px;
                    text-align: right;
                    font-weight: 600;
                    color: #2c3e50;
                }

                .hotspots-header {
                    margin-bottom: 20px;
                }

                .hotspots-header h3 {
                    margin: 0 0 8px 0;
                    color: #2c3e50;
                }

                .hotspots-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .hotspot-item {
                    background: white;
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .hotspot-rank {
                    width: 40px;
                    height: 40px;
                    border-radius: 20px;
                    background: #3498db;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 0.9rem;
                }

                .hotspot-info {
                    flex: 1;
                }

                .hotspot-name {
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 4px;
                }

                .hotspot-source, .hotspot-location {
                    font-size: 0.8rem;
                    color: #7f8c8d;
                    margin-bottom: 2px;
                }

                .hotspot-readings {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .hotspot-aqi {
                    width: 50px;
                    height: 50px;
                    border-radius: 25px;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 1.1rem;
                }

                .hotspot-details {
                    font-size: 0.8rem;
                    color: #7f8c8d;
                }

                .no-hotspots {
                    text-align: center;
                    padding: 60px 20px;
                    color: #7f8c8d;
                }

                .no-hotspots-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .source-distribution {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }

                .source-analysis {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .source-analysis h3 {
                    margin: 0 0 16px 0;
                    color: #2c3e50;
                }

                .source-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                }

                .source-card {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 16px;
                    border: 1px solid #e0e0e0;
                }

                .source-card-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .source-card-header h4 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 1rem;
                }

                .source-icon {
                    font-size: 1.2rem;
                }

                .source-stats {
                    display: flex;
                    justify-content: space-between;
                }

                .stat {
                    text-align: center;
                }

                .stat-value {
                    display: block;
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #2c3e50;
                }

                .stat-label {
                    font-size: 0.8rem;
                    color: #7f8c8d;
                }

                @media (max-width: 768px) {
                    .charts-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .metrics-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .header-content {
                        flex-direction: column;
                        gap: 12px;
                    }
                    
                    .tab-navigation {
                        overflow-x: auto;
                    }
                    
                    .source-cards {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

// Helper functions
const getTimeBasedMultiplier = (hour) => {
    // Rush hours have higher pollution
    if (hour >= 8 && hour <= 10) return 1.4; // Morning rush
    if (hour >= 17 && hour <= 20) return 1.5; // Evening rush
    if (hour >= 22 || hour <= 6) return 0.7; // Night time
    return 1.0; // Normal hours
};

const getSourceIcon = (source) => {
    const icons = {
        construction: '🏗️',
        vehicle: '🚗',
        dust: '🌪️',
        industrial: '🏭',
        residential: '🏠'
    };
    return icons[source] || '📍';
};

const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400';
    else if (aqi <= 100) return '#ffff00';
    else if (aqi <= 150) return '#ff7e00';
    else if (aqi <= 200) return '#ff0000';
    else if (aqi <= 300) return '#8f3f97';
    else return '#7e0023';
};

export default AnalyticsDashboard;