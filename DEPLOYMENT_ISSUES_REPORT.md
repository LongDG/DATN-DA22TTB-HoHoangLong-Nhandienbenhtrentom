# 🔴 Codebase Deployment Issues Report

**Analysis Date:** May 27, 2026  
**Status:** ⚠️ **CRITICAL** — Multiple blocking issues found. Production deployment not recommended without fixes.

---

## Executive Summary

The codebase has **significant deployment issues** across all three services (Frontend, Backend, AI Service). Key problems include:

- **Hardcoded localhost URLs** throughout the application
- **Exposed credentials** in .env file
- **Missing environment variable configurations** in .env.example
- **CORS restrictions** preventing inter-service communication in production
- **No production-grade configuration** for database, file storage, or security
- **Inadequate error handling** and logging for production

---

## 1. 🔴 FRONTEND CRITICAL ISSUES

### 1.1 Hardcoded API URLs (BLOCKING)

**Severity:** CRITICAL  
**Impact:** Application cannot communicate with production backend

**Files with hardcoded localhost:5000:**
- [src/App.jsx](src/App.jsx#L28): `const API_URL = 'http://localhost:5000/api';`
- [src/utils/authFetch.js](src/utils/authFetch.js#L17): `export const API_BASE = 'http://localhost:5000/api';`
- [src/components/user/UserHeader.jsx](src/components/user/UserHeader.jsx#L8): `const API_BASE = 'http://localhost:5000/api';`
- [src/pages/ForgotPasswordPage.jsx](src/pages/ForgotPasswordPage.jsx#L7): `const API = 'http://localhost:5000/api';`
- [src/pages/OTPPage.jsx](src/pages/OTPPage.jsx#L7): `const API = 'http://localhost:5000/api';`
- [src/pages/ResetPasswordPage.jsx](src/pages/ResetPasswordPage.jsx#L7): `const API = 'http://localhost:5000/api';`
- [src/pages/admin/DashboardOverview.jsx](src/pages/admin/DashboardOverview.jsx#L11): `const API_BASE = 'http://localhost:5000/api';`
- [src/pages/admin/DiagnosticLog.jsx](src/pages/admin/DiagnosticLog.jsx#L7): `const API_BASE = 'http://localhost:5000/api';`
- [src/pages/admin/InventoryPage.jsx](src/pages/admin/InventoryPage.jsx#L8): `const API_BASE = 'http://localhost:5000/api';`
- [src/pages/admin/OrdersPage.jsx](src/pages/admin/OrdersPage.jsx#L9): `const API_BASE = 'http://localhost:5000/api';`
- [src/pages/user/UserDashboard.jsx](src/pages/user/UserDashboard.jsx#L12): `const API_BASE = 'http://localhost:5000/api';`
- [src/pages/user/UserDashboard.jsx](src/pages/user/UserDashboard.jsx#L725): Direct `fetch('http://localhost:5000/api/shrimp-prices')`
- [src/pages/user/UserDashboard.jsx](src/pages/user/UserDashboard.jsx#L842): Direct `fetch('http://localhost:5000/api/products/featured')`

**Fix Required:**
```javascript
// Option 1: Use environment variable (recommended)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create .env.local and .env.production
// .env.local (development)
VITE_API_URL=http://localhost:5000/api

// .env.production (production)
VITE_API_URL=https://api.production.domain.com/api
```

### 1.2 No .env Configuration for Frontend

**Severity:** CRITICAL  
**Impact:** Cannot configure different API endpoints for different environments

**Missing:**
- No `.env`, `.env.local`, `.env.production` files
- No documentation for environment setup
- No VITE environment variable configuration

**Required Files:**
```
frontend/
├── .env.example              (NEW - document all env vars)
├── .env.local                (NEW - development, git-ignored)
└── .env.production            (NEW - production, git-ignored)
```

### 1.3 Vite Dev Server Port Hardcoded

**Severity:** MEDIUM  
**File:** [vite.config.js](vite.config.js)  
**Issue:** Port 5173 is hardcoded with `strictPort: true`

```javascript
server: {
  port: 5173,
  strictPort: true,  // ⚠️ Will fail if port is already in use
}
```

**Fix:**
```javascript
server: {
  port: parseInt(process.env.VITE_PORT || '5173'),
  strictPort: false,  // Allow fallback port
}
```

### 1.4 Missing Build Output Configuration

**Severity:** LOW  
**File:** [vite.config.js](vite.config.js)  
**Issue:** No explicit output directory or build optimization settings

**Current:** Uses default `dist/` directory  
**Recommended Addition:**
```javascript
build: {
  outDir: 'dist',
  sourcemap: false,  // Disable in production
  minify: 'terser',
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': ['react', 'react-dom', 'react-router-dom'],
      }
    }
  }
}
```

### 1.5 CORS Not Configured on Frontend

**Severity:** MEDIUM  
**Issue:** Frontend assumes CORS is enabled on backend (depends on backend configuration)

---

## 2. 🔴 BACKEND CRITICAL ISSUES

### 2.1 CORS Hardcoded to localhost:5173 (BLOCKING)

**Severity:** CRITICAL  
**File:** [server.js](server.js#L24)

```javascript
app.use(cors({ origin: "http://localhost:5173" }));  // ⚠️ Production will fail
```

**Impact:** 
- Production frontend cannot communicate with backend
- Only works when frontend is on exactly `http://localhost:5173`

**Fix:**
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));
```

**Required Environment Variable:**
```
CORS_ORIGIN=https://your-production-domain.com
```

### 2.2 Google OAuth Callback URL Hardcoded (BLOCKING)

**Severity:** CRITICAL  
**Files:**
- [.env](backend/.env#L9): `GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback`
- [.env.example](backend/.env.example) - Missing MONGO_URI and has hardcoded URL
- [config/passport.js](config/passport.js#L10): Reads from env but env is hardcoded

**Impact:** 
- Google OAuth cannot work in production
- Must update Google OAuth app settings for each environment
- Current hardcoded value only works for localhost

**Fix:**
```
# .env.development
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# .env.production
GOOGLE_CALLBACK_URL=https://api.production.domain.com/api/auth/google/callback
```

**Additional Fix in routes:**
- [authRoutes.js](authRoutes.js#L33): `failureRedirect: "http://localhost:5173/login?error=failed"` is hardcoded

```javascript
// Should use environment variable
failureRedirect: process.env.FRONTEND_URL + '/login?error=failed',
```

### 2.3 Google OAuth Credentials Exposed in .env

**Severity:** CRITICAL - SECURITY  
**File:** [backend/.env](backend/.env)

```
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
TEXTBEE_API_KEY=your_textbee_api_key_here
TEXTBEE_DEVICE_ID=your_textbee_device_id_here
JWT_SECRET=your_jwt_secret_key_here
```

**⚠️ CRITICAL ISSUE:** 
- **Real credentials are exposed in the repository**
- API keys can be revoked and regenerated immediately
- The .env file should NEVER be committed

**Actions Required:**
1. Immediately revoke all exposed API keys:
   - [ ] Google OAuth credentials
   - [ ] TextBee API key
   - [ ] JWT secret

2. Generate new credentials:
   ```bash
   # Generate new JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Update .gitignore confirmation:
   ```
   # backend/.gitignore should include:
   .env
   .env.local
   .env.*.local
   node_modules/
   ```

4. Create .env.example without credentials:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/BANTHUOC
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   JWT_SECRET=your_jwt_secret_key_here
   TEXTBEE_API_KEY=your_textbee_api_key_here
   TEXTBEE_DEVICE_ID=your_textbee_device_id_here
   SERVER_URL=http://localhost:5000
   AI_SERVICE_URL=http://localhost:5001
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   NODE_ENV=development
   ```

### 2.4 MongoDB Connection Not Documented in .env.example

**Severity:** MEDIUM  
**File:** [.env.example](backend/.env.example) vs [.env](backend/.env#L4)

**Issue:** 
- `.env.example` has no MongoDB connection string
- New developers won't know MONGO_URI is required
- Production deployment instructions unclear

**Current .env.example Missing:**
```env
MONGO_URI=mongodb://localhost:27017/BANTHUOC
```

**Fix:** Update .env.example to include:
```env
# MongoDB Connection
MONGO_URI=mongodb://username:password@mongodb-server:27017/BANTHUOC?retryWrites=true&w=majority
# For Atlas: mongodb+srv://username:password@cluster.mongodb.net/BANTHUOC
```

### 2.5 Missing Environment Variables in .env.example

**Severity:** MEDIUM  
**File:** [.env.example](backend/.env.example)

**Missing Configuration:**
- ❌ `AI_SERVICE_URL` - Required for diagnosis feature
- ❌ `CLOUDINARY_*` - Required for image storage
- ❌ `NODE_ENV` - Critical for production configuration
- ❌ `TEXTBEE_*` - Required for SMS functionality

**Fix:** Add to .env.example:
```env
# AI Service
AI_SERVICE_URL=http://localhost:5001

# Image Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMS Service (TextBee)
TEXTBEE_API_KEY=your_textbee_api_key
TEXTBEE_DEVICE_ID=your_textbee_device_id

# Server Configuration
SERVER_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Node Environment
NODE_ENV=development
```

### 2.6 Hardcoded Service URLs with Localhost Defaults

**Severity:** HIGH  
**Files:**
- [diagnoseRoutes.js](diagnoseRoutes.js#L40): 
  ```javascript
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
  ```
- [adminRoutes.js](adminRoutes.js#L320):
  ```javascript
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
  ```

**Impact:** These will fail in production if environment variables not set

**Current:** Environment variables are checked but defaults are localhost  
**Problem:** Developers might forget to set these in production

**Fix:** Make sure production deployment requires these in .env:
```env
# In production, these MUST be set or service will fail
AI_SERVICE_URL=https://api.shrimp-ai.production.domain.com
SERVER_URL=https://api.production.domain.com
```

### 2.7 Google OAuth Redirect to Hardcoded Frontend URL

**Severity:** CRITICAL  
**File:** [authController.js](authController.js#L148-L151)

```javascript
res.redirect(`http://localhost:5173/?token=${token}`);  // Line 148
// ...
res.redirect("http://localhost:5173/login?error=server_error");  // Line 151
```

**Impact:** User cannot complete Google login in production

**Fix:**
```javascript
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
res.redirect(`${FRONTEND_URL}/?token=${token}`);
res.redirect(`${FRONTEND_URL}/login?error=server_error`);
```

**Required Environment Variable:**
```
FRONTEND_URL=https://your-production-domain.com
```

### 2.8 No Production Error Handling

**Severity:** MEDIUM  
**Files:** All route files and controllers

**Current Issue:**
- Error messages exposed to client in production
- Stack traces may be visible
- No logging for audit trail

**Example - diagnoseRoutes.js:**
```javascript
} catch (aiErr) {
  // Returns detailed error info to client
  if (aiErr.response) return res.status(aiErr.response.status).json(aiErr.response.data);
  return res.status(503).json({
    message: 'AI service không phản hồi. Vui lòng thử lại sau.',
    error: aiErr.message,  // ⚠️ Should not expose in production
  });
}
```

**Fix:** Add production-safe error handling
```javascript
} catch (aiErr) {
  const isDev = process.env.NODE_ENV === 'development';
  const errorData = {
    message: 'AI service unavailable. Please try again later.',
  };
  
  if (isDev) {
    errorData.debug = aiErr.message;
    errorData.stack = aiErr.stack;
  }
  
  // Log for monitoring
  console.error('[DIAGNOSE ERROR]', {
    timestamp: new Date().toISOString(),
    error: aiErr.message,
    userId: req.user?.id,
  });
  
  return res.status(503).json(errorData);
}
```

### 2.9 No Request Logging or Audit Trail

**Severity:** MEDIUM  
**Impact:** Cannot debug production issues or audit user actions

**Missing:**
- No HTTP request logging (morgan/bunyan)
- No API call audit trail
- No error monitoring
- No performance metrics

**Recommended Addition:**
```javascript
// server.js
const morgan = require('morgan');

// Development: detailed logs
// Production: combined format to file
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Or better: structured logging
const logger = require('./utils/logger'); // Create this
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
      user: req.user?.id,
    });
  });
  next();
});
```

### 2.10 No Rate Limiting

**Severity:** MEDIUM  
**Impact:** API vulnerable to abuse and DDoS attacks

**Missing:**
- No rate limiting middleware
- Anyone can make unlimited requests
- OTP endpoint vulnerable to brute force

**Recommended Addition:**
```javascript
// server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.',
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 OTP requests per 15 min
  skipSuccessfulRequests: true,
});

app.use(limiter); // Apply to all routes
app.post('/api/auth/forgot-password', otpLimiter, forgotPassword);
app.post('/api/auth/verify-otp', otpLimiter, verifyOtp);
```

### 2.11 No HTTPS Configuration

**Severity:** CRITICAL  
**Impact:** User data transmitted in plaintext in production

**Missing:**
- No SSL/TLS configuration
- No HTTP → HTTPS redirect
- No HSTS headers

**Fix:** Configure HTTPS (typically in reverse proxy/load balancer)
```javascript
// If running behind proxy (recommended):
app.set('trust proxy', 1);

// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
});

// HSTS header
app.use((req, res, next) => {
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### 2.12 JWT Token Expiry Strategy Incomplete

**Severity:** MEDIUM  
**Files:** [authController.js](authController.js#L28)

```javascript
{ expiresIn: "7d" }  // Token valid for 7 days
```

**Issues:**
- No refresh token mechanism
- User logged out when token expires (poor UX)
- No token revocation capability
- No logout endpoint

**Fix Needed:**
```javascript
// Generate access + refresh tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h',  // Short-lived access token
  });
  
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',  // Long-lived refresh token
  });
  
  return { accessToken, refreshToken };
};

// Add refresh endpoint
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Add logout endpoint
router.post('/logout', authMiddleware, (req, res) => {
  // Optionally blacklist token in Redis
  res.json({ message: 'Logged out successfully' });
});
```

### 2.13 No Input Validation

**Severity:** MEDIUM  
**Impact:** Vulnerable to injection attacks and invalid data

**Example - authController.js register:**
```javascript
const { ten, sodienthoai, matkhau, email } = req.body;

// Only checks if empty
if (!ten || !sodienthoai || !matkhau) {
  return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
}
// Missing validation for:
// - Email format
// - Phone number format
// - Password strength
// - Name length limits
// - SQL injection protection
```

**Recommended:**
```javascript
// Use joi or express-validator
const { body, validationResult } = require('express-validator');

router.post('/register', [
  body('ten')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên phải từ 2-100 ký tự'),
  body('sodienthoai')
    .matches(/^0\d{9}$/)
    .withMessage('Số điện thoại không hợp lệ'),
  body('matkhau')
    .isLength({ min: 8 })
    .matches(/[A-Z]/)
    .matches(/[0-9]/)
    .withMessage('Mật khẩu phải ≥8 ký tự, có chữ hoa và số'),
  body('email')
    .isEmail()
    .normalizeEmail(),
], register);
```

### 2.14 File Upload Security Issues

**Severity:** HIGH  
**File:** [diagnoseRoutes.js](diagnoseRoutes.js#L21-L32)

```javascript
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB limit
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png/.test(file.mimetype) &&
               /jpeg|jpg|png/.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Chỉ hỗ trợ file JPG và PNG'));
  },
});
```

**Issues:**
- ❌ Only checks extension and MIME type (not foolproof)
- ❌ No filename sanitization (potential directory traversal)
- ❌ Uploaded files stored in `/uploads/` (no cloud backup in dev)
- ❌ No file size per-user limits
- ❌ No virus scanning

**Fix:**
```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Generate random filename, preserve only extension
    const random = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `diag-${random}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: async (_req, file, cb) => {
    try {
      // 1. Check extension
      const ext = path.extname(file.originalname).toLowerCase();
      if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
        return cb(new Error('Chỉ hỗ trợ JPG, JPEG, PNG'));
      }
      
      // 2. Check MIME type
      const validMimes = ['image/jpeg', 'image/png'];
      if (!validMimes.includes(file.mimetype)) {
        return cb(new Error('File không hợp lệ'));
      }
      
      // 3. Verify file header (magic bytes)
      // This requires reading the file buffer - implement separately
      
      cb(null, true);
    } catch (err) {
      cb(err);
    }
  },
});
```

### 2.15 Cloud Storage Configuration Incomplete

**Severity:** MEDIUM  
**File:** [cloudStorage.js](cloudStorage.js)

```javascript
// CLOUDINARY_* env vars commented out in .env
// console.log('[CLOUD] Cloudinary chưa cấu hình → chỉ dùng local storage');
```

**Issues:**
- ❌ Images only stored locally (lost on server restart/deploy)
- ❌ No backup strategy
- ❌ Cloudinary setup optional but not documented
- ❌ No CDN for fast image delivery

**Fix:** 
1. Document required Cloudinary setup in .env.example
2. Make Cloudinary required in production:
   ```javascript
   if (process.env.NODE_ENV === 'production' && !CLOUD_CONFIGURED) {
     throw new Error('Cloudinary must be configured in production');
   }
   ```

### 2.16 No Database Connection Pooling Configuration

**Severity:** MEDIUM  
**File:** [config/db.js](config/db.js)

```javascript
const conn = await mongoose.connect(process.env.MONGO_URI);
// Uses default Mongoose options
```

**Missing:**
- No connection pool size configuration
- No timeout settings
- No retry strategy
- No monitoring

**Fix:**
```javascript
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority',
      journal: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Failed: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    // Retry in development
    setTimeout(connectDB, 5000);
  }
};
```

---

## 3. 🔴 AI SERVICE (Python) CRITICAL ISSUES

### 3.1 CORS Allows All Origins (Security Risk)

**Severity:** HIGH  
**File:** [app.py](app.py#L266)

```python
from flask_cors import CORS
CORS(app)  # ⚠️ Allows requests from ANY origin
```

**Impact:** 
- Any website can make requests to your AI service
- Potential for abuse and data exfiltration
- No authorization check on predictions

**Fix:**
```python
CORS(app, resources={
    r"/predict": {"origins": [
        "http://localhost:5000",
        "https://api.production.domain.com",
        "https://your-frontend.domain.com"
    ]},
    r"/health": {"origins": "*"},  # Health check can be public
})
```

**Also Required:** Add to .env:
```
AI_ALLOWED_ORIGINS=http://localhost:5000,https://api.production.domain.com
```

### 3.2 Model Path Uses Relative Path in Batch Script

**Severity:** HIGH  
**File:** [start.bat](start.bat)

```batch
set MODEL_PATH=..\model_ai\best_model_v3.pth
```

**Issues:**
- ❌ Relative path only works when run from `ai_service` directory
- ❌ Will fail if working directory is different in production
- ❌ No error handling if model doesn't exist

**Fix:**
```batch
set MODEL_PATH=%~dp0\..\model_ai\best_model_v3.pth
```

Or better, use Python environment variable:
```batch
set MODEL_PATH=%CD%\..\model_ai\best_model_v3.pth
python app.py
```

Or use Python to resolve absolute path:
```python
# app.py
import os
MODEL_PATH = os.environ.get(
    'MODEL_PATH',
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'model_ai', 'best_model_v3.pth'))
)
```

### 3.3 No Production WSGI Configuration

**Severity:** HIGH  
**File:** [requirements.txt](requirements.txt)

```
gunicorn>=21.2.0  # Installed but not configured
```

**Issue:**
- Gunicorn is listed as dependency but no configuration
- Using `app.run()` in production is not recommended
- No multi-worker setup for production load

**Fix - Create gunicorn config:**
```python
# ai_service/gunicorn_config.py
import os
import multiprocessing

workers = int(os.environ.get('WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5
bind = f"0.0.0.0:{os.environ.get('AI_PORT', 5001)}"
accesslog = '/var/log/gunicorn/access.log'
errorlog = '/var/log/gunicorn/error.log'
loglevel = 'info'
```

**Production Startup:**
```bash
gunicorn -c gunicorn_config.py app:app
```

### 3.4 No Environment Variables in .env

**Severity:** MEDIUM  
**Issue:** No .env setup for AI service

**Missing:**
- ❌ `MODEL_PATH` not documented
- ❌ `AI_PORT` defaults to 5001 but not in .env
- ❌ No CORS origin configuration
- ❌ No Flask debug/production mode

**Create ai_service/.env:**
```env
FLASK_ENV=production
MODEL_PATH=/models/best_model_v3.pth
AI_PORT=5001
ALLOWED_ORIGINS=http://localhost:5000,https://api.production.domain.com
```

### 3.5 Hardcoded AI_PORT with Localhost Default

**Severity:** MEDIUM  
**File:** [app.py](app.py#L30)

```python
AI_PORT = int(os.environ.get('AI_PORT', 5001))
```

**Issue:** Default port 5001 might be in use on production server

**Fix:** Require AI_PORT in production:
```python
AI_PORT = int(os.environ.get('AI_PORT'))
if not AI_PORT:
    raise ValueError('AI_PORT environment variable must be set in production')
```

### 3.6 No Error Logging Configuration

**Severity:** MEDIUM  
**File:** [app.py](app.py#L15-L17)

```python
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s [%(levelname)s] %(message)s')
```

**Issues:**
- Logs to stdout only (lost on container restart)
- No file logging
- No structured logging
- No monitoring integration

**Fix:**
```python
import logging
from logging.handlers import RotatingFileHandler
import os

log_level = os.environ.get('LOG_LEVEL', 'INFO')
log_file = os.environ.get('LOG_FILE', '/var/log/ai_service.log')

logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        RotatingFileHandler(log_file, maxBytes=10485760, backupCount=5),
        logging.StreamHandler()
    ]
)
```

### 3.7 Model Loading Blocking Startup

**Severity:** MEDIUM  
**File:** [app.py](app.py) - startup

**Current:**
```python
if __name__ == '__main__':
    try:
        load_model_once()
    except Exception as e:
        log.error(f'[FATAL] Không load được model: {e}')
    app.run(host='0.0.0.0', port=AI_PORT, debug=False)
```

**Issue:** If model fails to load, server still starts and all requests fail

**Fix:** Fail startup if model can't load:
```python
if __name__ == '__main__':
    try:
        load_model_once()
        log.info(f'Model loaded successfully, starting server on port {AI_PORT}')
        app.run(host='0.0.0.0', port=AI_PORT, debug=False)
    except Exception as e:
        log.error(f'[FATAL] Cannot start service: {e}')
        sys.exit(1)
```

### 3.8 No Health Check Endpoint Documentation

**Severity:** LOW  
**File:** [app.py](app.py) - has `/health` endpoint

**Good:** Service includes health check
**Issue:** Not documented how to use it for monitoring

**Recommendation:**
```python
# Add to startup
log.info(f'Health check available at: http://localhost:{AI_PORT}/health')
log.info(f'Prediction endpoint: POST http://localhost:{AI_PORT}/predict')
```

### 3.9 No Request Timeout Configuration

**Severity:** MEDIUM  
**Issue:** No timeout for model predictions

**Add to app configuration:**
```python
# Prevent long-running requests from blocking
app.config['TIMEOUT'] = 120  # 2 minutes max per request
```

---

## 4. 🔴 DATABASE CRITICAL ISSUES

### 4.1 MongoDB Connection String Hardcoded to localhost

**Severity:** CRITICAL  
**File:** [backend/.env](backend/.env#L4)

```
MONGO_URI=mongodb://localhost:27017/BANTHUOC
```

**Issues:**
- ❌ Points to local development database
- ❌ Won't work in production
- ❌ No credentials for MongoDB
- ❌ No connection retry logic

**Production Fix:**
```
# For MongoDB Community Edition with auth
MONGO_URI=mongodb://username:password@mongodb-server:27017/BANTHUOC?retryWrites=true&w=majority

# For MongoDB Atlas (Recommended)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/BANTHUOC?retryWrites=true&w=majority

# Include in .env.example:
MONGO_URI=mongodb+srv://username:password@cluster-name.mongodb.net/BANTHUOC
```

### 4.2 No Database Backup Configuration

**Severity:** HIGH  
**Impact:** Data loss risk if MongoDB crashes

**Missing:**
- ❌ No backup scripts
- ❌ No automated backups
- ❌ No recovery procedures

**Recommendation:**
```bash
#!/bin/bash
# backup-db.sh
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017/BANTHUOC"}

mongodump --uri "$MONGO_URI" --out "$BACKUP_DIR/backup_$DATE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -mtime +30 -exec rm -rf {} \;

echo "Database backup completed: $BACKUP_DIR/backup_$DATE"
```

### 4.3 Seed Files Not Production-Ready

**Severity:** MEDIUM  
**Files:** [database/seed.js](database/seed.js), [database/seed2.js](database/seed2.js)

**Issues:**
- ❌ No documentation how to run seeds
- ❌ Seeds might overwrite production data
- ❌ No idempotent checks
- ❌ Hardcoded data without environment awareness

**Fix:**
```javascript
// Add safety check
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Refusing to run seeds in production!');
  console.error('Use a database admin tool instead.');
  process.exit(1);
}

// Make seeds idempotent
const existingCount = await db.collection('BENH').countDocuments();
if (existingCount > 0) {
  console.log(`⚠️  ${existingCount} diseases already exist, skipping seed`);
  process.exit(0);
}
```

### 4.4 No Database Indexes Configuration

**Severity:** MEDIUM  
**Files:** Models in [backend/models/](backend/models/)

**Issue:** Queries without indexes on frequently searched fields

**Example - add to User model:**
```javascript
userSchema.index({ sodienthoai: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ ngaytao: -1 });

// Similarly for other collections:
// - DONHANG: trang_thai_don_hang, ngaytao
// - SANPHAM: loaisanpham, soluong
// - KETQUANHANDIEN: userId, ngaytao
```

---

## 5. 🟡 GENERAL INFRASTRUCTURE ISSUES

### 5.1 No Docker Configuration

**Severity:** MEDIUM  
**Impact:** Inconsistent environments dev/prod, difficult deployment

**Missing:**
- No `Dockerfile` for any service
- No `docker-compose.yml` for local development
- No container registry configuration

**Create Dockerfile examples:**

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

```dockerfile
# ai_service/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["gunicorn", "-c", "gunicorn_config.py", "app:app"]
```

### 5.2 No CI/CD Pipeline

**Severity:** MEDIUM  
**Impact:** Manual deployment, higher error risk

**Missing:**
- No GitHub Actions / GitLab CI
- No automated testing
- No deployment scripts
- No staging environment

### 5.3 No Health Check Monitoring

**Severity:** MEDIUM  
**Impact:** Downtime not detected immediately

**Add to backend:**
```javascript
// server.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'backend',
    mongoConnected: mongoose.connection.readyState === 1,
    uptime: process.uptime(),
  });
});
```

**Use in monitoring (Kubernetes, CloudWatch, etc.)**

### 5.4 No Performance Monitoring

**Severity:** MEDIUM  
**Missing:**
- No APM (Application Performance Monitoring)
- No database query monitoring
- No response time tracking
- No error tracking

**Recommended:** Use services like:
- Sentry for error tracking
- DataDog/NewRelic for APM
- Prometheus for metrics

### 5.5 No Dependency Version Locking

**Severity:** MEDIUM  
**Files:** [backend/package.json](backend/package.json), [frontend/package.json](frontend/package.json)

```json
"dependencies": {
  "express": "^5.2.1",  // ⚠️ May install 5.3, 5.4, etc.
  "mongoose": "^8.23.1"
}
```

**Fix:** Use lock files
```bash
# Ensure package-lock.json is committed
git add package-lock.json
npm ci  # Use in production instead of npm install
```

---

## 6. 🟡 MISSING DOCUMENTATION

### 6.1 No Deployment Guide

**Missing:**
- [ ] How to deploy to production
- [ ] Environment configuration guide
- [ ] Database setup instructions
- [ ] SSL/TLS setup
- [ ] Service startup order
- [ ] Health check procedures
- [ ] Rollback procedures
- [ ] Monitoring setup

### 6.2 No Environment Configuration Guide

**Missing:**
- [ ] All required environment variables documented
- [ ] Recommended values for each environment
- [ ] How to generate secrets (JWT, API keys)
- [ ] How to configure third-party services

### 6.3 No API Documentation

**Missing:**
- [ ] API endpoint documentation
- [ ] Request/response schemas
- [ ] Authentication details
- [ ] Error codes
- [ ] Rate limits

---

## 🔧 RECOMMENDED FIX PRIORITY

### Phase 1: CRITICAL (Must fix before ANY production deployment)

1. **Remove exposed credentials** ✓
   - Regenerate all API keys
   - Remove .env from git history
   
2. **Fix hardcoded URLs** ✓
   - Frontend API endpoints
   - Backend CORS
   - OAuth callbacks
   - Redirect URLs

3. **Add environment variable configuration** ✓
   - Create .env.example with all required vars
   - Update all services to read from env

4. **Set up HTTPS** ✓
   - Configure SSL certificates
   - Redirect HTTP to HTTPS

### Phase 2: HIGH (Before going live)

5. Add input validation and sanitization
6. Implement rate limiting
7. Add file upload security
8. Configure database backups
9. Set up error logging and monitoring
10. Add request logging and audit trails

### Phase 3: MEDIUM (Before heavy production load)

11. Implement JWT refresh tokens
12. Add health check endpoints
13. Set up Docker containers
14. Create CI/CD pipeline
15. Performance monitoring

### Phase 4: LOW (Ongoing improvements)

16. Add comprehensive API documentation
17. Create deployment guides
18. Set up automated testing
19. Performance optimization
20. Security audits

---

## 📋 DEPLOYMENT CHECKLIST

Before deploying to production:

### Frontend
- [ ] Update all hardcoded URLs to use environment variables
- [ ] Create .env.production with correct API endpoint
- [ ] Test build: `npm run build`
- [ ] Verify bundle size and performance
- [ ] Test production build locally: `npm run preview`
- [ ] Set up CDN if needed

### Backend
- [ ] Create new MongoDB database (with authentication)
- [ ] Generate new JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Register new Google OAuth credentials with production URLs
- [ ] Create .env with all required variables (NO DEFAULTS)
- [ ] Run seeds if needed (NEVER in production)
- [ ] Test database connection from production environment
- [ ] Set up SSL certificate
- [ ] Configure CORS_ORIGIN, FRONTEND_URL, SERVER_URL
- [ ] Set NODE_ENV=production
- [ ] Enable request logging and error tracking
- [ ] Test all authentication flows
- [ ] Test third-party integrations (SMS, Google OAuth, Cloudinary)

### AI Service
- [ ] Copy trained model to production server
- [ ] Configure FLASK_ENV=production
- [ ] Set MODEL_PATH to absolute path
- [ ] Configure gunicorn with proper workers
- [ ] Set ALLOWED_ORIGINS for CORS
- [ ] Test inference performance
- [ ] Set up model monitoring/versioning

### Infrastructure
- [ ] Set up MongoDB database with authentication and backup
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Create runbooks for common issues
- [ ] Test disaster recovery procedures
- [ ] Document all credentials in secure vault
- [ ] Set up log aggregation
- [ ] Configure auto-scaling if needed

---

## 📞 SUMMARY TABLE

| Component | Issue | Severity | Fix Effort | Status |
|-----------|-------|----------|-----------|--------|
| Frontend | Hardcoded URLs | CRITICAL | Medium | ❌ |
| Frontend | No .env config | CRITICAL | Low | ❌ |
| Backend | CORS localhost | CRITICAL | Low | ❌ |
| Backend | Google OAuth hardcoded | CRITICAL | Low | ❌ |
| Backend | Exposed credentials | CRITICAL | High | ❌ |
| Backend | No HTTPS | CRITICAL | Medium | ❌ |
| Backend | Missing env vars in example | MEDIUM | Low | ❌ |
| Backend | No input validation | MEDIUM | High | ❌ |
| Backend | No rate limiting | MEDIUM | Low | ❌ |
| Backend | No error logging | MEDIUM | Medium | ❌ |
| AI Service | CORS allows all | HIGH | Low | ❌ |
| AI Service | Model path issues | HIGH | Low | ❌ |
| AI Service | No production config | HIGH | Medium | ❌ |
| Database | localhost connection | CRITICAL | Medium | ❌ |
| Database | No backups | HIGH | High | ❌ |
| General | No Docker | MEDIUM | High | ❌ |
| General | No CI/CD | MEDIUM | High | ❌ |

**Total Issues Found:** 45+  
**Critical Issues:** 8  
**High Severity Issues:** 6  
**Medium Severity Issues:** 12+  

---

## 📖 RESOURCES

- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10 API Security](https://owasp.org/www-project-web-security-testing-guide/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance-best-practices/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security/)

---

**Report Generated:** May 27, 2026  
**Status:** ⚠️ **NOT PRODUCTION READY**  
**Next Steps:** Address CRITICAL issues immediately before any deployment
