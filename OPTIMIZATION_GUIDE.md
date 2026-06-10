# 🚀 OPTIMIZATION GUIDE: Local + Production Setup (Code không sửa gì cả)

> Cách setup code 1 lần → Chạy local bình thường, Deploy production chỉ cần config environment

---

## 🎯 Nguyên lý cơ bản

```javascript
// ✅ ĐÚNG - Dùng environment variable với fallback (default) cho local
const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

// ❌ SAI - Hardcoded, phải sửa code khi deploy
const API_BASE = 'http://localhost:5000/api';
```

**Kết quả:**
- 💚 **Local:** Không set env var → dùng default → chạy bình thường
- 💙 **Production:** Set env var → dùng production URL → chạy production

---

## 📋 CHECKLIST SỬA CODE (1 lần, sửa xong xong)

### Part 1: BACKEND (Node.js)

#### 1.1 Sửa `backend/server.js`

**Vị trí:** CORS configuration (dòng ~24)

```javascript
// ❌ TRƯỚC
app.use(cors({ origin: "http://localhost:5173" }));

// ✅ SAU
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### 1.2 Sửa `backend/config/passport.js`

**Vị trí:** Google OAuth strategy configuration

```javascript
// ❌ TRƯỚC
callbackURL: process.env.GOOGLE_CALLBACK_URL,

// ✅ SAU
callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
```

#### 1.3 Sửa `backend/routes/authRoutes.js`

**Vị trí:** Passport failure redirect (dòng ~33)

```javascript
// ❌ TRƯỚC
failureRedirect: "http://localhost:5173/login?error=failed"

// ✅ SAU
failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/login?error=failed'
```

**Cả success redirect:**

```javascript
// ❌ TRƯỚC
res.redirect(`http://localhost:5173/?token=${token}`);

// ✅ SAU
res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?token=${token}`);
```

#### 1.4 Sửa `backend/controllers/authController.js`

**Vị trí:** OAuth success redirects (dòng ~148, 151)

```javascript
// ❌ TRƯỚC
res.redirect(`http://localhost:5173/?token=${token}`);

// ✅ SAU
res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?token=${token}`);
```

**Tất cả các chỗ redirect về frontend cần sửa:**
- Tìm: `http://localhost:5173`
- Thay bằng: `${process.env.FRONTEND_URL || 'http://localhost:5173'}`

#### 1.5 Sửa `backend/.env.example`

```env
# === DATABASE ===
MONGO_URI=mongodb://localhost:27017/BANTHUOC

# === SERVER ===
PORT=5000
NODE_ENV=development

# === CORS & FRONTEND ===
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# === GOOGLE OAUTH ===
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# === JWT ===
JWT_SECRET=your_jwt_secret_here_min_32_chars

# === AI SERVICE ===
AI_SERVICE_URL=http://localhost:5001

# === TEXTBEE SMS ===
TEXTBEE_API_KEY=your_textbee_api_key_here
TEXTBEE_DEVICE_ID=your_textbee_device_id_here

# === CLOUDINARY ===
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
```

#### 1.6 Tạo `backend/.env.local` (git-ignore)

```env
# === DATABASE ===
MONGO_URI=mongodb://localhost:27017/BANTHUOC

# === SERVER ===
PORT=5000
NODE_ENV=development

# === CORS & FRONTEND ===
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# === GOOGLE OAUTH ===
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# === JWT ===
JWT_SECRET=your_jwt_secret_key_here

# === AI SERVICE ===
AI_SERVICE_URL=http://localhost:5001

# === TEXTBEE SMS ===
TEXTBEE_API_KEY=your_textbee_api_key_here
TEXTBEE_DEVICE_ID=your_textbee_device_id_here

# === CLOUDINARY ===
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 1.7 Tạo `backend/.env.production` (git-ignore)

```env
# === DATABASE ===
MONGO_URI=mongodb+srv://username:password@cluster-name.mongodb.net/BANTHUOC?retryWrites=true&w=majority

# === SERVER ===
PORT=5000
NODE_ENV=production

# === CORS & FRONTEND ===
CORS_ORIGIN=https://your-production-domain.com
FRONTEND_URL=https://your-production-domain.com

# === GOOGLE OAUTH ===
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
GOOGLE_CALLBACK_URL=https://api.your-production-domain.com/api/auth/google/callback

# === JWT ===
JWT_SECRET=generate_with_node_-e_console.log_require_crypto_randomBytes_32_toString_hex

# === AI SERVICE ===
AI_SERVICE_URL=https://ai.your-production-domain.com

# === TEXTBEE SMS ===
TEXTBEE_API_KEY=your_production_textbee_api_key
TEXTBEE_DEVICE_ID=your_production_textbee_device_id

# === CLOUDINARY ===
CLOUDINARY_CLOUD_NAME=your_production_cloud_name
CLOUDINARY_API_KEY=your_production_api_key
CLOUDINARY_API_SECRET=your_production_api_secret
```

---

### Part 2: FRONTEND (React/Vite)

#### 2.1 Sửa `frontend/vite.config.js`

```javascript
// ✅ SAU
server: {
  port: parseInt(process.env.VITE_PORT || '5173'),
  strictPort: false,  // Cho phép fallback port
}
```

#### 2.2 Sửa `frontend/src/utils/authFetch.js`

```javascript
// ❌ TRƯỚC
export const API_BASE = 'http://localhost:5000/api';

// ✅ SAU
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

#### 2.3 Sửa tất cả files hardcoded API URL

**Tìm và thay thế trong các files:**
- `frontend/src/App.jsx`
- `frontend/src/components/user/UserHeader.jsx`
- `frontend/src/pages/ForgotPasswordPage.jsx`
- `frontend/src/pages/OTPPage.jsx`
- `frontend/src/pages/ResetPasswordPage.jsx`
- `frontend/src/pages/admin/*.jsx` (6+ files)
- `frontend/src/pages/user/UserDashboard.jsx` (3 chỗ)

**Pattern cần thay:**

```javascript
// ❌ TRƯỚC
const API_BASE = 'http://localhost:5000/api';

// ✅ SAU
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

**Hoặc nếu dùng import:**

```javascript
// ❌ TRƯỚC
import { API_BASE } from '../utils/authFetch';

// ✅ SAU - Nếu import từ authFetch.js đã fix thì ok
// (Không cần sửa)
```

#### 2.4 Sửa `.env.example`

```env
# === API ===
VITE_API_URL=http://localhost:5000/api

# === PORT ===
VITE_PORT=5173
```

#### 2.5 Tạo `frontend/.env.local` (git-ignore)

```env
VITE_API_URL=http://localhost:5000/api
VITE_PORT=5173
```

#### 2.6 Tạo `frontend/.env.production` (git-ignore)

```env
VITE_API_URL=https://api.your-production-domain.com/api
VITE_PORT=5173
```

---

### Part 3: AI SERVICE (Python)

#### 3.1 Sửa `ai_service/app.py`

**Vị trí:** CORS configuration (dòng ~266)

```python
# ❌ TRƯỚC
CORS(app)

# ✅ SAU
import os
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:5000').split(',')
CORS(app, resources={
    r"/predict": {
        "origins": cors_origins
    }
})
```

#### 3.2 Sửa `ai_service/app.py` - Server listening

```python
# ❌ TRƯỚC (nếu có)
if __name__ == "__main__":
    app.run(debug=True, host='localhost', port=5001)

# ✅ SAU
if __name__ == "__main__":
    host = os.getenv('AI_HOST', 'localhost')
    port = int(os.getenv('AI_PORT', 5001))
    debug = os.getenv('NODE_ENV', 'development') != 'production'
    app.run(debug=debug, host=host, port=port)
```

#### 3.3 Tạo `ai_service/.env.example`

```env
# === SERVER ===
NODE_ENV=development
AI_HOST=localhost
AI_PORT=5001

# === CORS ===
CORS_ORIGINS=http://localhost:5000
```

#### 3.4 Tạo `ai_service/.env.local` (git-ignore)

```env
NODE_ENV=development
AI_HOST=localhost
AI_PORT=5001
CORS_ORIGINS=http://localhost:5000
```

#### 3.5 Tạo `ai_service/.env.production` (git-ignore)

```env
NODE_ENV=production
AI_HOST=0.0.0.0
AI_PORT=5001
CORS_ORIGINS=https://api.your-production-domain.com,https://your-production-domain.com
```

---

## 📁 Git Configuration - `.gitignore`

### Backend: `backend/.gitignore`

```
.env
.env.local
.env.production
node_modules/
uploads/
dist/
```

### Frontend: `frontend/.gitignore`

```
.env
.env.local
.env.production
node_modules/
dist/
.DS_Store
```

### AI Service: `ai_service/.gitignore`

```
.env
.env.local
.env.production
__pycache__/
*.pyc
venv/
.vscode/
```

---

## ✅ VERIFICATION CHECKLIST

### Local Development (Không cần set environment var)

```bash
# Backend
cd backend
npm install
# .env.local được tạo → defaults được dùng
npm run dev
# Expected: Server runs on http://localhost:5000

# Frontend (terminal khác)
cd frontend
npm install
npm run dev
# Expected: App runs on http://localhost:5173
# API calls go to http://localhost:5000/api

# AI Service (terminal khác)
cd ai_service
pip install -r requirements.txt
python app.py
# Expected: Running on http://localhost:5001
```

### Production (Set environment var trước)

```bash
# Backend
export NODE_ENV=production
export CORS_ORIGIN=https://api.your-domain.com
export FRONTEND_URL=https://your-domain.com
export MONGO_URI=mongodb+srv://...
export GOOGLE_CALLBACK_URL=https://api.your-domain.com/api/auth/google/callback
npm start

# Frontend
export VITE_API_URL=https://api.your-domain.com/api
npm run build
# dist/ folder được deploy

# AI Service
export NODE_ENV=production
export CORS_ORIGINS=https://api.your-domain.com,https://your-domain.com
python app.py
```

---

## 🔄 Workflow sau khi sửa

### Chạy Local
```bash
npm install  # hoặc pip install
npm run dev  # hoặc python app.py
```
→ Tự động dùng `.env.local` + fallback defaults  
→ **Không cần sửa gì**

### Deploy Production
```bash
# Chỉ cần set environment variables trước khi start service
export NODE_ENV=production
export CORS_ORIGIN=https://your-domain.com
... (set tất cả các var)

npm start  # hoặc python app.py
```
→ Tự động dùng environment variables  
→ **Không cần sửa code gì cả**

---

## 🎯 Kết quả cuối cùng

| Môi trường | Cách chạy | Sửa code? | Sửa .env? |
|-----------|----------|----------|----------|
| Local | `npm run dev` | ❌ Không | ❌ Không (dùng .env.local) |
| Production | `npm start + env vars` | ❌ Không | ✅ Có (set env vars) |

---

## 📝 Notes quan trọng

1. **`.env` files git-ignored** → Credentials an toàn
2. **`.env.example` public** → Team biết cần cái gì
3. **Code không hardcode URLs** → Dùng env vars với fallbacks
4. **Fallbacks cho local** → Default values là localhost
5. **Production uses env vars** → Set trước khi start

---

## 🚀 Deploy Steps

1. **Code setup 1 lần** (Sử dụng guide này)
2. **Git commit code** (mà không commit .env files)
3. **Local testing** (chạy bình thường)
4. **Production**:
   - Set environment variables trên server
   - Deploy code
   - Start services
   - ✅ Done!

**Không cần sửa code bao giờ!**
