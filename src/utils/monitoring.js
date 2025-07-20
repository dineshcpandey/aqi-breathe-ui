export const initializeAnalytics = () => {
    if (process.env.REACT_APP_GA_MEASUREMENT_ID) {
        // Load GA4
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.REACT_APP_GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {
            page_title: 'Air Quality Monitoring',
            custom_map: {
                'custom_parameter_1': 'sensor_interactions'
            }
        });

        window.gtag = gtag;
    }
};

// Track sensor interactions
export const trackSensorInteraction = (action, sensorId, metadata = {}) => {
    if (window.gtag) {
        window.gtag('event', action, {
            event_category: 'sensor_interaction',
            event_label: sensorId,
            custom_parameter_1: JSON.stringify(metadata)
        });
    }
};

// Track filter usage
export const trackFilterUsage = (filterType, filterValue) => {
    if (window.gtag) {
        window.gtag('event', 'filter_applied', {
            event_category: 'user_interaction',
            event_label: `${filterType}_${filterValue}`
        });
    }
};