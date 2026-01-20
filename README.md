# Payment Verification Web Page

A web page that simultaneously captures GPS coordinates and a camera frame when the user clicks a button, then sends the data to a server.

## Features

- 📷 Camera access with QR scanner-style interface
- 📍 GPS location capture with high accuracy
- 🔒 Requires user interaction (button click) for permissions
- 📤 Sends captured data to server endpoint
- ✨ Modern, responsive UI design

## How It Works

1. User clicks "Request Payment" button
2. Browser requests Camera and Location permissions simultaneously
3. Once granted, the camera starts and location is captured
4. Photo is automatically captured from video stream
5. Data (photo + GPS coordinates) is sent to server via POST request
6. Results are displayed to the user

## Files

### Frontend
- `index.html` - Main HTML structure
- `styles.css` - Styling and animations
- `script.js` - Core functionality (camera, GPS, data capture)

### Backend
- `server.js` - Main Express server
- `routes/verification.js` - API routes and endpoints
- `database/db.js` - SQLite database operations
- `package.json` - Dependencies and scripts
- `.env` - Environment configuration

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 3. Open the Application

Visit: `http://localhost:3000`

The server will:
- Serve the frontend files
- Handle API requests at `/api/verify`
- Store data in SQLite database
- Save photos in `uploads/` directory

## API Endpoints

### POST /api/verify
Submit verification with photo and GPS data.

**Request:**
- `photo` (file) - JPEG/PNG image
- `latitude` (number) - GPS latitude
- `longitude` (number) - GPS longitude
- `accuracy` (number) - Location accuracy in meters
- `timestamp` (number) - Capture timestamp

**Response:**
```json
{
  "success": true,
  "transactionId": "TXN1234567890ABC",
  "message": "Verification successful",
  "data": {
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "accuracy": 10.5
    },
    "photo": {
      "filename": "photo-1234567890.jpg",
      "size": 245678
    },
    "timestamp": "2026-01-20T12:00:00.000Z"
  }
}
```

### GET /api/verify/:transactionId
Retrieve verification details by transaction ID.

### GET /api/verifications?limit=100
Get all verifications (default limit: 100).

### GET /api/photo/:filename
Retrieve uploaded photo by filename.

### GET /api/health
Health check endpoint.

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 11+)
- Requires HTTPS (except localhost)

## Database

The backend uses SQLite to store verification records:

**Schema:**
- `id` - Auto-incrementing primary key
- `transaction_id` - Unique transaction identifier
- `latitude` / `longitude` - GPS coordinates
- `accuracy` - Location accuracy in meters
- `photo_path` - Path to uploaded photo
- `photo_size` - Photo file size in bytes
- `timestamp` - Capture timestamp
- `created_at` - Database insertion time
- `status` - Verification status (pending/verified/rejected)

Database file: `database/verifications.db`

## Production Deployment

### Environment Variables

Update `.env` for production:

```env
PORT=3000
NODE_ENV=production
```

### HTTPS Configuration

For production, use HTTPS. Camera and GPS APIs require secure context:

1. Use a reverse proxy (nginx, Apache)
2. Or configure Express with SSL certificates
3. Or deploy to platforms with automatic HTTPS (Heroku, Vercel, etc.)

### Security Checklist

- ✓ Camera and GPS require user permission
- ✓ Permissions triggered by user interaction only
- ✓ Input validation on all endpoints
- ✓ File upload size limits (10MB)
- ✓ File type validation (JPEG/PNG only)
- ✓ CORS configuration
- ⚠ Add authentication/authorization for production
- ⚠ Add rate limiting
- ⚠ Encrypt sensitive data at rest
- ⚠ Use environment variables for secrets

## Customization

### Frontend
- Change button text in `index.html`
- Modify colors in `styles.css`
- Adjust camera quality in `script.js` (video constraints)
- Configure GPS accuracy in `getLocation()` function

### Backend
- Modify database schema in `database/db.js`
- Add custom validation in `routes/verification.js`
- Configure upload limits in multer settings
- Add additional API endpoints as needed
