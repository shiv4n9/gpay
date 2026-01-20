// Vercel serverless function
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper to parse multipart form data
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            // Parse multipart form data
            await runMiddleware(req, res, upload.single('photo'));

            const { latitude, longitude, accuracy, timestamp, amount, recipientName, recipientUpi, note } = req.body;
            const photo = req.file;

            if (!latitude || !longitude || !photo) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields'
                });
            }

            // Generate transaction ID
            const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

            // Create verification record
            const verificationData = {
                transactionId,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                accuracy: accuracy ? parseFloat(accuracy) : null,
                amount: amount || '0',
                recipientName: recipientName || '',
                recipientUpi: recipientUpi || '',
                note: note || '',
                photoSize: photo.size,
                photoData: photo.buffer.toString('base64'), // Store as base64
                timestamp: timestamp ? parseInt(timestamp) : Date.now(),
                createdAt: new Date().toISOString()
            };

            // Store in Vercel KV or send to webhook
            // For now, we'll use a simple JSON storage approach
            // In production, use Vercel KV, MongoDB, or PostgreSQL
            
            console.log('Verification received:', {
                transactionId,
                latitude,
                longitude,
                amount,
                recipientName,
                photoSize: photo.size
            });

            // Send to webhook (optional - for external storage)
            if (process.env.WEBHOOK_URL) {
                try {
                    await fetch(process.env.WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(verificationData)
                    });
                } catch (webhookError) {
                    console.error('Webhook error:', webhookError);
                }
            }

            // Return success
            res.json({
                success: true,
                transactionId,
                message: 'Verification successful',
                data: {
                    location: {
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                        accuracy: parseFloat(accuracy || 0)
                    },
                    photo: {
                        size: photo.size
                    },
                    amount: amount,
                    timestamp: new Date(parseInt(timestamp || Date.now())).toISOString()
                }
            });

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
