/**
 * Performance Monitoring Utilities
 * Tracks Core Web Vitals and custom metrics for production optimization
 */
class PerformanceMonitor {
    metrics = [];
    observers = [];
    reportingEndpoint = null;
    constructor(reportingEndpoint) {
        this.reportingEndpoint = reportingEndpoint || null;
        this.initializeObservers();
        this.trackPageLoad();
    }
    /**
     * Initialize performance observers for Web Vitals
     */
    initializeObservers() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.recordMetric({
                        name: 'lcp',
                        value: lastEntry.startTime,
                        timestamp: Date.now(),
                        type: 'web-vital',
                        metadata: { url: window.location.href }
                    });
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
                this.observers.push(lcpObserver);
            }
            catch (e) {
                console.warn('LCP observer not supported:', e);
            }
            // First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        this.recordMetric({
                            name: 'fid',
                            value: entry.processingStart - entry.startTime,
                            timestamp: Date.now(),
                            type: 'web-vital',
                            metadata: { url: window.location.href }
                        });
                    });
                });
                fidObserver.observe({ type: 'first-input', buffered: true });
                this.observers.push(fidObserver);
            }
            catch (e) {
                console.warn('FID observer not supported:', e);
            }
            // Cumulative Layout Shift (CLS)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    this.recordMetric({
                        name: 'cls',
                        value: clsValue,
                        timestamp: Date.now(),
                        type: 'web-vital',
                        metadata: { url: window.location.href }
                    });
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });
                this.observers.push(clsObserver);
            }
            catch (e) {
                console.warn('CLS observer not supported:', e);
            }
        }
    }
    /**
     * Track page load performance
     */
    trackPageLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                // Time to First Byte (TTFB)
                this.recordMetric({
                    name: 'ttfb',
                    value: navigation.responseStart - navigation.requestStart,
                    timestamp: Date.now(),
                    type: 'web-vital'
                });
                // First Contentful Paint (FCP)
                const paintEntries = performance.getEntriesByType('paint');
                const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
                if (fcpEntry) {
                    this.recordMetric({
                        name: 'fcp',
                        value: fcpEntry.startTime,
                        timestamp: Date.now(),
                        type: 'web-vital'
                    });
                }
                // DOM Content Loaded
                this.recordMetric({
                    name: 'domContentLoaded',
                    value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                    timestamp: Date.now(),
                    type: 'navigation'
                });
                // Full page load
                this.recordMetric({
                    name: 'pageLoad',
                    value: navigation.loadEventEnd - navigation.fetchStart,
                    timestamp: Date.now(),
                    type: 'navigation'
                });
            }, 0);
        });
    }
    /**
     * Record a custom performance metric
     */
    recordMetric(metric) {
        this.metrics.push(metric);
        // Report to analytics if endpoint is configured
        if (this.reportingEndpoint) {
            this.reportMetric(metric);
        }
        // Log critical metrics to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Performance Metric: ${metric.name} = ${metric.value.toFixed(2)}ms`);
        }
    }
    /**
     * Start timing a custom operation
     */
    startTiming(name) {
        const startTime = performance.now();
        return () => {
            const duration = performance.now() - startTime;
            this.recordMetric({
                name,
                value: duration,
                timestamp: Date.now(),
                type: 'custom'
            });
        };
    }
    /**
     * Track map-specific performance metrics
     */
    trackMapMetrics(mapInstance) {
        if (!mapInstance)
            return;
        // Map load time
        const mapLoadStart = performance.now();
        mapInstance.on('load', () => {
            const loadTime = performance.now() - mapLoadStart;
            this.recordMetric({
                name: 'mapLoad',
                value: loadTime,
                timestamp: Date.now(),
                type: 'custom',
                metadata: { component: 'mapbox' }
            });
        });
        // Map style load time
        mapInstance.on('style.load', () => {
            this.recordMetric({
                name: 'mapStyleLoad',
                value: performance.now() - mapLoadStart,
                timestamp: Date.now(),
                type: 'custom',
                metadata: { component: 'mapbox' }
            });
        });
        // Track map idle state (rendering complete)
        mapInstance.on('idle', () => {
            this.recordMetric({
                name: 'mapIdle',
                value: performance.now() - mapLoadStart,
                timestamp: Date.now(),
                type: 'custom',
                metadata: { component: 'mapbox' }
            });
        });
    }
    /**
     * Track API request performance
     */
    trackApiRequest(url, startTime, success, responseSize) {
        const duration = performance.now() - startTime;
        this.recordMetric({
            name: 'apiRequest',
            value: duration,
            timestamp: Date.now(),
            type: 'custom',
            metadata: {
                url,
                success,
                responseSize,
                endpoint: url.split('/').pop()
            }
        });
    }
    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const webVitals = {};
        const customMetrics = [];
        this.metrics.forEach(metric => {
            if (metric.type === 'web-vital') {
                webVitals[metric.name] = metric.value;
            }
            else {
                customMetrics.push(metric);
            }
        });
        return { ...webVitals, customMetrics };
    }
    /**
     * Check if performance meets targets
     */
    checkPerformanceTargets() {
        const targets = {
            fcp: 1800, // First Contentful Paint < 1.8s
            lcp: 2500, // Largest Contentful Paint < 2.5s
            fid: 100, // First Input Delay < 100ms
            cls: 0.1, // Cumulative Layout Shift < 0.1
            ttfb: 600 // Time to First Byte < 600ms
        };
        const details = {};
        let totalScore = 0;
        let metricsChecked = 0;
        Object.entries(targets).forEach(([metricName, target]) => {
            const metric = this.metrics.find(m => m.name === metricName && m.type === 'web-vital');
            if (metric) {
                const passing = metric.value <= target;
                details[metricName] = {
                    value: metric.value,
                    target,
                    passing
                };
                totalScore += passing ? 1 : 0;
                metricsChecked++;
            }
        });
        const score = metricsChecked > 0 ? (totalScore / metricsChecked) * 100 : 0;
        const passing = score >= 90; // 90%+ metrics must pass
        return { score, passing, details };
    }
    /**
     * Report metric to analytics endpoint
     */
    async reportMetric(metric) {
        if (!this.reportingEndpoint)
            return;
        try {
            await fetch(this.reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...metric,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    sessionId: this.getSessionId()
                })
            });
        }
        catch (error) {
            console.warn('Failed to report performance metric:', error);
        }
    }
    /**
     * Generate session ID for tracking
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('performanceSessionId');
        if (!sessionId) {
            sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            sessionStorage.setItem('performanceSessionId', sessionId);
        }
        return sessionId;
    }
    /**
     * Clean up observers
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.metrics = [];
    }
}
// Create global performance monitor instance
export const performanceMonitor = new PerformanceMonitor('/api/analytics/performance');
// React hook for performance monitoring
export function usePerformanceMonitor() {
    const startTiming = (name) => performanceMonitor.startTiming(name);
    const recordMetric = (metric) => performanceMonitor.recordMetric(metric);
    const getPerformanceSummary = () => performanceMonitor.getPerformanceSummary();
    const checkPerformanceTargets = () => performanceMonitor.checkPerformanceTargets();
    return {
        startTiming,
        recordMetric,
        getPerformanceSummary,
        checkPerformanceTargets,
        trackMapMetrics: (mapInstance) => performanceMonitor.trackMapMetrics(mapInstance),
        trackApiRequest: (url, startTime, success, responseSize) => performanceMonitor.trackApiRequest(url, startTime, success, responseSize)
    };
}
export default performanceMonitor;
