const logger = require('../baseLogger');
const BaseFactory = require('./BaseFactory');
const os = require('os');

class MetricFactory extends BaseFactory {
    static #metrics = new Map();
    static #intervals = new Set();

    static createMetric(name, initialValue = 0, metadata = {}) {
        const metric = {
            name,
            value: initialValue,
            metadata,
            timestamp: new Date().toISOString(),
            history: []
        };

        this.#metrics.set(name, metric);
        return metric;
    }

    static incrementMetric(name, increment = 1, metadata = {}) {
        const metric = this.#metrics.get(name) || this.createMetric(name, 0, metadata);
        metric.value += increment;
        metric.timestamp = new Date().toISOString();
        metric.history.push({ value: metric.value, timestamp: metric.timestamp });

        if (metric.history.length > 100) {
            metric.history.shift();
        }

        logger.debug('Metric incremented', {
            type: 'METRIC_INCREMENT',
            metric: name,
            value: metric.value,
            increment,
            ...this.enrichBaseMetadata(metadata)
        });

        return metric;
    }

    static setMetric(name, value, metadata = {}) {
        const metric = this.#metrics.get(name) || this.createMetric(name, value, metadata);
        metric.value = value;
        metric.timestamp = new Date().toISOString();
        metric.history.push({ value, timestamp: metric.timestamp });

        if (metric.history.length > 100) {
            metric.history.shift();
        }

        logger.debug('Metric set', {
            type: 'METRIC_SET',
            metric: name,
            value,
            ...this.enrichBaseMetadata(metadata)
        });

        return metric;
    }

    static getMetric(name) {
        return this.#metrics.get(name);
    }

    static getAllMetrics() {
        return Array.from(this.#metrics.values());
    }

    static startSystemMetrics(interval = 60000) {
        const systemMetricsInterval = setInterval(() => {
            // CPU Usage
            const cpuUsage = process.cpuUsage();
            this.setMetric('system.cpu.user', cpuUsage.user);
            this.setMetric('system.cpu.system', cpuUsage.system);

            // Memory Usage
            const memoryUsage = process.memoryUsage();
            this.setMetric('system.memory.heapUsed', memoryUsage.heapUsed);
            this.setMetric('system.memory.heapTotal', memoryUsage.heapTotal);
            this.setMetric('system.memory.rss', memoryUsage.rss);
            this.setMetric('system.memory.external', memoryUsage.external);

            // System Memory
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            this.setMetric('system.memory.total', totalMem);
            this.setMetric('system.memory.free', freeMem);
            this.setMetric('system.memory.used', totalMem - freeMem);

            // Load Average
            const loadAvg = os.loadavg();
            this.setMetric('system.load.1m', loadAvg[0]);
            this.setMetric('system.load.5m', loadAvg[1]);
            this.setMetric('system.load.15m', loadAvg[2]);

            // Process Uptime
            this.setMetric('system.uptime', process.uptime());

        }, interval);

        this.#intervals.add(systemMetricsInterval);
        return systemMetricsInterval;
    }

    static startCustomMetric(name, collector, interval = 60000) {
        const customMetricInterval = setInterval(async () => {
            try {
                const value = await collector();
                this.setMetric(name, value);
            } catch (error) {
                logger.error('Error collecting custom metric', {
                    metric: name,
                    error
                });
            }
        }, interval);

        this.#intervals.add(customMetricInterval);
        return customMetricInterval;
    }

    static stopMetricCollection(intervalId) {
        clearInterval(intervalId);
        this.#intervals.delete(intervalId);
    }

    static cleanup() {
        for (const interval of this.#intervals) {
            clearInterval(interval);
        }
        this.#intervals.clear();
        this.#metrics.clear();
    }
}

module.exports = MetricFactory;
