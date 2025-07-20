# Enhanced AQI Data Generator

An advanced time-series data generator for Air Quality Index (AQI) monitoring systems that creates realistic sensor data for current, historical, and predicted scenarios.

## 🚀 Key Features

### ✅ Three Data Types Generated:
1. **Current Readings** (`current_reading.csv`) - Latest sensor readings at a specific timestamp
2. **Historical Data** (`historical_reading.csv`) - Time series data for trend analysis 
3. **Predicted Data** (`predicted_reading.csv`) - Forecasted readings with uncertainty modeling

### ✅ Enhanced Realism:
- **Daily Patterns**: Rush hours, work schedules, and night-time variations
- **Weekly Patterns**: Weekend reductions for industrial/construction sources
- **Seasonal Effects**: Temperature, humidity, and monsoon impacts
- **Source-Specific Behavior**: Different pollution patterns for each source type
- **Trend Modeling**: Long-term increases/decreases over time
- **Weather Integration**: Rain effects on particulate matter
- **Measurement Noise**: Realistic sensor variations and uncertainty

### ✅ Fully Configurable:
- **Date Ranges**: Custom start/end dates for all three datasets
- **Sensor Distribution**: Configurable counts by source type
- **Geographic Area**: Any location with lat/lng coordinates
- **Data Frequency**: From 15-minute to daily intervals
- **Environmental Conditions**: Season-specific weather patterns
- **Output Formats**: CSV files ready for GIS dashboard integration

## 📋 Generated Data Structure

### Current Readings Format
```csv
sensor_id,station,latitude,longitude,timestamp,aqi,pm25,pm10,co,no2,so2,temperature,humidity,wind_speed,source_type,severity,data_type,area
sensor_construction_001,Highway Expansion A,28.672436,77.315801,2025-07-20T14:30:00Z,240,142.8,321.2,2.29,41.7,27,38.1,44.2,4,construction,very_high,current,Anand Vihar
```

### Time Series Data Format
- Same structure as current readings but with multiple timestamps per sensor
- Historical data: 15th July - 20th July 2025 (configurable)
- Predicted data: 20th July - 23rd July 2025 (configurable) 
- Default interval: 1 hour (configurable from 15 minutes to daily)

### Sensor Locations (JSON)
```json
{
  "metadata": {
    "area": "Anand Vihar",
    "center": {"lat": 28.6469, "lng": 77.3154},
    "radius_km": 5.0,
    "total_sensors": 25
  },
  "sensors": [...]
}
```

## 🎯 Quick Start

### 1. Basic Usage (Default Anand Vihar)
```bash
node enhanced-data-generator.js
```
Generates 3 CSV files + 1 JSON file with default Anand Vihar configuration.

### 2. Different Scenarios
```bash
# Monsoon season data
node configuration-examples.js monsoon

# Connaught Place area  
node configuration-examples.js connaught-place

# High frequency monitoring (15-min intervals)
node configuration-examples.js high-frequency

# Winter season conditions
node configuration-examples.js winter
```

### 3. Custom Configuration
```javascript
const { setConfiguration, main } = require('./enhanced-data-generator');

setConfiguration({
  areaName: 'Gurgaon Cyber City',
  centerLat: 28.4595,
  centerLng: 77.0266,
  radiusKm: 4.0,
  
  timeConfig: {
    historicalStart: '2025-08-01T00:00:00Z',
    historicalEnd: '2025-08-07T23:59:59Z', 
    currentTime: '2025-08-07T15:30:00Z',
    predictedStart: '2025-08-07T16:00:00Z',
    predictedEnd: '2025-08-10T23:59:59Z',
    intervalMinutes: 30  // 30-minute intervals
  },
  
  sensorCounts: {
    construction: 8,
    vehicle: 10, 
    dust: 3,
    industrial: 6,
    residential: 4
  }
});

await main();
```

## 🏗️ Source Types & Characteristics

### 1. Construction Sites (🏗️)
- **Peak Hours**: 9 AM - 5 PM (work schedule)
- **Weekend Reduction**: 60% lower activity  
- **Primary Pollutants**: PM10, PM2.5, SO2
- **Trend**: Slight increase over time (ongoing projects)

### 2. Vehicle Emissions (🚗)
- **Peak Hours**: 7-9 AM, 5-8 PM (rush hours)
- **Weekend Reduction**: 25% lower traffic
- **Primary Pollutants**: CO, NO2, AQI  
- **Trend**: Slight increase (growing traffic)

### 3. Dust Sources (🌪️)
- **Peak Hours**: 12-4 PM (afternoon winds)
- **Weekend Reduction**: 10% (minimal change)
- **Primary Pollutants**: PM10, PM2.5
- **Trend**: Slight decrease (control measures)

### 4. Industrial Areas (🏭)
- **Peak Hours**: 9 AM - 5 PM (production schedule)
- **Weekend Reduction**: 30% lower activity
- **Primary Pollutants**: SO2, NO2, PM2.5
- **Trend**: Slight increase (industrial growth)

### 5. Residential Areas (🏠)
- **Peak Hours**: 6-8 AM, 6-8 PM (cooking times)
- **Weekend Reduction**: 5% (minimal change)
- **Primary Pollutants**: PM2.5, CO, SO2
- **Trend**: Small increase (population growth)

## 📊 Data Quality Features

### Realistic Variations
- **Hourly Patterns**: Source-specific peak and off-peak variations
- **Daily Cycles**: Natural circadian patterns in pollution
- **Weekly Cycles**: Work vs weekend differences
- **Seasonal Effects**: Temperature, humidity, monsoon impacts
- **Measurement Noise**: ±5-15% realistic sensor variations

### Weather Integration
- **Temperature Effects**: Higher temperatures increase pollution reactions
- **Humidity Impact**: Affects particulate matter and visibility  
- **Wind Speed**: Dispersion and dilution effects
- **Rain Effects**: 30% reduction in particulates during monsoon

### Prediction Uncertainty
- **Forecast Accuracy**: Decreases with time horizon
- **Uncertainty Modeling**: ±15% variance in predicted values
- **Trend Extrapolation**: Based on historical patterns
- **Weather Dependency**: Future conditions affect predictions

## 🎛️ Configuration Options

### Time Configuration
```javascript
timeConfig: {
  historicalStart: '2025-07-15T00:00:00Z',
  historicalEnd: '2025-07-20T23:59:59Z',
  currentTime: '2025-07-20T14:30:00Z', 
  predictedStart: '2025-07-20T15:00:00Z',
  predictedEnd: '2025-07-23T23:59:59Z',
  intervalMinutes: 60  // 15, 30, 60, 120, 360, 720, 1440
}
```

### Geographic Configuration
```javascript
areaName: 'Custom Area',
centerLat: 28.7041,
centerLng: 77.1025, 
radiusKm: 3.5  // Coverage area radius
```

### Sensor Distribution
```javascript
sensorCounts: {
  construction: 5,
  vehicle: 8,
  dust: 3, 
  industrial: 4,
  residential: 5
}
```

### Environmental Conditions
```javascript
environmentalBase: {
  temperature: { min: 32, max: 44, avg: 38 },
  humidity: { min: 25, max: 75, avg: 45 },
  windSpeed: { min: 1.5, max: 8.5, avg: 4.2 },
  monsoonFactor: 0.15  // Probability of rain effect
}
```

## 📁 Output Files

### Generated Files Structure:
```
generated_data/
├── current_reading.csv      # Latest readings (25 records)
├── historical_reading.csv   # 5-day hourly data (3,000 records)  
├── predicted_reading.csv    # 3-day hourly forecast (1,800 records)
└── sensor_locations.json    # Static sensor metadata
```

### File Sizes (Typical):
- **current_reading.csv**: ~2 KB (25 sensors)
- **historical_reading.csv**: ~400 KB (3,000 readings)
- **predicted_reading.csv**: ~240 KB (1,800 readings)  
- **sensor_locations.json**: ~8 KB (metadata + locations)

## 🔗 GIS Dashboard Integration

### Data Import Process:
1. **Current View**: Load `current_reading.csv` for real-time display
2. **Historical Analysis**: Import `historical_reading.csv` for trend charts
3. **Forecasting**: Use `predicted_reading.csv` for prediction visualization
4. **Sensor Management**: Load `sensor_locations.json` for station metadata

### Recommended Visualizations:
- **Current Status Map**: Color-coded markers by AQI level
- **Time Series Charts**: Historical trends by pollutant type
- **Prediction Confidence**: Forecast bands with uncertainty 
- **Source Analysis**: Filter/overlay by pollution source
- **Hotspot Detection**: High-pollution area identification

## 🛠️ Advanced Usage

### Batch Generation for Multiple Areas:
```javascript
const areas = [
  { name: 'Anand Vihar', lat: 28.6469, lng: 77.3154 },
  { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { name: 'Cyber City', lat: 28.4595, lng: 77.0266 }
];

for (const area of areas) {
  setConfiguration({
    areaName: area.name,
    centerLat: area.lat,
    centerLng: area.lng,
    output: { folder: `./data_${area.name.replace(' ', '_')}/` }
  });
  await main();
}
```

### Seasonal Data Generation:
```javascript
const seasons = [
  { name: 'summer', months: '2025-05-01', temp: [35, 45] },
  { name: 'monsoon', months: '2025-07-01', temp: [28, 38], monsoon: 0.7 },
  { name: 'winter', months: '2025-12-01', temp: [8, 22], monsoon: 0.02 }
];
```

## 🎯 Next Steps

1. **Run the generator** with your preferred configuration
2. **Import CSV files** into your GIS dashboard  
3. **Configure visualization** layers for each data type
4. **Set up data refresh** workflows for regular updates
5. **Customize styling** based on AQI color schemes

## 📈 Sample Output Statistics

### Anand Vihar Default Generation:
- **25 sensors** across 5 source types
- **3,000+ historical readings** (120 hours × 25 sensors)
- **1,800+ predicted readings** (72 hours × 25 sensors)  
- **AQI range**: 95-320 (realistic Delhi summer values)
- **File generation time**: ~2-5 seconds
- **Total data size**: ~650 KB

The enhanced generator creates production-ready datasets that accurately model real-world pollution patterns with configurable parameters for any geographic area and time period.