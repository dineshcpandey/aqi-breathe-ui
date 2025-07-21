import React, { useState } from 'react';
import Papa from 'papaparse';

const CSVDebugger = () => {
    const [csvData, setCsvData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState(null);

    const loadAndAnalyzeCSV = async (filename) => {
        setLoading(true);
        setError(null);

        try {
            console.log(`🔍 Attempting to load: ${filename}`);

            // Try to read the file
            const response = await window.fs.readFile(`generated_data/${filename}`, { encoding: 'utf8' });

            console.log('✅ File loaded successfully, size:', response.length);
            console.log('📄 First 500 characters:', response.substring(0, 500));

            // Parse CSV
            const parsed = Papa.parse(response, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                delimitersToGuess: [',', '\t', '|', ';']
            });

            console.log('📊 Parsed CSV data:', parsed);

            if (parsed.errors.length > 0) {
                console.warn('⚠️ CSV parsing errors:', parsed.errors);
            }

            const data = parsed.data;
            setCsvData(data);

            // Analyze structure
            const analysis = analyzeCSVStructure(data, filename);
            setDebugInfo(analysis);

            console.log('🎯 CSV Analysis:', analysis);

        } catch (err) {
            console.error('❌ Error loading CSV:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const analyzeCSVStructure = (data, filename) => {
        if (!data || data.length === 0) {
            return { error: 'No data found in CSV' };
        }

        const firstRow = data[0];
        const columns = Object.keys(firstRow);

        // Expected columns for grid data
        const expectedGridColumns = [
            'center_lat', 'center_lng', 'aqi', 'pm25', 'pm10',
            'co', 'no2', 'so2', 'timestamp'
        ];

        // Expected columns for sensor data  
        const expectedSensorColumns = [
            'lat', 'lng', 'station', 'aqi', 'pm25', 'pm10',
            'co', 'no2', 'so2', 'timestamp'
        ];

        const expectedCols = filename.includes('grid') ? expectedGridColumns : expectedSensorColumns;

        // Check column matches
        const columnMatches = expectedCols.map(col => ({
            expected: col,
            found: columns.includes(col),
            actualValue: firstRow[col]
        }));

        // Find similar columns (fuzzy match)
        const similarColumns = columns.map(actualCol => {
            const similar = expectedCols.find(expCol =>
                actualCol.toLowerCase().includes(expCol.toLowerCase()) ||
                expCol.toLowerCase().includes(actualCol.toLowerCase())
            );
            return { actual: actualCol, similar, value: firstRow[actualCol] };
        });

        // Analyze timestamps
        const timestamps = data.map(row => row.timestamp).filter(Boolean).slice(0, 10);
        const uniqueTimestamps = [...new Set(timestamps)];

        return {
            filename,
            totalRows: data.length,
            columns,
            columnMatches,
            similarColumns,
            sampleData: data.slice(0, 3),
            timestamps: {
                sample: timestamps,
                unique: uniqueTimestamps.slice(0, 5),
                totalUnique: uniqueTimestamps.length
            },
            issues: identifyIssues(columnMatches, firstRow)
        };
    };

    const identifyIssues = (columnMatches, firstRow) => {
        const issues = [];

        // Check for missing critical columns
        const missing = columnMatches.filter(col => !col.found).map(col => col.expected);
        if (missing.length > 0) {
            issues.push(`Missing columns: ${missing.join(', ')}`);
        }

        // Check for zero values
        const zeroColumns = columnMatches.filter(col => col.found && col.actualValue === 0);
        if (zeroColumns.length > 0) {
            issues.push(`Columns with zero values: ${zeroColumns.map(c => c.expected).join(', ')}`);
        }

        // Check coordinate ranges
        if (firstRow.center_lat && (firstRow.center_lat < 20 || firstRow.center_lat > 35)) {
            issues.push(`center_lat seems invalid: ${firstRow.center_lat} (expected ~28.6 for Delhi)`);
        }

        if (firstRow.center_lng && (firstRow.center_lng < 70 || firstRow.center_lng > 85)) {
            issues.push(`center_lng seems invalid: ${firstRow.center_lng} (expected ~77.3 for Delhi)`);
        }

        return issues;
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', background: '#f8f9fa' }}>
            <h2>🔍 CSV Structure Debugger</h2>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => loadAndAnalyzeCSV('grid_historical.csv')}
                    disabled={loading}
                    style={{ marginRight: '10px', padding: '10px 20px' }}
                >
                    {loading ? '⏳ Loading...' : '📊 Analyze grid_historical.csv'}
                </button>

                <button
                    onClick={() => loadAndAnalyzeCSV('grid_predicted.csv')}
                    disabled={loading}
                    style={{ marginRight: '10px', padding: '10px 20px' }}
                >
                    {loading ? '⏳ Loading...' : '🔮 Analyze grid_predicted.csv'}
                </button>

                <button
                    onClick={() => loadAndAnalyzeCSV('historical_reading.csv')}
                    disabled={loading}
                    style={{ marginRight: '10px', padding: '10px 20px' }}
                >
                    {loading ? '⏳ Loading...' : '📡 Analyze historical_reading.csv'}
                </button>
            </div>

            {error && (
                <div style={{
                    background: '#ffebee',
                    color: '#c62828',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <h3>❌ Error</h3>
                    <pre>{error}</pre>
                </div>
            )}

            {debugInfo && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h3>📋 Analysis Results for {debugInfo.filename}</h3>

                    <div style={{ marginBottom: '15px' }}>
                        <strong>📊 Basic Info:</strong>
                        <ul>
                            <li>Total Rows: {debugInfo.totalRows}</li>
                            <li>Total Columns: {debugInfo.columns.length}</li>
                        </ul>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <strong>📝 Your CSV Columns:</strong>
                        <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '4px' }}>
                            {debugInfo.columns.join(', ')}
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <strong>🎯 Column Mapping Check:</strong>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Expected</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Found</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Sample Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {debugInfo.columnMatches.map((col, idx) => (
                                    <tr key={idx} style={{
                                        background: col.found ? '#e8f5e8' : '#ffebee'
                                    }}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                            {col.expected}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                            {col.found ? '✅' : '❌'}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                            {String(col.actualValue)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {debugInfo.similarColumns && (
                        <div style={{ marginBottom: '15px' }}>
                            <strong>🔍 Similar Columns Found:</strong>
                            <ul>
                                {debugInfo.similarColumns.map((col, idx) => (
                                    <li key={idx}>
                                        <strong>{col.actual}</strong>
                                        {col.similar && ` (might be: ${col.similar})`}
                                        <code style={{ marginLeft: '10px', background: '#f0f0f0', padding: '2px 6px' }}>
                                            = {String(col.value)}
                                        </code>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div style={{ marginBottom: '15px' }}>
                        <strong>🕒 Timestamp Analysis:</strong>
                        <ul>
                            <li>Unique timestamps: {debugInfo.timestamps.totalUnique}</li>
                            <li>Sample timestamps:
                                <ul>
                                    {debugInfo.timestamps.sample.map((ts, idx) => (
                                        <li key={idx}><code>{ts}</code></li>
                                    ))}
                                </ul>
                            </li>
                        </ul>
                    </div>

                    {debugInfo.issues.length > 0 && (
                        <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '4px' }}>
                            <strong>⚠️ Issues Found:</strong>
                            <ul>
                                {debugInfo.issues.map((issue, idx) => (
                                    <li key={idx} style={{ color: '#f57c00' }}>{issue}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <details style={{ marginTop: '15px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                            🔍 Sample Data (First 3 Rows)
                        </summary>
                        <pre style={{
                            background: '#f5f5f5',
                            padding: '10px',
                            overflow: 'auto',
                            fontSize: '12px'
                        }}>
                            {JSON.stringify(debugInfo.sampleData, null, 2)}
                        </pre>
                    </details>
                </div>
            )}

            {csvData && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                    <h3>📊 Raw Data Preview (First 5 Rows)</h3>
                    <pre style={{
                        background: '#f5f5f5',
                        padding: '15px',
                        overflow: 'auto',
                        fontSize: '11px',
                        maxHeight: '400px'
                    }}>
                        {JSON.stringify(csvData.slice(0, 5), null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default CSVDebugger;