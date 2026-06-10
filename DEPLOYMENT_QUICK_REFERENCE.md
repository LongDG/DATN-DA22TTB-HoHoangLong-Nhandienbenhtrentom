# 🎯 DEPLOYMENT ISSUES - QUICK REFERENCE

## 🔴 CRITICAL BLOCKERS (Fix these FIRST)

### 1. Frontend - Hardcoded API URLs
**Files affected:** 13 files  
**Examples:**
- `frontend/src/App.jsx:28` - `const API_URL = 'http://localhost:5000/api';`
- `frontend/src/utils/authFetch.js:17` - `export const API_BASE = 'http://localhost:5000/api';`
- `frontend/src/pages/user/UserDashboard.jsx:725` - Direct fetch to localhost

**Action:** Create environment-based config:
```javascript
// Use: const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Create frontend/.env.production with: VITE_API_URL=https://your-api-domain.com/api
```

---

### 2. Backend - CORS Hardcoded to localhost
**File:** `backend/server.js:24`
**Current:** `app.use(cors({ origin: "http://localhost:5173" }));`
**Action:** Use environment variable
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
// Add to .env: CORS_ORIGIN=https://your-frontend-domain.com
```

---

### 3. Backend - Google OAuth URLs Hardcoded
**Files:**
- `backend/authController.js:148` - Redirect to localhost:5173
- `backend/authController.js:151` - Redirect to localhost:5173
- `backend/authRoutes.js:33` - failureRedirect to localhost:5173
- `backend/.env:9` - GOOGLE_CALLBACK_URL=http://localhost:5000

**Action:**
```javascript
// Use FRONTEND_URL env var
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
res.redirect(`${FRONTEND_URL}/?token=${token}`);

// Update .env:
GOOGLE_CALLBACK_URL=https://your-api-domain.com/api/auth/google/callback
FRONTEND_URL=https://your-frontend-domain.com
```

---

### 4. Backend - EXPOSED CREDENTIALS IN .env
**File:** `backend/.env` (Lines 7-13)
**Contains:**
- ❌ GOOGLE_CLIENT_ID
- ❌ GOOGLE_CLIENT_SECRET  
- ❌ TEXTBEE_API_KEY
- ❌ TEXTBEE_DEVICE_ID
- ❌ JWT_SECRET

**⚠️ IMMEDIATE ACTION REQUIRED:**
1. [ ] Regenerate ALL credentials immediately:
   - [ ] New Google OAuth app (REVOKE old credentials)
   - [ ] New TextBee API key
   - [ ] New JWT secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. [ ] Remove .env from git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. [ ] Update .env.example with placeholders only
4. [ ] Push cleaned repository

---

### 5. Database - MongoDB localhost only
**File:** `backend/.env:4`
**Current:** `MONGO_URI=mongodb://localhost:27017/BANTHUOC`
**Action:** Use production MongoDB:
```env
# For MongoDB Atlas (recommended):
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/BANTHUOC

# For self-hosted:
MONGO_URI=mongodb://username:password@mongodb-server:27017/BANTHUOC?retryWrites=true&w=majority
```

**Add to .env.example:**
```env
MONGO_URI=mongodb+srv://username:password@cluster-name.mongodb.net/BANTHUOC
```

---

### 6. AI Service - CORS Allows All Origins
**File:** `ai_service/app.py:266`
**Current:** `CORS(app)` - allows any origin
**Action:**
```python
CORS(app, resources={
    r"/predict": {
        "origins": [
            "http://localhost:5000",
            "https://your-api-domain.com"
        ]
    }
})
```

---

### 7. HTTPS/TLS Not Configured
**Action:** Set up SSL certificates (via reverse proxy/load balancer recommended)
```javascript
// backend/server.js - add HTTPS redirect:
if (process.env.NODE_ENV === 'production' && !req.secure) {
  res.redirect('https://' + req.get('host') + req.url);
}
```

---

## 🟠 HIGH PRIORITY (Before going live)

### 8. Missing Required Environment Variables

**Update `backend/.env.example`:**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/BANTHUOC
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
CORS_ORIGIN=http://localhost:5173
AI_SERVICE_URL=http://localhost:5001
TEXTBEE_API_KEY=your_textbee_api_key
TEXTBEE_DEVICE_ID=your_textbee_device_id
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Create `ai_service/.env` template:**
```env
FLASK_ENV=production
MODEL_PATH=/models/best_model_v3.pth
AI_PORT=5001
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:5000,https://your-api-domain.com
```

**Create `frontend/.env.example`:**
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 9. No Rate Limiting
**Files:** All API routes  
**Action:** Add rate limiting:
```bash
npm install express-rate-limit
```

```javascript
// backend/server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

app.use(limiter);
app.post('/api/auth/forgot-password', otpLimiter, forgotPassword);
app.post('/api/auth/verify-otp', otpLimiter, verifyOtp);
```

---

### 10. No Input Validation
**All controllers** lack input validation  
**Action:** Add joi or express-validator:
```bash
npm install express-validator
```

```javascript
// Example: authController.js
const { body, validationResult } = require('express-validator');

router.post('/register', [
  body('ten').trim().isLength({ min: 2, max: 100 }),
  body('sodienthoai').matches(/^0\d{9}$/),
  body('matkhau').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
  body('email').isEmail()
], register);
```

---

### 11. No Error Logging
**Current:** Errors not tracked  
**Action:**
```bash
npm install morgan sentry
# or npm install winston
```

```javascript
// backend/server.js
const morgan = require('morgan');
const Sentry = require('@sentry/node');

Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(morgan('combined'));
app.use(Sentry.errorHandler());
```

---

### 12. File Upload Security
**File:** `backend/routes/diagnoseRoutes.js:21-32`  
**Issues:**
- Only MIME type check (not foolproof)
- No filename sanitization
- No virus scanning

**Action:**
```javascript
const crypto = require('crypto');

const upload = multer({
  storage: multer.diskStorage({
    filename: (_req, file, cb) => {
      const random = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname);
      cb(null, `diag-${random}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validMimes = ['image/jpeg', 'image/png'];
    if (!['.jpg', '.jpeg', '.png'].includes(ext) || 
        !validMimes.includes(file.mimetype)) {
      return cb(new Error('Invalid file'));
    }
    cb(null, true);
  }
});
```

---

### 13. JWT Token Expiry - No Refresh Token
**File:** `backend/controllers/authController.js:28`  
**Current:** Token expires in 7 days, no refresh mechanism

**Action:** Implement refresh tokens:
```javascript
const generateTokens = (user) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d'
  });
  return { accessToken, refreshToken };
};

// Add refresh endpoint
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});
```

---

## 🟡 MEDIUM PRIORITY (Before heavy production load)

### 14. AI Service - No Production WSGI Config
**Issue:** `gunicorn` in requirements.txt but not configured  
**Action:** Create `ai_service/gunicorn_config.py`:
```python
import os
import multiprocessing

workers = int(os.environ.get('WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'sync'
timeout = 120
bind = f"0.0.0.0:{os.environ.get('AI_PORT', 5001)}"
accesslog = '/var/log/gunicorn/access.log'
errorlog = '/var/log/gunicorn/error.log'
```

**Startup:**
```bash
gunicorn -c gunicorn_config.py app:app
```

---

### 15. AI Service - Model Path Issues
**File:** `ai_service/start.bat`  
**Current:** `set MODEL_PATH=..\model_ai\best_model_v3.pth`
**Action:** Use absolute path:
```batch
set MODEL_PATH=%CD%\..\model_ai\best_model_v3.pth
python app.py
```

---

### 16. No Database Backup Strategy
**Action:** Create backup script:
```bash
#!/bin/bash
# backup-db.sh
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mongodump --uri "$MONGO_URI" --out "$BACKUP_DIR/backup_$DATE"
find "$BACKUP_DIR" -mtime +30 -exec rm -rf {} \;  # Keep 30 days
```

---

### 17. No Database Indexes
**Action:** Add to models:
```javascript
// User model
userSchema.index({ sodienthoai: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ ngaytao: -1 });
```

---

### 18. Database Connection Pooling Not Configured
**File:** `backend/config/db.js`  
**Action:**
```javascript
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    });
    return conn;
  } catch (error) {
    console.error(`MongoDB Failed: ${error.message}`);
    process.exit(1);
  }
};
```

---

## LOW PRIORITY (Ongoing improvements)

### 19. No Docker Configuration
**Create:** `Dockerfile` and `docker-compose.yml` for each service

### 20. No CI/CD Pipeline
**Create:** `.github/workflows/deploy.yml` for automated testing and deployment

### 21. No Monitoring/Health Checks
**Add to backend:** `/health` endpoint
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongoConnected: mongoose.connection.readyState === 1,
    uptime: process.uptime()
  });
});
```

---

## ✅ DEPLOYMENT CHECKLIST

### Before Deployment
- [ ] All hardcoded URLs replaced with environment variables
- [ ] .env.example created with all required variables
- [ ] All API keys rotated and newly generated
- [ ] .env file removed from git history
- [ ] HTTPS/SSL configured
- [ ] Database migrated to production (with auth)
- [ ] All environment variables set in production
- [ ] Rate limiting implemented
- [ ] Input validation added
- [ ] Error logging configured
- [ ] File upload security improved
- [ ] Health check endpoint tested
- [ ] Database backups configured
- [ ] Monitoring alerts set up

### After Deployment
- [ ] All services running and responsive
- [ ] Health endpoints returning OK status
- [ ] Database connected and queries fast
- [ ] File uploads working
- [ ] All third-party services configured
- [ ] Frontend loading correct API endpoint
- [ ] OAuth login flow working
- [ ] Email/SMS notifications working
- [ ] Monitor error logs for issues
- [ ] Performance metrics baseline established

---

## 📞 Emergency Contacts

Create a runbook for:
1. Service down
2. Database connection lost
3. API not responding
4. SSL certificate expired
5. Disk space full
6. Memory leak detected

---

**Last Updated:** May 27, 2026  
**Status:** 🔴 NOT PRODUCTION READY - 8+ CRITICAL ISSUES MUST BE FIXED FIRST
