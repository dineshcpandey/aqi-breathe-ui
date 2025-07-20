// ==================== MOBILE OPTIMIZATION COMPONENTS ====================

// src/components/Mobile/MobileOptimizedSensorView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import './MobileOptimizedSensorView.css';

const MobileOptimizedSensorView = ({
    sensorData = [],
    onSensorSelect,
    selectedSensor,
    filters,
    onFilterChange
}) => {
    const [view, setView] = useState('list'); // 'list', 'map', 'nearby'
    const [location, setLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Get user location for nearby sensors
    useEffect(() => {
        if ('geolocation' in navigator && view === 'nearby') {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                    setIsLoading(false);
                },
                (error) => {
                    console.error('Location error:', error);
                    setIsLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
            );
        }
    }, [view]);

    // Calculate distances and sort by proximity
    const processedSensorData = useMemo(() => {
        let processed = [...sensorData];

        if (view === 'nearby' && location) {
            processed = processed.map(sensor => ({
                ...sensor,
                distance: calculateDistance(
                    [location.lat, location.lng],
                    [sensor.lat, sensor.lng]
                )
            })).sort((a, b) => a.distance - b.distance);
        } else {
            // Sort by AQI severity for list view
            processed.sort((a, b) => b.aqi - a.aqi);
        }

        return processed;
    }, [sensorData, view, location]);

    // Virtualized list item renderer
    const SensorListItem = ({ index, style }) => {
        const sensor = processedSensorData[index];
        const isSelected = selectedSensor?.id === sensor.id;

        return (
            <div
                style={style}
                className={`mobile-sensor-item ${sensor.severity} ${isSelected ? 'selected' : ''}`}
                onClick={() => onSensorSelect(sensor)}
            >
                <div className="sensor-item-main">
                    <div className="sensor-basic-info">
                        <div className="sensor-name-mobile">{sensor.station}</div>
                        <div className="sensor-source-mobile">{sensor.source}</div>
                    </div>

                    <div className="sensor-readings-mobile">
                        <div className="aqi-large">{sensor.aqi}</div>
                        <div className="aqi-label">AQI</div>
                    </div>
                </div>

                <div className="sensor-item-details">
                    <div className="mini-readings">
                        <span>PM2.5: {sensor.pm25}</span>
                        <span>PM10: {sensor.pm10}</span>
                        <span>CO: {sensor.co}</span>
                    </div>

                    {view === 'nearby' && sensor.distance && (
                        <div className="distance-info">
                            📍 {(sensor.distance / 1000).toFixed(1)}km away
                        </div>
                    )}

                    <div className="update-time">
                        Updated: {new Date(sensor.timestamp).toLocaleTimeString()}
                    </div>
                </div>

                <div className="sensor-status-indicator">
                    <div className={`status-dot ${sensor.severity}`}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="mobile-sensor-view">
            {/* View Selector */}
            <div className="mobile-view-selector">
                <button
                    className={view === 'list' ? 'active' : ''}
                    onClick={() => setView('list')}
                >
                    📋 All Sensors
                </button>
                <button
                    className={view === 'nearby' ? 'active' : ''}
                    onClick={() => setView('nearby')}
                >
                    📍 Nearby
                </button>
                <button
                    className={view === 'map' ? 'active' : ''}
                    onClick={() => setView('map')}
                >
                    🗺️ Map View
                </button>
            </div>

            {/* Quick Stats */}
            <div className="mobile-quick-stats">
                <div className="stat-card">
                    <div className="stat-value">{sensorData.length}</div>
                    <div className="stat-label">Total Stations</div>
                </div>
                <div className="stat-card high">
                    <div className="stat-value">
                        {sensorData.filter(s => s.aqi > 150).length}
                    </div>
                    <div className="stat-label">High AQI</div>
                </div>
                <div className="stat-card critical">
                    <div className="stat-value">
                        {sensorData.filter(s => s.aqi > 300).length}
                    </div>
                    <div className="stat-label">Critical</div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="mobile-loading">
                    <div className="loading-spinner"></div>
                    <p>Getting your location...</p>
                </div>
            )}

            {/* Virtualized Sensor List */}
            {!isLoading && view !== 'map' && (
                <div className="mobile-sensor-list">
                    <List
                        height={600}
                        itemCount={processedSensorData.length}
                        itemSize={120}
                        itemData={processedSensorData}
                    >
                        {SensorListItem}
                    </List>
                </div>
            )}

            {/* Map View Placeholder */}
            {view === 'map' && (
                <div className="mobile-map-view">
                    <p>Map view would integrate with your existing MapContainer</p>
                </div>
            )}
        </div>
    );
};

// ==================== OFFLINE SUPPORT ====================

// src/services/offlineService.js
export class OfflineService {
    constructor() {
        this.cacheName = 'sensor-data-cache-v1';
        this.offlineData = new Map();
        this.syncQueue = [];
        this.isOnline = navigator.onLine;

        this.initializeEventListeners();
        this.initializeServiceWorker();
    }

    initializeEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onOffline();
        });
    }

    async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);

                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleServiceWorkerMessage(event);
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // Cache sensor data for offline use
    async cacheSensorData(sensorData, cityId = 'default') {
        const cacheKey = `sensors_${cityId}`;
        const cacheData = {
            data: sensorData,
            timestamp: Date.now(),
            cityId,
            version: 1
        };

        try {
            // Cache in memory
            this.offlineData.set(cacheKey, cacheData);

            // Cache in localStorage
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));

            // Cache in Service Worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CACHE_SENSOR_DATA',
                    payload: { key: cacheKey, data: cacheData }
                });
            }

            console.log(`Cached sensor data for ${cityId}: ${sensorData.length} sensors`);

        } catch (error) {
            console.error('Failed to cache sensor data:', error);
        }
    }

    // Retrieve cached sensor data
    async getCachedSensorData(cityId = 'default') {
        const cacheKey = `sensors_${cityId}`;

        try {
            // Try memory cache first
            if (this.offlineData.has(cacheKey)) {
                const cached = this.offlineData.get(cacheKey);
                if (this.isCacheValid(cached)) {
                    return cached.data;
                }
            }

            // Try localStorage
            const localCached = localStorage.getItem(cacheKey);
            if (localCached) {
                const parsed = JSON.parse(localCached);
                if (this.isCacheValid(parsed)) {
                    this.offlineData.set(cacheKey, parsed);
                    return parsed.data;
                }
            }

            // Try Service Worker cache
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                const response = await this.requestFromServiceWorker({
                    type: 'GET_CACHED_DATA',
                    payload: { key: cacheKey }
                });

                if (response && response.data) {
                    return response.data.data;
                }
            }

            return null;

        } catch (error) {
            console.error('Failed to retrieve cached sensor data:', error);
            return null;
        }
    }

    isCacheValid(cachedData, maxAge = 30 * 60 * 1000) { // 30 minutes default
        return Date.now() - cachedData.timestamp < maxAge;
    }

    // Queue actions for when back online
    queueForSync(action) {
        this.syncQueue.push({
            ...action,
            timestamp: Date.now(),
            retryCount: 0
        });

        // Persist sync queue
        localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    }

    async onOnline() {
        console.log('Back online - processing sync queue');

        // Process sync queue
        while (this.syncQueue.length > 0) {
            const action = this.syncQueue.shift();

            try {
                await this.processQueuedAction(action);
            } catch (error) {
                console.error('Failed to process queued action:', error);

                // Retry logic
                action.retryCount++;
                if (action.retryCount < 3) {
                    this.syncQueue.push(action);
                }
            }
        }

        // Clear persisted queue
        localStorage.removeItem('sync_queue');

        // Refresh data
        this.dispatchEvent('refresh-data');
    }

    onOffline() {
        console.log('Gone offline - switching to cached data');
        this.dispatchEvent('offline-mode');
    }

    async processQueuedAction(action) {
        switch (action.type) {
            case 'sensor_alert_created':
                await this.syncAlertCreation(action.payload);
                break;
            case 'user_preference_changed':
                await this.syncUserPreferences(action.payload);
                break;
            case 'analytics_event':
                await this.syncAnalyticsEvent(action.payload);
                break;
            default:
                console.warn('Unknown queued action type:', action.type);
        }
    }

    // Background sync for cached data updates
    async scheduleBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('background-sensor-sync');
                console.log('Background sync registered');
            } catch (error) {
                console.error('Failed to register background sync:', error);
            }
        }
    }

    dispatchEvent(eventName, data = {}) {
        window.dispatchEvent(new CustomEvent(`offline-service-${eventName}`, { detail: data }));
    }

    requestFromServiceWorker(message) {
        return new Promise((resolve) => {
            const channel = new MessageChannel();
            channel.port1.onmessage = (event) => {
                resolve(event.data);
            };

            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
            } else {
                resolve(null);
            }
        });
    }

    // Get offline status and cache statistics
    getOfflineStatus() {
        const cachedCities = [];
        const cacheSize = this.offlineData.size;

        // Check localStorage for cached cities
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('sensors_')) {
                const cityId = key.replace('sensors_', '');
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        cachedCities.push({
                            cityId,
                            sensorCount: parsed.data?.length || 0,
                            lastUpdated: new Date(parsed.timestamp).toLocaleString(),
                            isValid: this.isCacheValid(parsed)
                        });
                    } catch (error) {
                        console.error(`Invalid cached data for ${cityId}:`, error);
                    }
                }
            }
        }

        return {
            isOnline: this.isOnline,
            cacheSize,
            cachedCities,
            syncQueueSize: this.syncQueue.length,
            offlineCapable: 'serviceWorker' in navigator && 'caches' in window
        };
    }
}

// ==================== INTERNATIONALIZATION SUPPORT ====================

// src/i18n/translations.js
export const translations = {
    en: {
        // Navigation
        sensors: 'Monitoring Stations',
        filters: 'Filters',
        map: 'Map',
        analytics: 'Analytics',
        settings: 'Settings',

        // Sensor Information
        station: 'Station',
        location: 'Location',
        lastUpdated: 'Last Updated',
        dataQuality: 'Data Quality',
        readings: 'Readings',

        // Pollutants
        aqi: 'Air Quality Index',
        pm25: 'Fine Particles (PM2.5)',
        pm10: 'Coarse Particles (PM10)',
        co: 'Carbon Monoxide',
        no2: 'Nitrogen Dioxide',
        so2: 'Sulfur Dioxide',
        ozone: 'Ozone',

        // Units
        units: {
            aqi: 'AQI',
            concentration: 'µg/m³',
            ppm: 'ppm',
            temperature: '°C',
            humidity: '%',
            windSpeed: 'm/s'
        },

        // Status Levels
        status: {
            good: 'Good',
            moderate: 'Moderate',
            unhealthySensitive: 'Unhealthy for Sensitive Groups',
            unhealthy: 'Unhealthy',
            veryUnhealthy: 'Very Unhealthy',
            hazardous: 'Hazardous'
        },

        // Sources
        sources: {
            construction: 'Construction',
            vehicle: 'Vehicle Emissions',
            dust: 'Dust Sources',
            industrial: 'Industrial',
            residential: 'Residential'
        },

        // Actions
        showAll: 'Show All',
        hideAll: 'Hide All',
        refresh: 'Refresh',
        export: 'Export',
        share: 'Share',
        details: 'Details',
        close: 'Close',

        // Messages
        loading: 'Loading...',
        noData: 'No data available',
        offline: 'You are offline. Showing cached data.',
        error: 'Something went wrong. Please try again.',
        locationDenied: 'Location access denied.',

        // Alerts
        alertHigh: 'High pollution alert',
        alertCritical: 'Critical air quality alert',

        // Time
        time: {
            now: 'Now',
            hour: 'hour',
            hours: 'hours',
            minute: 'minute',
            minutes: 'minutes',
            ago: 'ago'
        }
    },

    hi: {
        // Navigation (Hindi)
        sensors: 'निगरानी केंद्र',
        filters: 'फ़िल्टर',
        map: 'मानचित्र',
        analytics: 'विश्लेषण',
        settings: 'सेटिंग्स',

        // Sensor Information
        station: 'स्टेशन',
        location: 'स्थान',
        lastUpdated: 'अंतिम अपडेट',
        dataQuality: 'डेटा गुणवत्ता',
        readings: 'रीडिंग',

        // Pollutants
        aqi: 'वायु गुणवत्ता सूचकांक',
        pm25: 'सूक्ष्म कण (PM2.5)',
        pm10: 'स्थूल कण (PM10)',
        co: 'कार्बन मोनोऑक्साइड',
        no2: 'नाइट्रोजन डाइऑक्साइड',
        so2: 'सल्फर डाइऑक्साइड',
        ozone: 'ओजोन',

        // Status Levels
        status: {
            good: 'अच्छा',
            moderate: 'मध्यम',
            unhealthySensitive: 'संवेदनशील लोगों के लिए अस्वस्थ',
            unhealthy: 'अस्वस्थ',
            veryUnhealthy: 'बहुत अस्वस्थ',
            hazardous: 'खतरनाक'
        },

        // Sources
        sources: {
            construction: 'निर्माण',
            vehicle: 'वाहन उत्सर्जन',
            dust: 'धूल स्रोत',
            industrial: 'औद्योगिक',
            residential: 'आवासीय'
        },

        // Messages
        loading: 'लोड हो रहा है...',
        noData: 'कोई डेटा उपलब्ध नहीं',
        offline: 'आप ऑफ़लाइन हैं। कैश्ड डेटा दिखाया जा रहा है।',
        error: 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।',

        // Time
        time: {
            now: 'अभी',
            hour: 'घंटा',
            hours: 'घंटे',
            minute: 'मिनट',
            minutes: 'मिनट',
            ago: 'पहले'
        }
    },

    te: {
        // Telugu
        sensors: 'పర్యవేక్షణ కేంద్రాలు',
        filters: 'ఫిల్టర్లు',
        map: 'మ్యాప్',
        analytics: 'విశ్లేషణ',
        aqi: 'గాలి నాణ్యత సూచిక',
        // ... more Telugu translations
    },

    ta: {
        // Tamil
        sensors: 'கண்காணிப்பு நிலையங்கள்',
        filters: 'வடிகட்டிகள்',
        map: 'வரைபடம்',
        aqi: 'காற்று தரக் குறியீடு',
        // ... more Tamil translations
    }
};

// src/hooks/useTranslation.js
import { useState, useContext, createContext } from 'react';
import { translations } from '../i18n/translations';

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        // Get language from localStorage or browser
        return localStorage.getItem('language') ||
            navigator.language.split('-')[0] ||
            'en';
    });

    const changeLanguage = (newLanguage) => {
        setLanguage(newLanguage);
        localStorage.setItem('language', newLanguage);
        document.documentElement.lang = newLanguage;
        document.documentElement.dir = ['ar', 'he'].includes(newLanguage) ? 'rtl' : 'ltr';
    };

    const t = (key, params = {}) => {
        const keys = key.split('.');
        let value = translations[language] || translations.en;

        for (const k of keys) {
            value = value?.[k];
            if (!value) break;
        }

        // Fallback to English
        if (!value) {
            value = translations.en;
            for (const k of keys) {
                value = value?.[k];
                if (!value) break;
            }
        }

        // Parameter substitution
        if (value && typeof value === 'string') {
            return value.replace(/\{\{(\w+)\}\}/g, (match, param) => params[param] || match);
        }

        return value || key;
    };

    // Format numbers according to locale
    const formatNumber = (number, options = {}) => {
        const locale = getLocaleFromLanguage(language);
        return new Intl.NumberFormat(locale, options).format(number);
    };

    // Format dates according to locale
    const formatDate = (date, options = {}) => {
        const locale = getLocaleFromLanguage(language);
        return new Intl.DateTimeFormat(locale, options).format(date);
    };

    // Format relative time
    const formatRelativeTime = (date) => {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return t('time.now');
        if (minutes < 60) return `${minutes} ${t(minutes === 1 ? 'time.minute' : 'time.minutes')} ${t('time.ago')}`;
        if (hours < 24) return `${hours} ${t(hours === 1 ? 'time.hour' : 'time.hours')} ${t('time.ago')}`;

        return formatDate(date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <I18nContext.Provider value={{
            language,
            changeLanguage,
            t,
            formatNumber,
            formatDate,
            formatRelativeTime,
            isRTL: ['ar', 'he'].includes(language)
        }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within I18nProvider');
    }
    return context;
};

const getLocaleFromLanguage = (language) => {
    const localeMap = {
        en: 'en-US',
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        bn: 'bn-IN',
        mr: 'mr-IN'
    };
    return localeMap[language] || 'en-US';
};

// ==================== ACCESSIBILITY ENHANCEMENTS ====================

// src/components/Accessibility/AccessibilityProvider.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem('accessibility-preferences');
        return saved ? JSON.parse(saved) : {
            reduceMotion: false,
            highContrast: false,
            largeText: false,
            screenReader: false,
            keyboardNavigation: false
        };
    });

    // Detect user preferences
    useEffect(() => {
        const mediaQueries = {
            reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
            highContrast: window.matchMedia('(prefers-contrast: high)'),
            largeText: window.matchMedia('(prefers-font-size: large)')
        };

        const updatePreferences = () => {
            setPreferences(prev => ({
                ...prev,
                reduceMotion: mediaQueries.reduceMotion.matches,
                highContrast: mediaQueries.highContrast.matches,
                largeText: mediaQueries.largeText.matches
            }));
        };

        // Listen for changes
        Object.values(mediaQueries).forEach(mq => {
            mq.addEventListener('change', updatePreferences);
        });

        // Initial check
        updatePreferences();

        // Cleanup
        return () => {
            Object.values(mediaQueries).forEach(mq => {
                mq.removeEventListener('change', updatePreferences);
            });
        };
    }, []);

    // Apply accessibility settings
    useEffect(() => {
        const root = document.documentElement;

        // Apply CSS custom properties based on preferences
        root.style.setProperty('--motion-duration', preferences.reduceMotion ? '0ms' : '300ms');
        root.style.setProperty('--font-size-multiplier', preferences.largeText ? '1.2' : '1');

        // Apply CSS classes
        root.classList.toggle('high-contrast', preferences.highContrast);
        root.classList.toggle('large-text', preferences.largeText);
        root.classList.toggle('reduce-motion', preferences.reduceMotion);

        // Save preferences
        localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
    }, [preferences]);

    const updatePreference = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <AccessibilityContext.Provider value={{
            preferences,
            updatePreference
        }}>
            {children}
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within AccessibilityProvider');
    }
    return context;
};

// Screen reader announcements
export const useScreenReader = () => {
    const announce = (message, priority = 'polite') => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    };

    return { announce };
};

// ==================== PERFORMANCE OPTIMIZATIONS FOR MOBILE ====================

// src/hooks/useVirtualization.js
import { useState, useMemo, useCallback } from 'react';

export const useVirtualization = (items, itemHeight, containerHeight) => {
    const [scrollTop, setScrollTop] = useState(0);

    const visibleRange = useMemo(() => {
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount + 2, items.length);

        return {
            startIndex: Math.max(0, startIndex - 1),
            endIndex,
            visibleItems: items.slice(Math.max(0, startIndex - 1), endIndex)
        };
    }, [items, scrollTop, itemHeight, containerHeight]);

    const handleScroll = useCallback((event) => {
        setScrollTop(event.target.scrollTop);
    }, []);

    const getItemStyle = useCallback((index) => ({
        position: 'absolute',
        top: (visibleRange.startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%'
    }), [visibleRange.startIndex, itemHeight]);

    return {
        visibleRange,
        handleScroll,
        getItemStyle,
        totalHeight: items.length * itemHeight
    };
};

// src/utils/mobileUtils.js
export const mobileUtils = {
    // Detect if device is mobile
    isMobile: () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // Detect if device has touch capability
    hasTouch: () => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    // Get device pixel ratio for high-DPI displays
    getPixelRatio: () => {
        return window.devicePixelRatio || 1;
    },

    // Optimize images for device
    getOptimizedImageUrl: (baseUrl, width, height) => {
        const pixelRatio = mobileUtils.getPixelRatio();
        const optimizedWidth = Math.round(width * pixelRatio);
        const optimizedHeight = Math.round(height * pixelRatio);

        return `${baseUrl}?w=${optimizedWidth}&h=${optimizedHeight}&q=80`;
    },

    // Handle touch events with proper passive listeners
    addTouchListener: (element, event, handler, options = {}) => {
        const passiveOptions = { passive: true, ...options };
        element.addEventListener(event, handler, passiveOptions);

        return () => element.removeEventListener(event, handler, passiveOptions);
    },

    // Debounce function for performance
    debounce: (func, wait, immediate) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Throttle function for scroll events
    throttle: (func, limit) => {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Calculate distance between two points (for geolocation)
    calculateDistance: (lat1, lng1, lat2, lng2) => {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    },

    // Get battery status (if supported)
    getBatteryInfo: async () => {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                return {
                    level: battery.level,
                    charging: battery.charging,
                    dischargingTime: battery.dischargingTime,
                    chargingTime: battery.chargingTime
                };
            } catch (error) {
                console.warn('Battery API not available:', error);
                return null;
            }
        }
        return null;
    }
};

export default mobileUtils;