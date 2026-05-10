# Frontend Vercel Deployment Fix Guide

## 🔴 Problem
Frontend shows 404 NOT_FOUND on Vercel because:
1. Environment variables are not set in Vercel
2. SPA routing wasn't configured
3. API URL fallback was missing

## ✅ What I Fixed

### 1. **Added Fallback API URL**
- Updated `src/services/api.js` with fallback URL
- Now uses: `VITE_API_URL` env var or fallbacks to Render backend

### 2. **Created `vercel.json` Configuration**
- Properly configures SPA routing (all routes go to index.html)
- Sets up environment variable mapping

### 3. **Created `.env.local` for Development**
- For local testing with `npm run dev`

## 📋 Required Steps

### **Step 1: Set Environment Variables in Vercel** ⭐ IMPORTANT

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add this variable:

```
Name: VITE_API_URL
Value: https://backend-1-1g73.onrender.com/api
```

4. Make sure it's set for **Production** and **Preview** environments
5. Click **Save**

### **Step 2: Push Changes to GitHub**

```bash
git add .
git commit -m "Fix: Vercel SPA routing and environment variables"
git push
```

### **Step 3: Redeploy on Vercel**

- Go to Vercel Dashboard → Your Project
- Click **Redeploy** or wait for automatic redeploy after git push
- Wait for build to complete

### **Step 4: Verify the Fix**

1. Visit your frontend: `https://frontend-m88-kirchrn-vishnuyashu684-415f5-projects.vercel.app/signup`
2. Check browser console (F12) - should NOT show 404 errors
3. Try signing up - should work now

## 🧪 Local Testing

To test locally before deploying:

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

Then visit: `http://localhost:5173`

## 📝 Files Modified/Created

- `frontend/.env.local` - Local development variables
- `frontend/src/services/api.js` - Added fallback URL
- `frontend/vercel.json` - Vercel configuration with SPA routing

## ❓ Troubleshooting

**Still getting 404?**
1. Check Vercel environment variables are saved ✓
2. Wait 5-10 minutes for Vercel to rebuild
3. Clear browser cache (Ctrl+Shift+Del)
4. Check Console tab for errors

**API calls still failing?**
1. Backend URL in Vercel env var is correct?
2. Backend CORS allows Vercel domain?
3. Check Network tab → XHR requests

**Can't see changes?**
1. Make sure all changes are pushed to GitHub
2. Vercel redeploy is complete (check deployment logs)
3. Browser cache cleared

---

**Status**: Frontend should now load and connect to backend on Vercel! 🎉
