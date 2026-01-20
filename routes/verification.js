const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    insertVerification,
    getVerification,
    getAllVerifications,
    updateVerificationStatus
} = require('../database/db');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, JPG, PNG) are allowed'));
        }
    }
});

// POST /api/verify - Main verification endpoint
router.post('/verify', upload.single('photo'), async (req, res) => {
    try {
        const { latitude, longitude, accuracy, timestamp } = req.body;
        const photo = req.file;

        // Validate required fields
        if (!latitude || !longitude || !photo) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: latitude, longitude, and photo are required'
            });
        }

        // Validate coordinates
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return res.status(400).json({
                success: false,
                error: 'Invalid GPS coordinates'
            });
        }

        // Generate transaction ID
        const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Save to database
        const verificationData = {
            transactionId,
            latitude: lat,
            longitude: lon,
            accuracy: accuracy ? parseFloat(accuracy) : null,
            photoPath: photo.path,
            photoSize: photo.size,
            timestamp: timestamp ? parseInt(timestamp) : Date.now(),
            status: 'verified'
        };

        await insertVerification(verificationData);

        // Log the verification
        console.log(`✓ Verification saved: ${transactionId}`);
        console.log(`  Location: ${lat}, ${lon} (±${accuracy}m)`);
        console.log(`  Photo: ${photo.filename} (${(photo.size / 1024).toFixed(2)} KB)`);

        // Send response
        res.json({
            success: true,
            transactionId,
            message: 'Verification successful',
            data: {
                location: {
                    latitude: lat,
                    longitude: lon,
                    accuracy: verificationData.accuracy
                },
                photo: {
                    filename: photo.filename,
                    size: photo.size
                },
                timestamp: new Date(verificationData.timestamp).toISOString()
            }
        });

    } catch (error) {
        console.error('Error processing verification:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// GET /api/verify/:transactionId - Get verification details
router.get('/verify/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        const verification = await getVerification(transactionId);

        if (!verification) {
            return res.status(404).json({
                success: false,
                error: 'Verification not found'
            });
        }

        res.json({
            success: true,
            data: verification
        });

    } catch (error) {
        console.error('Error fetching verification:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/verifications - Get all verifications
router.get('/verifications', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const verifications = await getAllVerifications(limit);

        res.json({
            success: true,
            count: verifications.length,
            data: verifications
        });

    } catch (error) {
        console.error('Error fetching verifications:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/photo/:filename - Serve uploaded photos
router.get('/photo/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            error: 'Photo not found'
        });
    }

    res.sendFile(filePath);
});

module.exports = router;
