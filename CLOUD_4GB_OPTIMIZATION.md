# ☁️ 4GB RAM Cloud Server - Memory Optimization Guide

> **Tóm tắt:** Có thể chạy được, nhưng cần optimize kỹ. PyTorch model là thứ tiêu tốn RAM nhiều nhất.

---

## 📊 RAM Breakdown Analysis

### Memory Usage Estimate (4GB total)

```
┌─ 4GB RAM (4096 MB) ─────────────────────────┐
│                                             │
├─ OS (Ubuntu/Debian)       ~500 MB           │
├─ MongoDB (with indexes)   ~600-800 MB       │
├─ Node.js Backend          ~150-200 MB       │
├─ PyTorch + Flask          ~1200-1500 MB     │  ← BIG
├─ Buffer/Cache             ~300-500 MB       │
└─ Free space               ~200 MB            │
```

### Dự báo chi tiết

| Thành phần | Min | Typical | Max |
|-----------|-----|---------|-----|
| **OS** | 300MB | 500MB | 800MB |
| **MongoDB** | 100MB | 600MB | 1000MB |
| **Node.js Backend** | 50MB | 150MB | 300MB |
| **Python AI Service** | 1000MB | 1300MB | 1800MB |
| **System Buffer** | 100MB | 300MB | 500MB |
| **Safety Margin** | - | - | 300MB |

**PyTorch model** (best_model_v3.pth): **~400-800MB** khi load

---

## ✅ Strategies để chạy trên 4GB

### Strategy 1: Lightweight Setup (Recommended) ⭐

```
┌─ Frontend (Static files)     │ Serve via Nginx
├─ Backend (Node.js)           │ Port 5000
├─ AI Service (Lightweight)    │ Port 5001 (load model on demand)
└─ MongoDB (Minimal)           │ Local or managed service
```

#### Optimizations:

**A. Node.js Backend - Reduce memory**

```javascript
// server.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  // Chỉ chạy 1-2 worker processes
  const numWorkers = process.env.NODE_ENV === 'production' ? 2 : 1;
  
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  require('./app');
}
```

**B. Python AI Service - Load model on demand**

```python
# app.py
import os
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ✅ LAZY LOAD MODEL (không load ngay)
model = None
device = None

def get_model():
    global model, device
    if model is None:
        import torch
        from torchvision import models
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = load_model(device)
        print(f"Model loaded on {device}")
    return model, device

@app.route('/predict', methods=['POST'])
def predict():
    model, device = get_model()  # Load only when needed
    image = request.files['image']
    # ... process prediction
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
```

**C. MongoDB - Minimal config**

```
# ~/.mongod.conf hoặc docker-compose.yml
storage:
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.5  # ← Giảm cache size

processManagement:
  fork: true
  pidFilePath: /var/run/mongod.pid

systemLog:
  destination: file
  path: /var/log/mongod.log
  logAppend: true

net:
  bindIp: 127.0.0.1
  port: 27017
```

**D. Nginx - Lightweight web server**

```nginx
# /etc/nginx/sites-available/default
upstream backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Static files (very low memory)
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # AI endpoint (optional - separate if needed)
    location /predict {
        proxy_pass http://127.0.0.1:5001;
    }
}
```

---

### Strategy 2: Tiered Services (Nếu 4GB vẫn chật)

Tách services:

```
┌─ Server 1 (2GB)          │ Frontend + Backend
├─ Server 2 (2GB)          │ AI Service + MongoDB (or use managed DB)
└─ Managed Database         │ MongoDB Atlas free tier (optional)
```

---

## 🔧 Deployment Optimizations

### 1. Use PM2 for memory management

```bash
npm install -g pm2

# ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'backend',
      script: './server.js',
      instances: 2,
      max_memory_restart: '300M',  // Restart if exceeds 300MB
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'ai-service',
      script: 'python app.py',
      max_memory_restart: '1500M',  // Restart if exceeds 1500MB
      interpreter: '/usr/bin/python3'
    }
  ]
};

# Start
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Docker Compose - Resource limits

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    image: node:18-alpine
    build: ./frontend
    ports:
      - "80:3000"
    restart: always
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

  backend:
    image: node:18-alpine
    build: ./backend
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/BANTHUOC
    ports:
      - "5000:5000"
    depends_on:
      - mongo
    restart: always
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  ai-service:
    image: python:3.9-slim
    build: ./ai_service
    ports:
      - "5001:5001"
    environment:
      - PYTORCH_ENABLE_MPS_FALLBACK=1
    restart: always
    deploy:
      resources:
        limits:
          memory: 1500M
        reservations:
          memory: 1200M

  mongo:
    image: mongo:5.0-alpine
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"
    restart: always
    deploy:
      resources:
        limits:
          memory: 600M
        reservations:
          memory: 400M

volumes:
  mongo-data:
```

### 3. Nginx + Static files (Very efficient)

```bash
# Build frontend once
cd frontend
npm install
npm run build

# Upload dist/ to server
scp -r dist/ user@server:/var/www/frontend/

# Configure Nginx (uses <1MB RAM for serving static files)
sudo nano /etc/nginx/sites-available/default
sudo systemctl restart nginx
```

---

## 🚀 4GB Recommended Architecture

```
┌────────────────────────────────────────┐
│      4GB Cloud Server (Ubuntu 22.04)   │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Nginx (Port 80/443)  ~30 MB     │ │
│  │  - Serve static files            │ │
│  │  - Proxy API requests            │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Node.js Backend   ~150 MB       │ │
│  │  (Port 5000, 2 workers)          │ │
│  │  - API logic                     │ │
│  │  - Auth/DB queries               │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  MongoDB ~600 MB                 │ │
│  │  (Port 27017)                    │ │
│  │  - Minimal cache                 │ │
│  │  - Essential indexes only        │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Python AI Service ~1.3GB        │ │
│  │  (Port 5001)                     │ │
│  │  - Load model on demand          │ │
│  │  - Cache predictions              │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  OS + Buffer + Free ~800 MB      │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

---

## 📋 Step-by-step Deployment (4GB)

### Bước 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl wget git

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.9
sudo apt install -y python3.9 python3-pip python3.9-venv

# Install MongoDB (lightweight)
curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
sudo apt-get install -y mongodb-org

# Install Nginx
sudo apt install -y nginx

# Disable swap (to prevent slowdown on 4GB)
sudo swapoff -a
```

### Bước 2: Deploy Backend

```bash
# Clone & setup
git clone <your-repo> /app
cd /app/backend

# Install dependencies
npm ci --only=production

# Setup environment
nano .env.production
# Set:
# NODE_ENV=production
# MONGO_URI=mongodb://127.0.0.1:27017/BANTHUOC
# PORT=5000
# ... other vars

# Install PM2
npm install -g pm2

# Create PM2 config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'backend',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Start
pm2 start ecosystem.config.js
pm2 save
```

### Bước 3: Deploy Frontend

```bash
# Build
cd /app/frontend
npm ci --only=production
npm run build

# Copy to Nginx
sudo mkdir -p /var/www/frontend
sudo cp -r dist/* /var/www/frontend/

# Set permissions
sudo chown -R www-data:www-data /var/www/frontend
```

### Bước 4: Deploy AI Service

```bash
# Setup
cd /app/ai_service
python3.9 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run with PM2 (node process manager)
pm2 start "python app.py" --name "ai-service" --max-memory-restart 1500M

pm2 save
```

### Bước 5: Configure Nginx

```bash
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80 default_server;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /var/www/frontend;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }

    # AI predict endpoint
    location /predict {
        proxy_pass http://127.0.0.1:5001;
    }
}
EOF

# Test & restart
sudo nginx -t
sudo systemctl restart nginx
```

### Bước 6: Monitor Memory

```bash
# Install htop
sudo apt install -y htop

# Monitor
htop

# Or check with PM2
pm2 monit
```

---

## ⚠️ Limitations & Warnings (4GB)

| Issue | Giải pháp |
|-------|----------|
| Ít concurrent connections | Sử dụng load balancer (Cloudflare) |
| Nếu model quá lớn | Quantize model: `torch.quantization.quantize_dynamic()` |
| Database queries chậm | Cache kết quả, optimize indexes |
| Image uploads lớn | Compress khi upload |
| Traffic cao | Scale lên second server hoặc upgrade RAM |

---

## 🔍 Memory Monitoring Script

```bash
# create-monitor.sh
#!/bin/bash

while true; do
  clear
  echo "=== Memory Usage $(date) ==="
  free -h
  echo ""
  echo "=== Top Processes ==="
  ps aux --sort=-%mem | head -10
  echo ""
  echo "=== MongoDB ==="
  top -p $(pgrep -f mongod) -bn1 | grep mongod
  echo ""
  echo "=== Node Backend ==="
  top -p $(pgrep -f "node server") -bn1 | grep node
  echo ""
  echo "=== Python AI ==="
  top -p $(pgrep -f "python app") -bn1 | grep python
  
  sleep 5
done
```

```bash
chmod +x monitor.sh
./monitor.sh
```

---

## 📈 Khi nào nên upgrade RAM?

**Upgrade to 8GB nếu:**
- Daily active users > 100
- Concurrent uploads > 10/minute
- Multiple model versions running
- Need persistent caching layer (Redis)

**Upgrade to 16GB nếu:**
- Daily active users > 1000
- High-traffic consultation requests
- Running ML training in background
- Multiple service replicas

---

## ✅ Checklist Before Deploy (4GB)

- [ ] Frontend: Static files optimized, no large dependencies
- [ ] Backend: Set max memory limits (PM2)
- [ ] AI Service: Lazy-load model, quantized if needed
- [ ] MongoDB: Cache size limited to 500MB
- [ ] Nginx: Configured for static file serving
- [ ] PM2: Auto-restart on memory exceed
- [ ] Monitoring: Memory alerts setup
- [ ] Testing: Load test with 50+ concurrent users
- [ ] Backup: Daily database backup
- [ ] Swap: Disabled (prevents slowdown)

---

## 🚨 If 4GB still not enough

**Option A: Reduce features**
- Remove AI predictions from main flow → async jobs
- Cache predictions for 1 hour
- Serve cached images via CDN

**Option B: Separate servers (2x 2GB)**
```
Server 1: Frontend + Backend (2GB)
Server 2: AI Service + MongoDB (2GB)
```

**Option C: Managed services**
```
- Frontend: Vercel/Netlify (free)
- Backend: Heroku/Railway/Fly.io (cheap tier)
- Database: MongoDB Atlas (free tier 512MB)
- AI: CPU-based inference via API
```

---

## 📞 Support

Nếu gặp issue:
1. Check memory: `free -h`
2. Check processes: `ps aux --sort=-%mem | head`
3. Check logs: `pm2 logs`
4. Check Nginx: `sudo tail -f /var/log/nginx/error.log`
