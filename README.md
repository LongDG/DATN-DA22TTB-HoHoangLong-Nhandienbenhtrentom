# 🦐 ShrimpCheck — Hệ Thống Nhận Diện Bệnh Trên Tôm & Bán Thuốc Thủy Sản

> **Đồ án tốt nghiệp** — Ngành Công nghệ Thông tin  
> **Sinh viên:** Hồ Hoàng Long  
> **Đề tài:** Nhận diện bệnh trên tôm bằng trí tuệ nhân tạo kết hợp hệ thống thương mại điện tử thuốc thủy sản

---

## 📋 Mục Lục

- [Giới thiệu](#-giới-thiệu)
- [Mục tiêu đồ án](#-mục-tiêu-đồ-án)
- [Tính năng chính](#-tính-năng-chính)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [Hướng dẫn chạy chương trình](#-hướng-dẫn-chạy-chương-trình)
- [Cấu hình biến môi trường](#-cấu-hình-biến-môi-trường)
- [Cơ sở dữ liệu](#-cơ-sở-dữ-liệu)
- [Mô hình AI](#-mô-hình-ai)
- [API Endpoints](#-api-endpoints)
- [Ảnh minh họa](#-ảnh-minh-họa)

---

## 📖 Giới Thiệu

**ShrimpCheck** là hệ thống web ứng dụng trí tuệ nhân tạo (AI) để nhận diện bệnh trên tôm thông qua hình ảnh, kết hợp với nền tảng thương mại điện tử bán thuốc thủy sản. Hệ thống giúp người nuôi tôm:

- **Chẩn đoán nhanh** bệnh tôm chỉ bằng cách chụp ảnh và tải lên hệ thống
- **Nhận gợi ý điều trị** và sản phẩm thuốc phù hợp dựa trên kết quả chẩn đoán
- **Mua thuốc trực tuyến** với tích hợp thanh toán chuyển khoản tự động
- **Tham khảo sổ tay kỹ thuật** với kiến thức chuyên sâu về nuôi tôm
- **Tư vấn trực tiếp** với chuyên gia thủy sản qua hệ thống chat
- **Chatbot AI** hỗ trợ tư vấn 24/7 với Gemini AI

---

## 🎯 Mục Tiêu Đồ Án

1. **Xây dựng mô hình AI** nhận diện bệnh trên tôm từ hình ảnh sử dụng mạng nơ-ron tích chập (CNN) — cụ thể là kiến trúc **EfficientNet-B3** với kỹ thuật **Ensemble Learning** (3 models) và **Test-Time Augmentation (TTA ×8)**
2. **Phát triển hệ thống web Full-stack** với kiến trúc phân tầng (3-tier):
   - **Frontend** giao diện người dùng hiện đại, responsive
   - **Backend** xử lý nghiệp vụ, xác thực, quản lý dữ liệu
   - **AI Service** phục vụ dự đoán bệnh từ hình ảnh
3. **Tích hợp thương mại điện tử** cho phép mua bán thuốc thủy sản trực tuyến với thanh toán SePay
4. **Cung cấp kiến thức** thông qua sổ tay kỹ thuật và hệ thống tư vấn chuyên gia
5. **Đạt độ chính xác cao** trong nhận diện 4 lớp bệnh: Mang đen (BlackGill), Khỏe mạnh (Healthy), Đốm trắng (WSSV), Đầu vàng (Yellowhead)

---

## ✨ Tính Năng Chính

### 👤 Dành cho Người dùng
| Tính năng | Mô tả |
|-----------|--------|
| 🔐 Đăng ký / Đăng nhập | Email + mật khẩu hoặc Google OAuth 2.0 |
| 📸 Chẩn đoán bệnh tôm | Tải ảnh tôm → AI nhận diện bệnh + gợi ý điều trị |
| 🛒 Mua thuốc trực tuyến | Giỏ hàng, đặt hàng, thanh toán COD/chuyển khoản |
| 📚 Sổ tay kỹ thuật | Tra cứu bài viết kỹ thuật nuôi tôm |
| 💬 Tư vấn chuyên gia | Chat trực tiếp với quản trị viên |
| 🤖 Chatbot AI | Hỗ trợ tư vấn 24/7 bằng Gemini AI |
| 📊 Giá tôm thị trường | Cập nhật giá tôm theo thời gian thực |
| 📦 Quản lý đơn hàng | Theo dõi trạng thái đơn hàng |

### 🔧 Dành cho Quản trị viên (Admin)
| Tính năng | Mô tả |
|-----------|--------|
| 📊 Dashboard tổng quan | Thống kê doanh thu, đơn hàng, người dùng |
| 📦 Quản lý sản phẩm | CRUD sản phẩm, tồn kho |
| 📋 Quản lý đơn hàng | Xác nhận, cập nhật trạng thái đơn |
| 👥 Quản lý người dùng | Xem, chỉnh sửa thông tin người dùng |
| 🦠 Quản lý bệnh tôm | Thêm/sửa/xóa thông tin bệnh |
| 📝 Quản lý sổ tay kỹ thuật | Viết và quản lý bài viết |
| 💬 Phản hồi tư vấn | Trả lời yêu cầu tư vấn từ người dùng |
| 📈 Quản lý giá tôm | Cập nhật giá tôm thị trường |
| 🔍 Nhật ký chẩn đoán | Xem lịch sử chẩn đoán bệnh |

---

## 🏗 Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                    React + Vite + TailwindCSS                   │
│                        Port: 5173                               │
└─────────────────┬───────────────────────┬───────────────────────┘
                  │  HTTP REST API         │
                  ▼                        │
┌─────────────────────────────┐            │
│     BACKEND (Node.js)       │            │
│   Express.js + Mongoose     │            │
│       Port: 5000            │            │
│                             │            │
│  ┌───────────────────────┐  │            │
│  │  Routes / Controllers │  │            │
│  │  Middleware (JWT Auth) │  │            │
│  │  Models (Mongoose)    │  │            │
│  └───────────┬───────────┘  │            │
│              │              │            │
└──────────────┼──────────────┘            │
               │                           │
               ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────┐
│    MongoDB Database   │    │   AI SERVICE (Flask)     │
│    Database: BANTHUOC │    │   EfficientNet-B3        │
│    Port: 27017        │    │   Ensemble 3 Models      │
│                       │    │   Port: 5001             │
│  Collections:         │    │                          │
│  - NGUOIDUNG          │    │  ┌────────────────────┐  │
│  - SANPHAM            │    │  │ Smart Preprocessing│  │
│  - DONHANG            │    │  │ TTA ×8 Transforms  │  │
│  - BENH               │    │  │ Ensemble Averaging │  │
│  - KETQUANHANDIEN     │    │  └────────────────────┘  │
│  - ...                │    │                          │
└──────────────────────┘    └──────────────────────────┘
```

### Luồng chẩn đoán bệnh:
```
Người dùng chụp ảnh tôm
        │
        ▼
  Frontend gửi ảnh → Backend API (/api/diagnose)
        │
        ▼
  Backend chuyển tiếp → AI Service (/predict)
        │
        ▼
  AI Service xử lý:
    1. Validate ảnh (kích thước, định dạng, chất lượng)
    2. Smart Preprocessing (GrabCut, CLAHE, Sharpness)
    3. Ensemble 3 models × TTA 8 phép biến đổi = 24 dự đoán
    4. Trung bình xác suất → Kết quả cuối cùng
        │
        ▼
  Trả về: Tên bệnh, Độ chính xác, Mức tin cậy,
          Khuyến nghị điều trị, Sản phẩm gợi ý
```

---

## 🛠 Công Nghệ Sử Dụng

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| React | 19.x | Thư viện xây dựng UI |
| Vite | 5.x | Build tool & dev server |
| TailwindCSS | 4.x | CSS framework |
| React Router DOM | 7.x | Điều hướng SPA |
| Lucide React | 1.x | Icon library |
| Motion (Framer) | 12.x | Animation library |

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Node.js | 18+ | Runtime JavaScript |
| Express.js | 5.x | Web framework |
| Mongoose | 8.x | MongoDB ODM |
| JSON Web Token | 9.x | Xác thực JWT |
| Bcrypt.js | 3.x | Mã hóa mật khẩu |
| Multer | 2.x | Upload file |
| Passport.js | 0.7 | Google OAuth 2.0 |
| Axios | 1.x | HTTP client |

### AI Service
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Python | 3.9+ | Ngôn ngữ lập trình |
| Flask | 3.1 | Web framework |
| PyTorch | 2.0+ | Deep Learning framework |
| TorchVision | 0.15+ | Models & transforms |
| OpenCV | 4.8+ | Xử lý ảnh |
| Pillow | 10.0+ | Xử lý ảnh PIL |
| NumPy | 1.24+ | Tính toán số |
| SciPy | 1.11+ | Xử lý tín hiệu |

### Cơ sở dữ liệu
| Công nghệ | Mục đích |
|-----------|----------|
| MongoDB | 7.0+ | NoSQL Database |

### Dịch vụ bên thứ ba
| Dịch vụ | Mục đích |
|---------|----------|
| Google OAuth 2.0 | Đăng nhập bằng Google |
| Google Gemini AI | Chatbot tư vấn |
| SePay | Thanh toán chuyển khoản tự động |
| TextBee | Gửi SMS OTP |

---

## 📁 Cấu Trúc Thư Mục

```
KLTN/
├── frontend/                   # Giao diện người dùng (React + Vite)
│   ├── src/
│   │   ├── components/         # Components tái sử dụng
│   │   │   ├── AuthLayout.jsx
│   │   │   ├── GoogleAuthButton.jsx
│   │   │   ├── PhoneSetupModal.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── user/           # Components cho trang user
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── OTPPage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   ├── user/           # Trang người dùng
│   │   │   │   ├── UserDashboard.jsx      # Trang chính + Chẩn đoán AI
│   │   │   │   ├── StorePage.jsx          # Cửa hàng thuốc
│   │   │   │   ├── ProductDetailPage.jsx  # Chi tiết sản phẩm
│   │   │   │   ├── CheckoutPage.jsx       # Thanh toán
│   │   │   │   ├── MyOrdersPage.jsx       # Đơn hàng của tôi
│   │   │   │   ├── OrderSuccessPage.jsx   # Đặt hàng thành công
│   │   │   │   ├── HandbookPage.jsx       # Sổ tay kỹ thuật
│   │   │   │   ├── HandbookDetailPage.jsx # Chi tiết bài viết
│   │   │   │   └── ConsultUserPage.jsx    # Tư vấn chuyên gia
│   │   │   └── admin/          # Trang quản trị
│   │   │       ├── DashboardOverview.jsx  # Tổng quan
│   │   │       ├── InventoryPage.jsx      # Quản lý sản phẩm
│   │   │       ├── OrdersPage.jsx         # Quản lý đơn hàng
│   │   │       ├── UserManagementPage.jsx # Quản lý người dùng
│   │   │       ├── DiseaseManagePage.jsx  # Quản lý bệnh tôm
│   │   │       ├── HandbookAdminPage.jsx  # Quản lý sổ tay
│   │   │       ├── ConsultationPage.jsx   # Phản hồi tư vấn
│   │   │       ├── DiagnosticLog.jsx      # Nhật ký chẩn đoán
│   │   │       ├── ShrimpPricePage.jsx    # Giá tôm
│   │   │       └── CategoryPage.jsx       # Danh mục
│   │   ├── layouts/            # Layout components
│   │   ├── utils/              # Hàm tiện ích
│   │   ├── App.jsx             # Root component
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/                    # API Server (Node.js + Express)
│   ├── config/
│   │   ├── db.js               # Kết nối MongoDB
│   │   └── passport.js         # Cấu hình Google OAuth
│   ├── controllers/            # Xử lý logic nghiệp vụ
│   ├── middleware/              # Middleware (auth, upload, ...)
│   ├── models/                 # Mongoose Models
│   │   ├── User.js             # Model Người dùng
│   │   └── OTP.js              # Model OTP
│   ├── routes/                 # Định tuyến API
│   │   ├── authRoutes.js       # Xác thực (login/register)
│   │   ├── adminRoutes.js      # API quản trị
│   │   ├── productRoutes.js    # Sản phẩm
│   │   ├── orderRoutes.js      # Đơn hàng
│   │   ├── diagnoseRoutes.js   # Chẩn đoán AI
│   │   ├── chatbotRoutes.js    # Chatbot Gemini
│   │   ├── consultationRoutes.js # Tư vấn
│   │   ├── handbookRoutes.js   # Sổ tay kỹ thuật
│   │   ├── categoryRoutes.js   # Danh mục
│   │   ├── shrimpPriceRoutes.js # Giá tôm
│   │   ├── notificationRoutes.js # Thông báo
│   │   └── sepayRoutes.js      # Thanh toán SePay
│   ├── utils/                  # Hàm tiện ích
│   ├── uploads/                # Thư mục lưu ảnh upload
│   ├── server.js               # Entry point
│   ├── package.json
│   ├── .env                    # Biến môi trường (không commit)
│   └── .env.example            # Mẫu biến môi trường
│
├── ai_service/                 # Dịch vụ AI (Python + Flask)
│   ├── app.py                  # Flask server + predict logic
│   ├── validator.py            # Validate chất lượng ảnh
│   ├── inspect_model.py        # Kiểm tra model (debug)
│   ├── requirements.txt        # Dependencies Python
│   └── start.bat               # Script khởi chạy (Windows)
│
├── model_ai/                   # File model AI đã train
│   ├── best_model.pth          # Model v1 (~46MB)
│   ├── best_model_v2.pth       # Model v2 (~46MB)
│   └── best_model_v3.pth       # Model v3 (~46MB)
│
├── database/                   # Dữ liệu mẫu (JSON seed)
│   ├── BANTHUOC.NGUOIDUNG.json
│   ├── BANTHUOC.SANPHAM.json
│   ├── BANTHUOC.BENH.json
│   ├── BANTHUOC.DONHANG.json
│   ├── BANTHUOC.DANHMUC.json
│   ├── ...
│   └── seed.js                 # Script import dữ liệu mẫu
│
├── images/                     # Ảnh tài liệu
├── website_database/           # Sơ đồ CSDL (HTML interactive)
├── DATABASE_SCHEMA.md          # Tài liệu lược đồ CSDL
├── DATABASE_ER_DIAGRAM.md      # Sơ đồ ER
└── README.md                   # File này
```

---

## 💻 Yêu Cầu Hệ Thống

### Phần mềm bắt buộc

| Phần mềm | Phiên bản tối thiểu | Tải về |
|-----------|---------------------|--------|
| **Node.js** | 18.x trở lên | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.9 trở lên | [python.org](https://www.python.org/) |
| **MongoDB** | 7.0 trở lên | [mongodb.com](https://www.mongodb.com/try/download/community) |
| **Git** | 2.x trở lên | [git-scm.com](https://git-scm.com/) |

### Phần cứng khuyến nghị

| Thành phần | Yêu cầu tối thiểu | Khuyến nghị |
|-----------|-------------------|-------------|
| **RAM** | 4 GB | 8 GB trở lên |
| **Ổ cứng** | 2 GB trống | 5 GB trống (bao gồm model AI) |
| **CPU** | 2 cores | 4 cores trở lên |
| **GPU** | Không bắt buộc | NVIDIA GPU có CUDA (tăng tốc AI) |

> **Lưu ý:** AI Service có thể chạy trên CPU nhưng sẽ chậm hơn so với GPU. Trên CPU, thời gian dự đoán khoảng 5-15 giây, trên GPU (CUDA) chỉ 1-3 giây.

---

## 🚀 Hướng Dẫn Cài Đặt

### Bước 1: Clone dự án

```bash
git clone https://github.com/<your-repo>/KLTN.git
cd KLTN
```

### Bước 2: Cài đặt MongoDB

1. Tải và cài đặt [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Khởi động MongoDB service:
   ```bash
   # Windows
   net start MongoDB

   # macOS / Linux
   sudo systemctl start mongod
   ```
3. Import dữ liệu mẫu (tùy chọn):
   ```bash
   cd database
   node seed.js
   ```

### Bước 3: Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` từ mẫu:
```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với các thông tin cần thiết (xem phần [Cấu hình biến môi trường](#-cấu-hình-biến-môi-trường)).

### Bước 4: Cài đặt Frontend

```bash
cd frontend
npm install
```

### Bước 5: Cài đặt AI Service

```bash
cd ai_service

# Tạo virtual environment (khuyến nghị)
python -m venv venv

# Kích hoạt virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt
```

> **Lưu ý về PyTorch:** Nếu máy có GPU NVIDIA, cài PyTorch phiên bản CUDA để tăng tốc:
> ```bash
> # PyTorch với CUDA 11.8
> pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
>
> # PyTorch với CUDA 12.1
> pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
> ```

### Bước 6: Kiểm tra Model AI

Đảm bảo 3 file model nằm trong thư mục `model_ai/`:
```
model_ai/
├── best_model.pth       (~46 MB)
├── best_model_v2.pth    (~46 MB)
└── best_model_v3.pth    (~46 MB)
```

---

## ▶️ Hướng Dẫn Chạy Chương Trình

### Cách 1: Chạy từng service thủ công

Mở **3 terminal** riêng biệt và chạy lần lượt:

#### Terminal 1 — AI Service (Port 5001)
```bash
cd ai_service

# Kích hoạt virtual environment
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

python app.py
```

Kết quả mong đợi:
```
2026-xx-xx [INFO] Đang load model: ..\model_ai\best_model.pth  device=cpu
2026-xx-xx [INFO] ✅ Loaded: best_model.pth
2026-xx-xx [INFO] ✅ Loaded: best_model_v2.pth
2026-xx-xx [INFO] ✅ Loaded: best_model_v3.pth
2026-xx-xx [INFO] ✅ ENSEMBLE 3 models sẵn sàng — 4 classes  device=cpu
 * Running on http://0.0.0.0:5001
```

#### Terminal 2 — Backend (Port 5000)
```bash
cd backend
npm run dev
```

Kết quả mong đợi:
```
Server listening on http://localhost:5000
MongoDB connected successfully
```

#### Terminal 3 — Frontend (Port 5173)
```bash
cd frontend
npm run dev
```

Kết quả mong đợi:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### Cách 2: Sử dụng script khởi chạy (Windows)

Chạy AI Service bằng script có sẵn:
```bash
cd ai_service
start.bat
```

### Truy cập ứng dụng

Sau khi cả 3 service đã chạy, mở trình duyệt và truy cập:

| Dịch vụ | URL | Mô tả |
|---------|-----|--------|
| 🌐 **Frontend** | [http://localhost:5173](http://localhost:5173) | Giao diện web chính |
| ⚙️ **Backend API** | [http://localhost:5000](http://localhost:5000) | REST API |
| 🤖 **AI Health Check** | [http://localhost:5001/health](http://localhost:5001/health) | Kiểm tra trạng thái AI |

### Thứ tự khởi chạy khuyến nghị

```
1. MongoDB        (phải chạy trước)
2. AI Service     (cần thời gian load model ~10-30 giây)
3. Backend        (kết nối MongoDB + gọi AI Service)
4. Frontend       (giao diện người dùng)
```

---

## ⚙️ Cấu Hình Biến Môi Trường

Tạo file `backend/.env` với nội dung sau:

```env
# ── Server ──────────────────────────────────────────
PORT=5000

# ── MongoDB ─────────────────────────────────────────
MONGO_URI=mongodb://localhost:27017/BANTHUOC

# ── Google OAuth 2.0 ────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# ── JWT Authentication ──────────────────────────────
JWT_SECRET=your_jwt_secret_key_here

# ── TextBee SMS Gateway (OTP) ───────────────────────
TEXTBEE_API_KEY=your_textbee_api_key
TEXTBEE_DEVICE_ID=your_device_id

# ── Server URL (cho upload ảnh local) ───────────────
SERVER_URL=http://localhost:5000

# ── SePay — Thanh toán chuyển khoản ─────────────────
SEPAY_BANK=your_bank_name
SEPAY_ACC_NO=your_account_number
SEPAY_ACC_NAME=your_account_name

# ── Gemini AI — Chatbot ────────────────────────────
GEMINI_API_KEY=your_gemini_api_key
```

> **Hướng dẫn lấy API Key:**
> - **Google OAuth:** [console.cloud.google.com](https://console.cloud.google.com/) → APIs & Services → Credentials
> - **Gemini AI:** [aistudio.google.com](https://aistudio.google.com/apikey)
> - **SePay:** [my.sepay.vn](https://my.sepay.vn/)
> - **TextBee:** [textbee.dev](https://textbee.dev/)

---

## 🗄 Cơ Sở Dữ Liệu

Hệ thống sử dụng **MongoDB** với database tên `BANTHUOC`, gồm **13 collections**:

| Collection | Mô tả |
|-----------|--------|
| `NGUOIDUNG` | Thông tin người dùng (tên, email, mật khẩu, địa chỉ, vai trò) |
| `SANPHAM` | Sản phẩm thuốc thủy sản (tên, giá, mô tả, liều dùng, tồn kho) |
| `DANHMUC` | Danh mục sản phẩm |
| `BENH` | Thông tin bệnh tôm (triệu chứng, nguyên nhân, điều trị, phòng ngừa) |
| `DONHANG` | Đơn hàng (tổng tiền, trạng thái, phương thức thanh toán) |
| `CHITIETDONHANG` | Chi tiết từng sản phẩm trong đơn hàng |
| `GIOHANG` | Giỏ hàng người dùng |
| `CHITIETGIOHANG` | Chi tiết sản phẩm trong giỏ hàng |
| `BAIVIET` | Bài viết sổ tay kỹ thuật |
| `LIENHE` | Yêu cầu tư vấn + lịch sử chat |
| `KETQUANHANDIEN` | Kết quả chẩn đoán bệnh từ AI |
| `THONGBAO` | Thông báo hệ thống |
| `SOTAYKYTHUAT` | Sổ tay kỹ thuật nuôi tôm |
| `GIATOM` | Giá tôm thị trường |
| `OTP_RESET` | OTP reset mật khẩu (TTL 5 phút) |

> Xem chi tiết lược đồ tại file [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

---

## 🧠 Mô Hình AI

### Kiến trúc
- **Base model:** EfficientNet-B3 (pretrained ImageNet)
- **Custom Classifier:**
  ```
  Dropout(0.4) → Linear(1536, 512) → SiLU → Dropout(0.3) → Linear(512, 4)
  ```
- **Kỹ thuật Ensemble:** Trung bình xác suất từ 3 model (v1, v2, v3)
- **Test-Time Augmentation (TTA):** 8 phép biến đổi × 3 models = 24 dự đoán

### 4 lớp bệnh nhận diện

| Lớp | Tên bệnh | Mức độ |
|-----|----------|--------|
| 0 | 🖤 Mang đen (Black Gill) | Cao |
| 1 | 💚 Khỏe mạnh (Healthy) | Bình thường |
| 2 | ⚪ Đốm trắng — WSSV (White Spot Syndrome Virus) | Nguy hiểm |
| 3 | 💛 Đầu vàng (Yellowhead Disease) | Nguy hiểm |

### Tiền xử lý ảnh thông minh
1. **GrabCut** — Tách vùng chủ thể (tôm) khỏi nền
2. **CLAHE** — Cân bằng sáng thích ứng cục bộ
3. **Sharpness Enhancement** — Tăng độ nét nhẹ (1.3×)

### Mức độ tin cậy
| Ngưỡng | Mức | Mô tả |
|--------|-----|--------|
| ≥ 70% | 🟢 Cao | Chẩn đoán tin cậy |
| 50–70% | 🟡 Trung bình | Cần xem xét thêm |
| < 50% | 🔴 Thấp | Không chắc chắn — nên tham vấn chuyên gia |

---

## 📡 API Endpoints

### Xác thực (`/api/auth`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/auth/google` | Đăng nhập Google OAuth |

### Chẩn đoán AI (`/api/diagnose`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/diagnose` | Gửi ảnh chẩn đoán bệnh |
| GET | `/api/diagnose/history` | Lịch sử chẩn đoán |

### Sản phẩm (`/api/products`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/products` | Danh sách sản phẩm |
| GET | `/api/products/:id` | Chi tiết sản phẩm |

### Đơn hàng (`/api/orders`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/orders` | Tạo đơn hàng |
| GET | `/api/orders/my-orders` | Đơn hàng của tôi |

### AI Service (`localhost:5001`)
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/health` | Kiểm tra trạng thái service |
| GET | `/classes` | Danh sách lớp bệnh |
| POST | `/predict` | Gửi ảnh dự đoán (multipart/form-data) |

---

## 📸 Ảnh Minh Họa

> Xem ảnh minh họa sơ đồ CSDL và giao diện tại thư mục `images/`

---

## 📄 Tài Liệu Bổ Sung

| Tài liệu | Mô tả |
|----------|--------|
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Chi tiết lược đồ cơ sở dữ liệu |
| [DATABASE_ER_DIAGRAM.md](DATABASE_ER_DIAGRAM.md) | Sơ đồ quan hệ thực thể |
| [DATABASE_SUMMARY.md](DATABASE_SUMMARY.md) | Tổng quan cơ sở dữ liệu |
| [OPTIMIZATION_GUIDE.md](OPTIMIZATION_GUIDE.md) | Hướng dẫn tối ưu hóa |
| [DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md) | Hướng dẫn triển khai nhanh |
| [CLOUD_4GB_OPTIMIZATION.md](CLOUD_4GB_OPTIMIZATION.md) | Tối ưu cho server 4GB RAM |

---

## 📝 License

Đồ án tốt nghiệp — Không dùng cho mục đích thương mại.

---

<p align="center">
  <b>🦐 ShrimpCheck</b> — Bảo vệ tôm, tối ưu lợi nhuận
  <br>
  <i>Được phát triển bởi Hồ Hoàng Long</i>
</p>
