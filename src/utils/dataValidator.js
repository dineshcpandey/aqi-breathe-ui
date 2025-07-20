// src/utils/dataValidator.js - Helper to validate CSV data compatibility
import externalDataLoader from './externalDataLoader';
import { anandViharAQIData } from './dummyData';

export class DataValidator {
    constructor() {
        this.validationResults = {};
    }

    /**
     * Compare CSV data structure with dummy data to ensure compatibility
     */
    async validateCSVCompatibility(csvFilename = 'generated_data/current_reading.csv') {
        console.log('🔍 Starting CSV data validation...');

        try {
            // Load CSV data
            const csvData = await externalDataLoader.loadSensorDataFromCSV(csvFilename);

            if (!csvData || csvData.length === 0) {
                throw new Error('No data loaded from CSV');
            }

            // Compare with dummy data structure
            const dummySample = anandViharAQIData[0];
            const csvSample = csvData[0];

            const validation = {
                csvFile: csvFilename,
                csvRecordCount: csvData.length,
                dummyRecordCount: anandViharAQIData.length,
                timestamp: new Date().toISOString(),
                compatibility: {
                    fieldMatches: this.compareFields(dummySample, csvSample),
                    dataTypes: this.validateDataTypes(csvSample),
                    requiredFields: this.checkRequiredFields(csvSample),
                    coordinateRange: this.validateCoordinates(csvData),
                    pollutantValues: this.validatePollutantRanges(csvData),
                    sourceDistribution: this.analyzeSourceDistribution(csvData)
                },
                status: 'unknown'
            };

            // Determine overall compatibility status
            const issues = this.identifyIssues(validation.compatibility);
            validation.status = issues.length === 0 ? 'compatible' : 'issues_found';
            validation.issues = issues;
            validation.recommendations = this.generateRecommendations(issues);

            this.validationResults = validation;
            this.printValidationReport(validation);

            return validation;

        } catch (error) {
            console.error('❌ CSV validation failed:', error.message);
            return {
                csvFile: csvFilename,
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Compare field names between dummy and CSV data
     */
    compareFields(dummySample, csvSample) {
        const dummyFields = Object.keys(dummySample);
        const csvFields = Object.keys(csvSample);

        return {
            dummyFields: dummyFields.sort(),
            csvFields: csvFields.sort(),
            missingInCSV: dummyFields.filter(field => !csvFields.includes(field)),
            extraInCSV: csvFields.filter(field => !dummyFields.includes(field)),
            commonFields: dummyFields.filter(field => csvFields.includes(field))
        };
    }

    /**
     * Validate data types for critical fields
     */
    validateDataTypes(csvSample) {
        const typeChecks = {
            id: typeof csvSample.id === 'string',
            lat: typeof csvSample.lat === 'number' && !isNaN(csvSample.lat),
            lng: typeof csvSample.lng === 'number' && !isNaN(csvSample.lng),
            station: typeof csvSample.station === 'string',
            source: typeof csvSample.source === 'string',
            aqi: typeof csvSample.aqi === 'number' && !isNaN(csvSample.aqi),
            pm25: typeof csvSample.pm25 === 'number' && !isNaN(csvSample.pm25),
            pm10: typeof csvSample.pm10 === 'number' && !isNaN(csvSample.pm10),
            severity: typeof csvSample.severity === 'string',
            timestamp: typeof csvSample.timestamp === 'string'
        };

        return typeChecks;
    }

    /**
     * Check for required fields
     */
    checkRequiredFields(csvSample) {
        const requiredFields = ['id', 'lat', 'lng', 'station', 'source', 'aqi', 'severity'];
        const missingFields = requiredFields.filter(field =>
            csvSample[field] === undefined || csvSample[field] === null
        );

        return {
            required: requiredFields,
            missing: missingFields,
            allPresent: missingFields.length === 0
        };
    }

    /**
     * Validate coordinate ranges (should be near Anand Vihar)
     */
    validateCoordinates(csvData) {
        const anandViharCenter = { lat: 28.6469, lng: 77.3154 };
        const maxDistanceKm = 5; // Should be within 5km radius

        const coordinates = csvData.map(sensor => ({
            id: sensor.id,
            lat: sensor.lat,
            lng: sensor.lng,
            distance: this.calculateDistance(sensor.lat, sensor.lng, anandViharCenter.lat, anandViharCenter.lng)
        }));

        const outOfRange = coordinates.filter(coord => coord.distance > maxDistanceKm);

        return {
            totalSensors: csvData.length,
            withinRange: coordinates.length - outOfRange.length,
            outOfRange: outOfRange.length,
            maxDistance: Math.max(...coordinates.map(c => c.distance)),
            avgDistance: coordinates.reduce((sum, c) => sum + c.distance, 0) / coordinates.length,
            outOfRangeSensors: outOfRange
        };
    }

    /**
     * Validate pollutant value ranges (realistic for Delhi)
     */
    validatePollutantRanges(csvData) {
        const expectedRanges = {
            aqi: { min: 50, max: 500 },
            pm25: { min: 20, max: 250 },
            pm10: { min: 30, max: 500 },
            co: { min: 0.5, max: 10 },
            no2: { min: 10, max: 150 },
            so2: { min: 5, max: 80 }
        };

        const analysis = {};

        Object.keys(expectedRanges).forEach(pollutant => {
            const values = csvData.map(sensor => sensor[pollutant]).filter(v => v !== undefined && v !== null);

            if (values.length > 0) {
                const min = Math.min(...values);
                const max = Math.max(...values);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const expected = expectedRanges[pollutant];

                analysis[pollutant] = {
                    min: Math.round(min * 100) / 100,
                    max: Math.round(max * 100) / 100,
                    avg: Math.round(avg * 100) / 100,
                    expected: expected,
                    withinRange: min >= expected.min && max <= expected.max,
                    count: values.length
                };
            }
        });

        return analysis;
    }

    /**
     * Analyze source distribution
     */
    analyzeSourceDistribution(csvData) {
        const distribution = {};
        csvData.forEach(sensor => {
            distribution[sensor.source] = (distribution[sensor.source] || 0) + 1;
        });

        const expectedSources = ['construction', 'vehicle', 'dust'];
        const missingSources = expectedSources.filter(source => !distribution[source]);

        return {
            distribution,
            totalSources: Object.keys(distribution).length,
            expectedSources,
            missingSources,
            hasAllExpectedSources: missingSources.length === 0
        };
    }

    /**
     * Calculate distance between two coordinates (km)
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Identify potential issues
     */
    identifyIssues(compatibility) {
        const issues = [];

        // Field compatibility issues
        if (compatibility.fieldMatches.missingInCSV.length > 0) {
            issues.push({
                type: 'missing_fields',
                severity: 'high',
                message: `Missing required fields: ${compatibility.fieldMatches.missingInCSV.join(', ')}`
            });
        }

        // Required field issues
        if (!compatibility.requiredFields.allPresent) {
            issues.push({
                type: 'missing_required',
                severity: 'critical',
                message: `Missing required fields: ${compatibility.requiredFields.missing.join(', ')}`
            });
        }

        // Data type issues
        const typeIssues = Object.entries(compatibility.dataTypes)
            .filter(([field, isValid]) => !isValid)
            .map(([field]) => field);

        if (typeIssues.length > 0) {
            issues.push({
                type: 'data_types',
                severity: 'high',
                message: `Invalid data types for: ${typeIssues.join(', ')}`
            });
        }

        // Coordinate range issues
        if (compatibility.coordinateRange.outOfRange > 0) {
            issues.push({
                type: 'coordinates',
                severity: 'medium',
                message: `${compatibility.coordinateRange.outOfRange} sensors outside expected range`
            });
        }

        // Source distribution issues
        if (!compatibility.sourceDistribution.hasAllExpectedSources) {
            issues.push({
                type: 'source_distribution',
                severity: 'medium',
                message: `Missing sources: ${compatibility.sourceDistribution.missingSources.join(', ')}`
            });
        }

        return issues;
    }

    /**
     * Generate recommendations based on issues
     */
    generateRecommendations(issues) {
        const recommendations = [];

        issues.forEach(issue => {
            switch (issue.type) {
                case 'missing_fields':
                    recommendations.push('Update data generator to include all required fields');
                    break;
                case 'missing_required':
                    recommendations.push('Add missing required fields to CSV data');
                    break;
                case 'data_types':
                    recommendations.push('Fix data type conversion in ExternalDataLoader');
                    break;
                case 'coordinates':
                    recommendations.push('Check sensor coordinate generation in data generator');
                    break;
                case 'source_distribution':
                    recommendations.push('Ensure all expected source types are generated');
                    break;
            }
        });

        return recommendations;
    }

    /**
     * Print detailed validation report
     */
    printValidationReport(validation) {
        console.log('\n📋 CSV Data Validation Report');
        console.log('=====================================');
        console.log(`CSV File: ${validation.csvFile}`);
        console.log(`Status: ${validation.status.toUpperCase()}`);
        console.log(`CSV Records: ${validation.csvRecordCount}`);
        console.log(`Dummy Records: ${validation.dummyRecordCount}`);

        // Field comparison
        console.log('\n🔍 Field Comparison:');
        console.log(`Common fields: ${validation.compatibility.fieldMatches.commonFields.length}`);
        if (validation.compatibility.fieldMatches.missingInCSV.length > 0) {
            console.log(`❌ Missing in CSV: ${validation.compatibility.fieldMatches.missingInCSV.join(', ')}`);
        }
        if (validation.compatibility.fieldMatches.extraInCSV.length > 0) {
            console.log(`➕ Extra in CSV: ${validation.compatibility.fieldMatches.extraInCSV.join(', ')}`);
        }

        // Coordinate validation
        console.log('\n📍 Coordinate Analysis:');
        console.log(`Sensors within range: ${validation.compatibility.coordinateRange.withinRange}/${validation.compatibility.coordinateRange.totalSensors}`);
        console.log(`Average distance from center: ${validation.compatibility.coordinateRange.avgDistance.toFixed(2)}km`);

        // Source distribution
        console.log('\n🏭 Source Distribution:');
        Object.entries(validation.compatibility.sourceDistribution.distribution).forEach(([source, count]) => {
            console.log(`  ${source}: ${count} sensors`);
        });

        // Issues and recommendations
        if (validation.issues && validation.issues.length > 0) {
            console.log('\n⚠️ Issues Found:');
            validation.issues.forEach((issue, index) => {
                console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
            });

            console.log('\n💡 Recommendations:');
            validation.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        } else {
            console.log('\n✅ No issues found - CSV data is fully compatible!');
        }

        console.log('\n=====================================\n');
    }

    /**
     * Quick compatibility check
     */
    async quickCheck(csvFilename = 'generated_data/current_reading.csv') {
        try {
            const csvData = await externalDataLoader.loadSensorDataFromCSV(csvFilename);
            const isCompatible = csvData && csvData.length > 0 &&
                csvData[0].id && csvData[0].lat && csvData[0].lng &&
                csvData[0].aqi && csvData[0].source;

            console.log(`Quick check result: ${isCompatible ? '✅ Compatible' : '❌ Issues detected'}`);
            return isCompatible;
        } catch (error) {
            console.log(`Quick check result: ❌ Failed to load (${error.message})`);
            return false;
        }
    }
}

// Export singleton instance
export const dataValidator = new DataValidator();

// Test function for console usage
export const testCSVCompatibility = async () => {
    return await dataValidator.validateCSVCompatibility();
};

// Quick test function
export const quickTestCSV = async () => {
    return await dataValidator.quickCheck();
};