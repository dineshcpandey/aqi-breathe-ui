import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

export const initializeErrorTracking = () => {
    if (process.env.REACT_APP_SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.REACT_APP_SENTRY_DSN,
            integrations: [
                new Integrations.BrowserTracing({
                    routingInstrumentation: Sentry.reactRouterV6Instrumentation(
                        React.useEffect,
                        useLocation,
                        useNavigationType,
                        createRoutesFromChildren,
                        matchRoutes
                    ),
                }),
            ],
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            environment: process.env.NODE_ENV,
            beforeSend(event) {
                // Filter out non-critical errors
                if (event.exception?.values?.[0]?.type === 'ResizeObserver loop limit exceeded') {
                    return null;
                }
                return event;
            }
        });
    }
};

// Enhanced error boundary with Sentry
export const SentryErrorBoundary = Sentry.withErrorBoundary(YourComponent, {
    fallback: ({ error, resetError }) => (
        <div className="error-fallback">
            <h2>Something went wrong with the sensor data</h2>
            <details>
                <summary>Error details</summary>
                <pre>{error?.message}</pre>
            </details>
            <button onClick={resetError}>Try again</button>
        </div>
    )
});