# 🏠 Single User Private Deployment (Hosting)

> Chỉ bạn truy cập → Đơn giản hơn, không cần Nginx, PM2, Docker, monitoring phức tạp

---

## 🎯 Setup đơn giản

```
┌─────────────────────────────────────┐
│  Your Hosting Server (4GB)          │
├─────────────────────────────────────┤
│  1. Backend    (Node.js) Port 5000  │
│  2. AI Service (Python) Port 5001   │
│  3. MongoDB    Port 27017           │
│  4. Frontend   Access via URL       │
└─────────────────────────────────────┘
```

---

## 📋 Bước 1: SSH vào Server

```bash
# SSH login
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

---

## 📋 Bước 2: Install Dependencies

### Install Node.js & NPM

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs npm
```

### Install Python

```bash
sudo apt install -y python3.9 python3-pip python3.9-venv
```

### Install MongoDB

```bash
# Add MongoDB repo
curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Install Git

```bash
sudo apt install -y git
```

---

## 📋 Bước 3: Clone & Setup Backend

```bash
# Clone repo
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git /home/ubuntu/app
cd /home/ubuntu/app/backend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/BANTHUOC
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://your-server-ip:5000/api/auth/google/callback
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://your-server-ip:5173
CORS_ORIGIN=http://your-server-ip:5173
AI_SERVICE_URL=http://localhost:5001
TEXTBEE_API_KEY=your_textbee_api_key_here
TEXTBEE_DEVICE_ID=your_textbee_device_id_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EOF
```

**⚠️ Thay `your-server-ip` với IP thật của server**

### Test Backend

```bash
npm start
# Should see: Server running on port 5000
```

Nhấn `Ctrl+C` để stop

---

## 📋 Bước 4: Setup Frontend

```bash
cd /home/ubuntu/app/frontend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://your-server-ip:5000/api
VITE_PORT=5173
EOF
```

### Build Frontend (optional - or run dev server)

```bash
# Option A: Production build
npm run build
# Output: dist/ folder

# Option B: Dev server (dễ hơn)
npm run dev
```

---

## 📋 Bước 5: Setup AI Service

```bash
cd /home/ubuntu/app/ai_service

# Create virtual environment
python3.9 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
AI_PORT=5001
CORS_ORIGINS=http://your-server-ip:5000
NODE_ENV=development
EOF
```

### Test AI Service

```bash
python app.py
# Should see: Running on http://localhost:5001
```

Nhấn `Ctrl+C` để stop

---

## 🚀 Bước 6: Run All Services

**Terminal 1 - Backend:**
```bash
cd /home/ubuntu/app/backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd /home/ubuntu/app/frontend
npm run dev
# Or: npm run build (then access http://your-server-ip:5173)
```

**Terminal 3 - AI Service:**
```bash
cd /home/ubuntu/app/ai_service
source venv/bin/activate
python app.py
```

### Access Application

```
Frontend: http://your-server-ip:5173
```

---

## 💡 Tiện ích: Use tmux (chạy tất cả trong 1 terminal)

```bash
# Install tmux
sudo apt install -y tmux

# Create new session
tmux new-session -d -s app -x 200 -y 50

# Split into 3 panes
tmux new-window -t app -n backend -c /home/ubuntu/app/backend
tmux new-window -t app -n frontend -c /home/ubuntu/app/frontend
tmux new-window -t app -n ai -c /home/ubuntu/app/ai_service

# Start services
tmux send-keys -t app:backend "npm start" Enter
tmux send-keys -t app:frontend "npm run dev" Enter
tmux send-keys -t app:ai "source venv/bin/activate && python app.py" Enter

# Attach to view
tmux attach -t app
```

**Commands:**
```bash
# List sessions
tmux list-sessions

# Attach
tmux attach -t app

# Detach
Ctrl + B + D

# Kill session
tmux kill-session -t app
```

---

## 🔄 Restart Services

**If something goes wrong:**

```bash
# Kill all Node processes
pkill -f "node server"

# Kill all Python processes
pkill -f "python app"

# Restart everything
tmux kill-session -t app
tmux new-session -d -s app -x 200 -y 50
tmux new-window -t app -n backend -c /home/ubuntu/app/backend
tmux new-window -t app -n frontend -c /home/ubuntu/app/frontend
tmux new-window -t app -n ai -c /home/ubuntu/app/ai_service
tmux send-keys -t app:backend "npm start" Enter
tmux send-keys -t app:frontend "npm run dev" Enter
tmux send-keys -t app:ai "source venv/bin/activate && python app.py" Enter
tmux attach -t app
```

---

## 🐛 Troubleshooting

### Port already in use

```bash
# Kill process using port
lsof -i :5000   # Find process on port 5000
kill -9 <PID>

# Or use different port in .env
PORT=5002
VITE_PORT=5174
AI_PORT=5002
```

### MongoDB connection error

```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check if running
mongo
> exit
```

### Python module not found

```bash
# Make sure venv is activated
source venv/bin/activate

# Install missing package
pip install package-name
```

### Permission denied

```bash
# Fix ownership
sudo chown -R $USER:$USER /home/ubuntu/app

# Or use sudo
sudo npm start  # (not recommended)
```

---

## 📊 Monitor Resource Usage

```bash
# Check memory/CPU
free -h
top

# Check disk
df -h

# Check running processes
ps aux | grep -E "node|python|mongo"
```

---

## 🔐 Simple Firewall (if needed)

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22

# Allow ports
sudo ufw allow 5000  # Backend
sudo ufw allow 5173  # Frontend
sudo ufw allow 5001  # AI (optional)
sudo ufw allow 27017 # MongoDB (local only - better close it)

# Close MongoDB to outside
sudo ufw deny 27017

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 💾 Backup Database

```bash
# Backup MongoDB
mongodump --out /home/ubuntu/backup/mongodb_$(date +%Y%m%d)

# Or just copy directory
sudo cp -r /var/lib/mongodb /home/ubuntu/backup/

# List backups
ls -lh /home/ubuntu/backup/
```

---

## 🔄 Update Code

```bash
# When you push new code to repo
cd /home/ubuntu/app
git pull origin main

# Restart services
pkill -f "node server"
pkill -f "python app"

# (then restart with tmux or npm start)
```

---

## ✅ Checklist

- [ ] SSH into server
- [ ] Install Node, Python, MongoDB
- [ ] Clone repo
- [ ] Create .env files (replace IPs)
- [ ] Install dependencies
- [ ] Test each service individually
- [ ] Run all 3 services together
- [ ] Access frontend at http://your-server-ip:5173
- [ ] Test login, API calls, AI predictions
- [ ] Setup backup strategy

---

## 📝 Summary

| Task | Command |
|------|---------|
| SSH | `ssh user@your-server-ip` |
| Clone | `git clone ... /home/ubuntu/app` |
| Backend | `cd backend && npm install && npm start` |
| Frontend | `cd frontend && npm install && npm run dev` |
| AI | `cd ai_service && pip install -r requirements.txt && python app.py` |
| View | `http://your-server-ip:5173` |

---

## 💬 Notes

✅ **Advantages of this setup:**
- Simple, no Docker/Kubernetes needed
- Easy to debug and develop
- Can modify code and restart
- Good for single-user/testing
- Low memory footprint

❌ **Limitations:**
- No auto-restart if crashes
- Manual restarts needed
- No logs persistence
- Limited security (if exposed)
- Can't handle high traffic

---

## 🚀 When Ready for Production

If later you want:
- Auto-restart → Use PM2
- Process management → Use systemd
- Web server → Add Nginx
- SSL/HTTPS → Use Let's Encrypt + Nginx
- Monitoring → Use PM2+ or Datadog
- Scaling → Use Docker + Docker Compose

But for **private single-user access**, this setup is **perfect!**
