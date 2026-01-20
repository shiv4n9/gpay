const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'verifications.db');
let db = null;

// Initialize database
function initDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(err);
                return;
            }

            // Create verifications table
            db.run(`
                CREATE TABLE IF NOT EXISTS verifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id TEXT UNIQUE NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    accuracy REAL,
                    photo_path TEXT NOT NULL,
                    photo_size INTEGER,
                    timestamp INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'pending'
                )
            `, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
}

// Insert verification record
function insertVerification(data) {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO verifications 
            (transaction_id, latitude, longitude, accuracy, photo_path, photo_size, timestamp, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [
            data.transactionId,
            data.latitude,
            data.longitude,
            data.accuracy,
            data.photoPath,
            data.photoSize,
            data.timestamp,
            data.status || 'pending'
        ], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, transactionId: data.transactionId });
            }
        });
    });
}

// Get verification by transaction ID
function getVerification(transactionId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM verifications WHERE transaction_id = ?',
            [transactionId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            }
        );
    });
}

// Get all verifications
function getAllVerifications(limit = 100) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM verifications ORDER BY created_at DESC LIMIT ?',
            [limit],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

// Update verification status
function updateVerificationStatus(transactionId, status) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE verifications SET status = ? WHERE transaction_id = ?',
            [status, transactionId],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            }
        );
    });
}

module.exports = {
    initDatabase,
    insertVerification,
    getVerification,
    getAllVerifications,
    updateVerificationStatus
};
