# Frontend API Connection Fix

## 🔍 Issue Found

The backend API is working (tested with curl), but frontend can't connect. This is a **frontend API URL configuration issue**.

## ✅ Fix Applied

### File: `frontend/src/utils/axios.js`
- Added `getBaseURL()` helper function
- Ensures API_URL is set correctly in production
- Defaults to `https://api.onchainforexai.com` in production builds

### File: `frontend/src/config/appConfig.js`
- Fixed production detection logic
- Now correctly detects production builds

## 🚀 What You Need to Do

### Option 1: Set Environment Variable (Recommended)

Create or update `frontend/.env.production`:
```bash
VITE_API_URL=https://api.onchainforexai.com
VITE_FRONTEND_URL=https://onchainforexai.com
VITE_APP_ENV=production
```

### Option 2: Rebuild Frontend

After setting environment variables, rebuild:
```bash
cd frontend
npm run build
```

### Option 3: Check Browser Console

Open browser console (F12) and check:
1. What API_URL is being used
2. Any CORS errors
3. Network tab - see what URL is being called

## 🔧 Quick Test

After rebuild, check browser console for:
```
🔧 API Configuration: {
  baseURL: "https://api.onchainforexai.com",
  ...
}
```

If it shows empty or wrong URL, the environment variable is not set.

## 📝 Files Modified

1. ✅ `frontend/src/utils/axios.js` - Added getBaseURL() helper
2. ✅ `frontend/src/config/appConfig.js` - Fixed production detection

## ⚠️ Important

The frontend needs to be **rebuilt** after setting environment variables for production builds to pick them up!

---

*Fix applied: Frontend API URL configuration*
