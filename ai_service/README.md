# Hướng dẫn cài đặt AI Service

## 1. Cài đặt Python dependencies

```bash
cd G:\KLTN\ai_service
pip install -r requirements.txt
```

## 2. Cài đặt Node.js dependencies (backend)

```bash
cd G:\KLTN\backend
npm install multer axios
```

## 3. Khởi động AI Service

```bash
cd G:\KLTN\ai_service
python app.py
# Hoặc nhấn đúp vào start.bat
```

Service chạy tại: `http://localhost:5001`

## 4. Khởi động Backend Node.js

```bash
cd G:\KLTN\backend
npm run dev
```

## 5. Khởi động Frontend

```bash
cd G:\KLTN\frontend
npm run dev
```

---

## Kiểm tra AI Service

```
GET http://localhost:5001/health
```

```json
{
  "status": "ok",
  "model_loaded": true,
  "model_version": "best_model_v3.pth",
  "num_classes": 4,
  "device": "cpu"
}
```

---

## Cấu hình số lớp bệnh

Nếu model của bạn có số lớp khác 4, sửa `DISEASE_CLASSES` trong `app.py`.  
Thứ tự danh sách **phải** khớp với thứ tự class khi training.

## Cấu hình đường dẫn model

```bash
set MODEL_PATH=..\model_ai\best_model_v3.pth
```

Hoặc chỉnh trong `start.bat`.
