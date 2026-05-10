# Backend Health Check Guide

## Overview
The backend now includes a comprehensive health check system to verify if the service is working correctly.

## How to Check Backend Status

### 1. **Using the Health Check API Endpoint**
Once the backend is running, you can check its status by visiting:

```
http://localhost:5000/api/health
```

Or use `curl`:
```bash
curl http://localhost:5000/api/health
```

**Response Example:**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-05-10T10:30:45.123Z",
  "uptime": 125.45,
  "environment": "development",
  "database": {
    "status": "connected",
    "connection": true,
    "responsive": true
  },
  "server": {
    "status": "ok",
    "nodeVersion": "v18.0.0",
    "memory": {
      "rss": 45678900,
      "heapTotal": 23456000,
      "heapUsed": 12345000,
      "external": 890000,
      "arrayBuffers": 0
    }
  },
  "responseTime": "5ms"
}
```

### 2. **Using the NPM Health Script** (Recommended)
The easiest way to check backend status:

```bash
npm run health
```

This will:
- ✅ Check if the backend is running
- ✅ Display detailed health information
- ✅ Show database connection status
- ✅ Display server uptime and memory usage

**Output Example:**
```
🏥 Backend Health Check:

{
  "success": true,
  "status": "ok",
  "timestamp": "2026-05-10T10:30:45.123Z",
  "uptime": 125.45,
  ...
}

✅ Backend is running!
```

If the backend is not running:
```
❌ Backend is not running. Start it with: npm run dev
```

## What Gets Checked

| Check | Details |
|-------|---------|
| **Server Status** | If Express server is running |
| **Database Connection** | MongoDB connection state and responsiveness |
| **Node Version** | Current Node.js version |
| **Memory Usage** | RAM allocation and heap usage |
| **Response Time** | Time taken to check health |
| **Uptime** | How long the server has been running |
| **Environment** | Development/Production mode |

## Status Codes

- **200** - Backend is fully operational
- **503** - Backend is running but has issues (e.g., database disconnected)
- **Connection Error** - Backend is not running

## Workflow

### Development
```bash
# Terminal 1: Start the backend
npm run dev

# Terminal 2: Check health
npm run health
```

### Production
```bash
npm start

# Then check:
curl http://localhost:5000/api/health
```

## Troubleshooting

**Backend not responding to health check?**
1. Make sure the backend is running: `npm run dev`
2. Check if MongoDB connection is working
3. Verify `MONGO_URI` in `.env` file
4. Check network/firewall settings

**Database shows as disconnected?**
1. Verify MongoDB is running
2. Check `MONGO_URI` environment variable
3. Verify network connectivity to MongoDB server

## Integration with Frontend

You can also check backend status from your frontend:

```javascript
async function checkBackendHealth() {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('Backend is healthy:', data.success);
    return data;
  } catch (error) {
    console.error('Backend is not responding:', error);
  }
}
```

---

**Created:** May 2026  
**Backend Version:** 1.0.0
