export class SmartAlertingService {
    constructor() {
        this.alerts = new Map();
        this.subscribers = new Set();
        this.alertRules = new Map();
        this.notificationQueue = [];
        this.isProcessing = false;
    }

    // Subscribe to alerts
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    // Create alert rule
    createAlertRule(rule) {
        this.alertRules.set(rule.id, {
            id: rule.id,
            name: rule.name,
            conditions: rule.conditions, // { pollutant: 'aqi', operator: '>', threshold: 150 }
            geofence: rule.geofence,     // { type: 'circle', center: [lat, lng], radius: 1000 }
            schedule: rule.schedule,     // { start: '06:00', end: '22:00', days: [1,2,3,4,5] }
            actions: rule.actions,       // ['push', 'email', 'sms', 'webhook']
            enabled: true,
            createdAt: new Date(),
            triggeredCount: 0,
            lastTriggered: null
        });
    }

    // Process sensor data for alerts
    processSensorData(sensorData) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            sensorData.forEach(sensor => {
                this.alertRules.forEach(rule => {
                    if (rule.enabled && this.evaluateRule(rule, sensor)) {
                        this.triggerAlert(rule, sensor);
                    }
                });
            });
        } finally {
            this.isProcessing = false;
        }
    }

    evaluateRule(rule, sensor) {
        // Check conditions
        const conditionsMet = rule.conditions.every(condition => {
            const sensorValue = sensor[condition.pollutant];

            switch (condition.operator) {
                case '>': return sensorValue > condition.threshold;
                case '>=': return sensorValue >= condition.threshold;
                case '<': return sensorValue < condition.threshold;
                case '<=': return sensorValue <= condition.threshold;
                case '=': return sensorValue === condition.threshold;
                default: return false;
            }
        });

        if (!conditionsMet) return false;

        // Check geofence
        if (rule.geofence && !this.isInGeofence(sensor, rule.geofence)) {
            return false;
        }

        // Check schedule
        if (rule.schedule && !this.isInSchedule(rule.schedule)) {
            return false;
        }

        // Check cooldown (don't spam alerts)
        const cooldownPeriod = 30 * 60 * 1000; // 30 minutes
        if (rule.lastTriggered && Date.now() - rule.lastTriggered < cooldownPeriod) {
            return false;
        }

        return true;
    }

    isInGeofence(sensor, geofence) {
        if (geofence.type === 'circle') {
            const distance = this.calculateDistance(
                [sensor.lat, sensor.lng],
                geofence.center
            );
            return distance <= geofence.radius;
        }

        if (geofence.type === 'polygon') {
            return this.isPointInPolygon([sensor.lat, sensor.lng], geofence.coordinates);
        }

        return true;
    }

    isInSchedule(schedule) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinutes;

        const [startHour, startMin] = schedule.start.split(':').map(Number);
        const [endHour, endMin] = schedule.end.split(':').map(Number);

        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        const dayOfWeek = now.getDay();
        const isScheduledDay = schedule.days.includes(dayOfWeek);
        const isScheduledTime = currentTime >= startTime && currentTime <= endTime;

        return isScheduledDay && isScheduledTime;
    }

    triggerAlert(rule, sensor) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            ruleName: rule.name,
            sensor,
            triggeredAt: new Date(),
            severity: this.calculateAlertSeverity(sensor),
            message: this.generateAlertMessage(rule, sensor),
            actions: rule.actions
        };

        // Update rule stats
        rule.triggeredCount++;
        rule.lastTriggered = Date.now();

        // Store alert
        this.alerts.set(alert.id, alert);

        // Queue notifications
        this.queueNotifications(alert);

        // Notify subscribers
        this.notifySubscribers(alert);
    }

    calculateAlertSeverity(sensor) {
        if (sensor.aqi > 300) return 'critical';
        if (sensor.aqi > 200) return 'high';
        if (sensor.aqi > 150) return 'medium';
        return 'low';
    }

    generateAlertMessage(rule, sensor) {
        return `🚨 Air Quality Alert: ${sensor.station} is reporting ${sensor.aqi} AQI (${sensor.severity.replace('_', ' ').toUpperCase()}). Rule: ${rule.name}`;
    }

    async queueNotifications(alert) {
        alert.actions.forEach(action => {
            this.notificationQueue.push({
                alertId: alert.id,
                type: action,
                payload: this.prepareNotificationPayload(alert, action),
                attempts: 0,
                maxAttempts: 3
            });
        });

        // Process queue
        this.processNotificationQueue();
    }

    prepareNotificationPayload(alert, type) {
        const base = {
            title: `Air Quality Alert - ${alert.sensor.station}`,
            message: alert.message,
            timestamp: alert.triggeredAt,
            severity: alert.severity,
            sensor: alert.sensor
        };

        switch (type) {
            case 'push':
                return {
                    ...base,
                    icon: '/icons/alert-icon.png',
                    badge: '/icons/badge-icon.png',
                    tag: `aqi-alert-${alert.sensor.id}`,
                    requireInteraction: alert.severity === 'critical'
                };

            case 'email':
                return {
                    ...base,
                    html: this.generateEmailHTML(alert),
                    to: this.getEmailRecipients(alert.sensor)
                };

            case 'sms':
                return {
                    ...base,
                    to: this.getSMSRecipients(alert.sensor),
                    shortMessage: `AQI Alert: ${alert.sensor.station} - ${alert.sensor.aqi} AQI`
                };

            case 'webhook':
                return {
                    ...base,
                    webhook: this.getWebhookURL(alert.sensor),
                    data: alert
                };

            default:
                return base;
        }
    }

    async processNotificationQueue() {
        while (this.notificationQueue.length > 0) {
            const notification = this.notificationQueue.shift();

            try {
                await this.sendNotification(notification);
            } catch (error) {
                console.error('Failed to send notification:', error);

                notification.attempts++;
                if (notification.attempts < notification.maxAttempts) {
                    // Retry later
                    setTimeout(() => {
                        this.notificationQueue.push(notification);
                    }, 5000 * notification.attempts);
                }
            }
        }
    }

    notifySubscribers(alert) {
        this.subscribers.forEach(callback => {
            try {
                callback(alert);
            } catch (error) {
                console.error('Error notifying subscriber:', error);
            }
        });
    }
}