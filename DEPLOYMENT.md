# Deployment Guide

## Prerequisites

- Node.js 14+ installed
- A domain name (for HTTPS - required for camera/GPS)
- Server with public IP (VPS, AWS, DigitalOcean, etc.)

## Quick Deployment Options

### Option 1: Deploy to Vercel (Frontend + Backend)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Set Environment Variables** (in Vercel dashboard)
- `NODE_ENV=production`

### Option 2: Deploy to Heroku

1. **Install Heroku CLI**
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

2. **Create Heroku App**
```bash
heroku create your-app-name
```

3. **Deploy**
```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

4. **Open App**
```bash
heroku open
```

### Option 3: Deploy to VPS (Ubuntu/Debian)

1. **SSH into your server**
```bash
ssh user@your-server-ip
```

2. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install PM2 (Process Manager)**
```bash
sudo npm install -g pm2
```

4. **Clone/Upload your code**
```bash
git clone your-repo-url
cd your-project
```

5. **Install dependencies**
```bash
npm install
```

6. **Start with PM2**
```bash
pm2 start server.js --name gpay-clone
pm2 save
pm2 startup
```

7. **Setup Nginx as reverse proxy**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/gpay
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **Enable site and restart Nginx**
```bash
sudo ln -s /etc/nginx/sites-available/gpay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

9. **Setup SSL with Let's Encrypt (REQUIRED for camera/GPS)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 4: Deploy to Railway

1. **Go to https://railway.app**
2. **Connect GitHub repo**
3. **Deploy automatically**
4. **Add custom domain in settings**

## Important Configuration Changes

### 1. Update API Endpoint in script.js

Change from:
```javascript
const response = await fetch('http://localhost:3000/api/verify', {
```

To:
```javascript
const response = await fetch('/api/verify', {
```

Or use environment variable:
```javascript
const API_URL = window.location.origin;
const response = await fetch(`${API_URL}/api/verify`, {
```

### 2. Update CORS in server.js

For production, restrict CORS:
```javascript
const cors = require('cors');
app.use(cors({
    origin: 'https://your-domain.com',
    credentials: true
}));
```

### 3. Environment Variables

Create `.env` file:
```env
NODE_ENV=production
PORT=3000
```

## Security Checklist

- ✅ Use HTTPS (required for camera/GPS)
- ✅ Restrict CORS to your domain
- ✅ Add rate limiting
- ✅ Validate all inputs server-side
- ✅ Secure database file permissions
- ✅ Use environment variables for secrets
- ✅ Add authentication if needed
- ✅ Regular backups of database

## Testing Deployment

1. **Test HTTPS**: Visit https://your-domain.com
2. **Test Camera**: Click "Upload QR code" - should request camera permission
3. **Test Location**: Should request location permission
4. **Test Upload**: Upload a QR image
5. **Test Request**: Click "Request" button
6. **Check Database**: Verify data is saved in `database/verifications.db`
7. **Check Admin**: Visit https://your-domain.com/admin.html

## Monitoring

### View Logs (PM2)
```bash
pm2 logs gpay-clone
```

### View Database
```bash
sqlite3 database/verifications.db
SELECT * FROM verifications;
```

### Restart App
```bash
pm2 restart gpay-clone
```

## Troubleshooting

### Camera/GPS not working
- Ensure you're using HTTPS
- Check browser console for errors
- Verify permissions are requested

### Database errors
- Check file permissions: `chmod 755 database/`
- Ensure directory exists: `mkdir -p database`

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

## Backup

### Backup Database
```bash
cp database/verifications.db database/verifications.db.backup
```

### Backup Uploads
```bash
tar -czf uploads-backup.tar.gz uploads/
```

## Domain Setup

1. **Point domain to server IP**
   - Add A record: `your-domain.com` → `your-server-ip`

2. **Wait for DNS propagation** (up to 24 hours)

3. **Setup SSL certificate** (see step 9 in VPS deployment)

## Cost Estimates

- **Vercel**: Free tier available
- **Heroku**: $7/month (Hobby tier)
- **Railway**: $5/month
- **VPS (DigitalOcean)**: $5-10/month
- **Domain**: $10-15/year

## Support

For issues, check:
- Server logs: `pm2 logs`
- Browser console: F12 → Console
- Network tab: F12 → Network
