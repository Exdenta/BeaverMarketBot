import sqlite3 from 'sqlite3';
import { logger } from '../utils/logger.js';

export class DatabaseService {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DATABASE_PATH || './data/market_data.db';
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    logger.error('Error opening database:', err);
                    reject(err);
                } else {
                    logger.info('Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS market_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT NOT NULL,
                value REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT NOT NULL,
                alert_type TEXT NOT NULL,
                threshold_value REAL NOT NULL,
                current_value REAL NOT NULL,
                message TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                sent BOOLEAN DEFAULT FALSE
            )`,
            `CREATE TABLE IF NOT EXISTS user_settings (
                user_id INTEGER PRIMARY KEY,
                chat_id INTEGER NOT NULL,
                notifications_enabled BOOLEAN DEFAULT TRUE,
                alert_preferences TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await this.runQuery(table);
        }

        await this.createIndexes();
        logger.info('Database tables created successfully');
    }

    async createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_metric_name_timestamp ON market_metrics(metric_name, timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_alerts_sent ON alerts(sent)'
        ];

        for (const index of indexes) {
            await this.runQuery(index);
        }
    }

    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    logger.error('Database query error:', err);
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }

    getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    logger.error('Database get error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    allQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    logger.error('Database all error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async saveMetric(metricName, value, metadata = null) {
        const sql = 'INSERT INTO market_metrics (metric_name, value, metadata) VALUES (?, ?, ?)';
        return await this.runQuery(sql, [metricName, value, JSON.stringify(metadata)]);
    }

    async getLatestMetric(metricName) {
        const sql = 'SELECT * FROM market_metrics WHERE metric_name = ? ORDER BY timestamp DESC LIMIT 1';
        return await this.getQuery(sql, [metricName]);
    }

    async getMetricHistory(metricName, days = 30) {
        const sql = `
            SELECT * FROM market_metrics 
            WHERE metric_name = ? 
            AND timestamp > datetime('now', '-${days} days')
            ORDER BY timestamp ASC
        `;
        return await this.allQuery(sql, [metricName]);
    }

    async saveAlert(alertData) {
        const sql = `
            INSERT INTO alerts (metric_name, alert_type, threshold_value, current_value, message, sent) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        return await this.runQuery(sql, [
            alertData.metricName,
            alertData.alertType,
            alertData.thresholdValue,
            alertData.currentValue,
            alertData.message,
            alertData.sent || false
        ]);
    }

    async getPendingAlerts() {
        const sql = 'SELECT * FROM alerts WHERE sent = FALSE ORDER BY timestamp ASC';
        return await this.allQuery(sql);
    }

    async markAlertSent(alertId) {
        const sql = 'UPDATE alerts SET sent = TRUE WHERE id = ?';
        return await this.runQuery(sql, [alertId]);
    }

    async saveUserSettings(userId, chatId, preferences = {}) {
        const sql = `
            INSERT OR REPLACE INTO user_settings (user_id, chat_id, alert_preferences) 
            VALUES (?, ?, ?)
        `;
        return await this.runQuery(sql, [userId, chatId, JSON.stringify(preferences)]);
    }

    async getUserSettings(userId) {
        const sql = 'SELECT * FROM user_settings WHERE user_id = ?';
        return await this.getQuery(sql, [userId]);
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    logger.error('Error closing database:', err);
                } else {
                    logger.info('Database connection closed');
                }
            });
        }
    }
}