# CORS Deployment Fix - FastAPI Backend

## Problem
The AI proposal generation fails on the deployed version with a CORS error:
```
Failed to generate proposal. Please try again.
Access to fetch at 'https://foundrkit.onrender.com/generate-proposal'
from origin 'https://foundrkit.vercel.app'
has been blocked by CORS policy
```

## Root Cause
- The FastAPI backend was using `allow_origins=["*"]` with `allow_credentials=True`
- This combination doesn't work reliably across browsers and production environments
- Render wasn't properly handling CORS preflight (OPTIONS) requests

## Solution Implemented

### Backend Changes (main.py)
Updated CORS configuration to:
1. **Explicitly allow domains** instead of wildcard:
   - `https://foundrkit.vercel.app` (production)
   - `http://localhost:3000` (local development)

2. **Use environment variable** for flexibility:
   ```python
   allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,https://foundrkit.vercel.app").split(",")
   ```

3. **Specific HTTP methods** instead of wildcards:
   - GET, POST, PUT, DELETE, OPTIONS

4. **Proper headers** configuration:
   - Content-Type, Authorization, Accept

## Render Deployment Configuration

### Step 1: Update Environment Variables on Render
Go to **Render Dashboard** → Your Backend Service → **Environment**

Add/Update:
```
ALLOWED_ORIGINS=http://localhost:3000,https://foundrkit.vercel.app,https://foundrkit.onrender.com
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_api_key
```

### Step 2: Redeploy Backend
1. Push the updated `main.py` to GitHub
2. Render will auto-redeploy, or manually trigger a deployment
3. Wait for deployment to complete

### Step 3: Test on Deployed Version
1. Go to https://foundrkit.vercel.app
2. Try generating a proposal
3. Check browser DevTools (F12) → Network tab
4. Verify:
   - OPTIONS request returns `200 OK`
   - `Access-Control-Allow-Origin: https://foundrkit.vercel.app` header is present
   - Actual request succeeds

## Local Development Testing

Make sure your local Render backend works with Vercel frontend:

```bash
# Terminal 1: Start Next.js frontend
cd frondrkit
npm run dev
# Runs on http://localhost:3000

# Terminal 2: Start FastAPI backend
cd backend
source venv/Scripts/activate  # Windows: .\venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Runs on http://localhost:8000
```

## Troubleshooting

### Still getting CORS error?
1. **Clear browser cache** (Cmd+Shift+Delete)
2. **Check Render logs** (Render Dashboard → Backend → Logs)
3. **Verify ALLOWED_ORIGINS** contains the exact frontend URL
4. **Test with curl:**
   ```bash
   curl -X OPTIONS https://foundrkit.onrender.com/generate-proposal \
     -H "Origin: https://foundrkit.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: content-type" \
     -v
   ```

### OPTIONS request returns 405?
- The CORS middleware should handle this automatically
- If not, restart the Render service

### 502 Bad Gateway?
- Backend might be down or out of memory
- Check Render logs for errors
- Verify all environment variables are set

## Files Modified
- ✅ `backend/main.py` - Updated CORS middleware configuration

## No Changes Needed
- ❌ `frontend` (Vercel) - No frontend changes required
- ❌ `requirements.txt` - All dependencies already present
