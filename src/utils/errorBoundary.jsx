import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
            isRetrying: false
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // Report error to monitoring service
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: error.toString(),
                fatal: false,
                custom_parameters: {
                    error_boundary: this.props.name || 'Unknown',
                    component_stack: errorInfo.componentStack,
                    error_stack: error.stack
                }
            });
        }

        // Report to Sentry if available
        if (window.Sentry) {
            window.Sentry.withScope((scope) => {
                scope.setTag('errorBoundary', this.props.name || 'Unknown');
                scope.setContext('errorInfo', errorInfo);
                window.Sentry.captureException(error);
            });
        }
    }

    handleRetry = async () => {
        this.setState({ isRetrying: true });

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prevState.retryCount + 1,
            isRetrying: false
        }));

        // Call onRetry callback if provided
        if (this.props.onRetry) {
            this.props.onRetry();
        }
    };

    handleReport = () => {
        const { error, errorInfo } = this.state;
        const reportData = {
            error: error?.toString(),
            stack: error?.stack,
            componentStack: errorInfo?.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            boundaryName: this.props.name || 'Unknown'
        };

        // Create mailto link with error details
        const subject = encodeURIComponent(`Error Report: ${this.props.name || 'AQI App'}`);
        const body = encodeURIComponent(
            `Error Report\n\n` +
            `Boundary: ${reportData.boundaryName}\n` +
            `Time: ${reportData.timestamp}\n` +
            `URL: ${reportData.url}\n\n` +
            `Error: ${reportData.error}\n\n` +
            `Stack Trace:\n${reportData.stack}\n\n` +
            `Component Stack:\n${reportData.componentStack}\n\n` +
            `User Agent: ${reportData.userAgent}`
        );

        window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
    };

    renderErrorDetails() {
        const { error, errorInfo } = this.state;
        const { showDetails } = this.props;

        if (!showDetails || !error) return null;

        return (
            <details className="error-details">
                <summary className="error-summary">
                    <span>Technical Details</span>
                    <span className="toggle-icon">▼</span>
                </summary>
                <div className="error-content">
                    <div className="error-section">
                        <h4>Error Message:</h4>
                        <pre className="error-message">{error.toString()}</pre>
                    </div>

                    {error.stack && (
                        <div className="error-section">
                            <h4>Error Stack:</h4>
                            <pre className="error-stack">{error.stack}</pre>
                        </div>
                    )}

                    {errorInfo && errorInfo.componentStack && (
                        <div className="error-section">
                            <h4>Component Stack:</h4>
                            <pre className="error-stack">{errorInfo.componentStack}</pre>
                        </div>
                    )}
                </div>
            </details>
        );
    }

    render() {
        const { hasError, isRetrying, retryCount } = this.state;
        const {
            children,
            fallback,
            name = 'Application',
            maxRetries = 3,
            showRetry = true,
            showReport = true
        } = this.props;

        if (hasError) {
            // If a custom fallback is provided, use it
            if (fallback) {
                return fallback({
                    error: this.state.error,
                    errorInfo: this.state.errorInfo,
                    retry: this.handleRetry,
                    isRetrying,
                    retryCount
                });
            }

            // Default error UI
            return (
                <div className="error-boundary">
                    <div className="error-container">
                        <div className="error-header">
                            <div className="error-icon">⚠️</div>
                            <h2 className="error-title">Oops! Something went wrong</h2>
                            <p className="error-description">
                                {this.getErrorMessage()}
                            </p>
                        </div>

                        <div className="error-actions">
                            {showRetry && retryCount < maxRetries && (
                                <button
                                    className={`retry-button ${isRetrying ? 'loading' : ''}`}
                                    onClick={this.handleRetry}
                                    disabled={isRetrying}
                                >
                                    {isRetrying ? (
                                        <>
                                            <span className="spinner"></span>
                                            Retrying...
                                        </>
                                    ) : (
                                        <>🔄 Try Again</>
                                    )}
                                </button>
                            )}

                            <button
                                className="refresh-button"
                                onClick={() => window.location.reload()}
                            >
                                🔃 Refresh Page
                            </button>

                            {showReport && (
                                <button
                                    className="report-button"
                                    onClick={this.handleReport}
                                >
                                    📧 Report Issue
                                </button>
                            )}
                        </div>

                        {retryCount >= maxRetries && (
                            <div className="max-retries-message">
                                <p>Maximum retry attempts reached. Please refresh the page or report the issue.</p>
                            </div>
                        )}

                        {this.renderErrorDetails()}

                        <div className="error-suggestions">
                            <h3>What you can do:</h3>
                            <ul>
                                <li>Refresh the page to reload the application</li>
                                <li>Check your internet connection</li>
                                <li>Try again in a few moments</li>
                                <li>Report the issue if it persists</li>
                            </ul>
                        </div>
                    </div>

                    <style jsx>{`
                        .error-boundary {
                            min-height: 400px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 20px;
                            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                        }

                        .error-container {
                            max-width: 600px;
                            width: 100%;
                            background: white;
                            border-radius: 12px;
                            padding: 30px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                            text-align: center;
                        }

                        .error-header {
                            margin-bottom: 30px;
                        }

                        .error-icon {
                            font-size: 48px;
                            margin-bottom: 16px;
                        }

                        .error-title {
                            color: #2c3e50;
                            margin: 0 0 12px 0;
                            font-size: 1.5rem;
                            font-weight: 600;
                        }

                        .error-description {
                            color: #7f8c8d;
                            margin: 0 0 20px 0;
                            line-height: 1.5;
                        }

                        .error-actions {
                            display: flex;
                            gap: 12px;
                            justify-content: center;
                            flex-wrap: wrap;
                            margin-bottom: 30px;
                        }

                        .retry-button, .refresh-button, .report-button {
                            padding: 12px 24px;
                            border: none;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }

                        .retry-button {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                        }

                        .retry-button:hover:not(:disabled) {
                            transform: translateY(-2px);
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                        }

                        .retry-button:disabled {
                            opacity: 0.6;
                            cursor: not-allowed;
                        }

                        .retry-button.loading {
                            pointer-events: none;
                        }

                        .refresh-button {
                            background: #3498db;
                            color: white;
                        }

                        .refresh-button:hover {
                            background: #2980b9;
                            transform: translateY(-2px);
                        }

                        .report-button {
                            background: #e74c3c;
                            color: white;
                        }

                        .report-button:hover {
                            background: #c0392b;
                            transform: translateY(-2px);
                        }

                        .spinner {
                            width: 16px;
                            height: 16px;
                            border: 2px solid rgba(255,255,255,0.3);
                            border-top: 2px solid white;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                        }

                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }

                        .max-retries-message {
                            background: #ffeaa7;
                            border: 1px solid #fdcb6e;
                            border-radius: 6px;
                            padding: 12px;
                            margin-bottom: 20px;
                            color: #2d3436;
                        }

                        .error-details {
                            background: #f8f9fa;
                            border: 1px solid #e9ecef;
                            border-radius: 6px;
                            margin: 20px 0;
                            text-align: left;
                        }

                        .error-summary {
                            padding: 12px 16px;
                            cursor: pointer;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            font-weight: 600;
                            color: #495057;
                            background: #f1f3f4;
                            border-radius: 6px 6px 0 0;
                        }

                        .error-summary:hover {
                            background: #e9ecef;
                        }

                        .toggle-icon {
                            transition: transform 0.2s ease;
                        }

                        .error-details[open] .toggle-icon {
                            transform: rotate(180deg);
                        }

                        .error-content {
                            padding: 16px;
                        }

                        .error-section {
                            margin-bottom: 16px;
                        }

                        .error-section:last-child {
                            margin-bottom: 0;
                        }

                        .error-section h4 {
                            margin: 0 0 8px 0;
                            color: #495057;
                            font-size: 0.9rem;
                        }

                        .error-message, .error-stack {
                            background: #2d3748;
                            color: #e2e8f0;
                            padding: 12px;
                            border-radius: 4px;
                            font-size: 0.8rem;
                            line-height: 1.4;
                            overflow-x: auto;
                            white-space: pre-wrap;
                            word-break: break-word;
                        }

                        .error-suggestions {
                            text-align: left;
                            background: #e8f5e8;
                            border: 1px solid #c3e6c3;
                            border-radius: 6px;
                            padding: 16px;
                            margin-top: 20px;
                        }

                        .error-suggestions h3 {
                            margin: 0 0 12px 0;
                            color: #2c5234;
                            font-size: 1rem;
                        }

                        .error-suggestions ul {
                            margin: 0;
                            padding-left: 20px;
                            color: #2c5234;
                        }

                        .error-suggestions li {
                            margin-bottom: 6px;
                            line-height: 1.4;
                        }

                        @media (max-width: 768px) {
                            .error-boundary {
                                padding: 16px;
                            }

                            .error-container {
                                padding: 20px;
                            }

                            .error-actions {
                                flex-direction: column;
                                align-items: center;
                            }

                            .retry-button, .refresh-button, .report-button {
                                width: 100%;
                                max-width: 200px;
                                justify-content: center;
                            }
                        }
                    `}</style>
                </div>
            );
        }

        return children;
    }

    getErrorMessage() {
        const { error } = this.state;
        const { name } = this.props;

        if (error?.message?.includes('ChunkLoadError') || error?.message?.includes('Loading chunk')) {
            return `The ${name} failed to load properly. This might be due to a network issue or an app update.`;
        }

        if (error?.message?.includes('Network')) {
            return `Unable to connect to the server. Please check your internet connection.`;
        }

        if (error?.name === 'TypeError' && error?.message?.includes('Cannot read properties')) {
            return `The ${name} encountered a data issue. Please try refreshing the page.`;
        }

        return `The ${name} encountered an unexpected error. Our team has been notified and is working on a fix.`;
    }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
    const WrappedComponent = (props) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
    return WrappedComponent;
};

// Specialized error boundaries for different parts of the app
export const MapErrorBoundary = ({ children }) => (
    <ErrorBoundary
        name="Map Component"
        showDetails={false}
        fallback={({ retry, isRetrying }) => (
            <div className="map-error-fallback">
                <div className="fallback-content">
                    <h3>🗺️ Map Failed to Load</h3>
                    <p>The interactive map encountered an error. This might be due to:</p>
                    <ul>
                        <li>Network connectivity issues</li>
                        <li>Map service temporarily unavailable</li>
                        <li>Browser compatibility issues</li>
                    </ul>
                    <button
                        className="fallback-retry-btn"
                        onClick={retry}
                        disabled={isRetrying}
                    >
                        {isRetrying ? 'Loading...' : '🔄 Reload Map'}
                    </button>
                </div>
            </div>
        )}
    >
        {children}
    </ErrorBoundary>
);

export const SensorErrorBoundary = ({ children }) => (
    <ErrorBoundary
        name="Sensor Data"
        showDetails={false}
        fallback={({ retry, isRetrying }) => (
            <div className="sensor-error-fallback">
                <div className="fallback-content">
                    <h3>📡 Sensor Data Unavailable</h3>
                    <p>Unable to load sensor information. Using cached data if available.</p>
                    <button
                        className="fallback-retry-btn"
                        onClick={retry}
                        disabled={isRetrying}
                    >
                        {isRetrying ? 'Refreshing...' : '🔄 Refresh Sensors'}
                    </button>
                </div>
            </div>
        )}
    >
        {children}
    </ErrorBoundary>
);

export default ErrorBoundary;