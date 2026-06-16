# Tóm Tắt Lược Đồ Cơ Sở Dữ Liệu - Hệ Thống AquaVet

## 📊 Sơ Đồ Quan Hệ Nhanh

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────┘

                              NGUOIDUNG (User)
                            /      |      |     \
                          /        |      |       \
                    DONHANG      GIOHANG  BAIVIET  LIENHE  KETQUANHANDIEN
                      |  \         |         |        |         |
                    1:N  \        1:1        |        |       1:N
                      |    \       |       1:N        |         |
            CHITIETDONHANG  \  CHITIETGIOHANG  |    1:N         |
                   \          \       /     BINHLUAN |         |
                    \          \     /              |    1:1  |
                     \__________\___/_______________\____|     |
                              |                            |    |
                          SANPHAM  ◄──N:N────────────► BENH
                              |                          ▲
                              |                          |
                              |                          |
                              └──────────────────────────┘
```

---

## 📋 Danh Sách Collections

### 1️⃣ **NGUOIDUNG** - Người Dùng
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `ten` | String | Tên người dùng (bắt buộc) |
| `email` | String | Email (bắt buộc, unique) |
| `matkhau` | String | Hash mật khẩu (OAuth có thể null) |
| `sodienthoai` | String | Số điện thoại |
| `vaitro` | String | "user" hoặc "admin" |
| `anhdaidien` | String | URL ảnh đại diện |
| `googleId` | String | ID Google OAuth |
| `diachi[]` | Array | Danh sách địa chỉ (embedded) |
| `ngaytao` | Date | Ngày tạo |

**Subdocument `diachi`:**
```javascript
{
  _id: String,
  macdinh: Boolean,          // Địa chỉ mặc định
  tennguoinhan: String,      // Tên người nhận
  sodienthoai: String,
  sonha: String,
  xa: String,
  huyen: String,
  tinh: String               // Tỉnh/Thành phố
}
```

---

### 2️⃣ **SANPHAM** - Sản Phẩm Thuốc
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `tensanpham` | String | Tên sản phẩm |
| `thuonghieu` | String | Nhãn hiệu (e.g., "AquaVet") |
| `loaisanpham` | String | Loại: dinh_duong_de_khang, khoang_san, ... |
| `mota` | String | Mô tả chi tiết |
| `congdung[]` | Array | Công dụng |
| `lieudung` | Object | Liều dùng (dinh_ky, xu_ly_benh) |
| `goc_thuoc` | String | Thành phần gốc |
| `benh_ids[]` | Array[ObjectId] | Tham chiếu BENH (N:N) |
| `gia` | Number | Giá bán |
| `soluong` | Number | Tồn kho |
| `daban` | Number | Đã bán |
| `ngaytao` | Date | Ngày tạo |

---

### 3️⃣ **DANHMUC** - Danh Mục Sản Phẩm
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `tendanhmuc` | String | Tên danh mục |
| `mota` | String | Mô tả |
| `icon` | String | URL icon |
| `sapxep` | Number | Thứ tự sắp xếp |

**Quan hệ:** 1 DANHMUC ← N SANPHAM

---

### 4️⃣ **BENH** - Bệnh Tôm
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `tenbenh` | String | Tên bệnh (e.g., "Bệnh đốm trắng WSSV") |
| `mota` | String | Mô tả bệnh |
| `trieuchung[]` | Array | Danh sách triệu chứng |
| `nguyennhan` | String | Nguyên nhân bệnh |
| `dieutri` | String | Cách điều trị |
| `phongngua` | String | Cách phòng ngừa |
| `nhom` | String | Nhóm: "Virus", "Vi khuẩn", "Ký sinh", ... |
| `mucdo` | String | "Rất nghiêm trọng", "Nặng", ... |
| `ngaytao` | Date | Ngày tạo |

**Quan hệ:**
- N:N với SANPHAM (sản phẩm chữa bệnh)
- 1:N với BAIVIET (bài viết nói về bệnh)
- 1:N với KETQUANHANDIEN (chẩn đoán phát hiện bệnh)

---

### 5️⃣ **DONHANG** - Đơn Hàng
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `nguoidung_id` | ObjectId | FK → NGUOIDUNG |
| `mavandon` | String | Mã vận đơn duy nhất |
| `tong_tien_hang` | Number | Tổng tiền sản phẩm |
| `phi_vanchuyen` | Number | Phí vận chuyển |
| `giam_gia` | Number | Tiền giảm giá |
| `tong_tien_thanh_toan` | Number | Tổng cộng |
| `phuong_thuc_thanh_toan` | String | "VNPay", "COD", "Bank", ... |
| `trang_thai_thanh_toan` | String | "da_thanh_toan", "chua_thanh_toan" |
| `trang_thai_don_hang` | String | "cho_xac_nhan", "dang_giao_hang", "da_giao" |
| `lich_su_trang_thai[]` | Array | Lịch sử thay đổi trạng thái |
| `ngaytao` | Date | Ngày đặt hàng |

**Subdocument `lich_su_trang_thai`:**
```javascript
{
  trangthai: String,
  thoigian: Date
}
```

---

### 6️⃣ **CHITIETDONHANG** - Chi Tiết Đơn Hàng
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `donhang_id` | ObjectId | FK → DONHANG |
| `sanpham_id` | ObjectId | FK → SANPHAM |
| `tensanpham_lucmua` | String | Tên lúc mua (lưu snapshot) |
| `soluong` | Number | Số lượng |
| `gia_luc_mua` | Number | Giá lúc mua (snapshot) |
| `tong_tien_chi_tiet` | Number | soluong × gia_luc_mua |

**Ghi chú:** Lưu lại tên và giá sản phẩm để tránh ảnh hưởng khi giá thay đổi

---

### 7️⃣ **GIOHANG** - Giỏ Hàng
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `nguoidung_id` | ObjectId | FK → NGUOIDUNG (unique) |
| `ngaytao` | Date | Ngày tạo |

**Quan hệ:** 1:1 với NGUOIDUNG (mỗi user có 1 giỏ)

---

### 8️⃣ **CHITIETGIOHANG** - Chi Tiết Giỏ Hàng
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `giohang_id` | ObjectId | FK → GIOHANG |
| `sanpham_id` | ObjectId | FK → SANPHAM |
| `soluong` | Number | Số lượng trong giỏ |

---

### 9️⃣ **BAIVIET** - Bài Viết / Handbook
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `tieude` | String | Tiêu đề bài viết |
| `noidung` | String | Nội dung chi tiết |
| `tomtat` | String | Tóm tắt bài viết |
| `anhbia` | String | URL ảnh bìa |
| `benh_id` | ObjectId | FK → BENH (bài viết về bệnh nào) |
| `tacgia_id` | ObjectId | FK → NGUOIDUNG (tác giả) |
| `the[]` | Array | Tags (e.g., "bệnh tôm", "phòng ngừa") |
| `luotxem` | Number | Lượt xem |
| `ngaytao` | Date | Ngày tạo |

---

### 🔟 **LIENHE** - Liên Hệ / Tư Vấn
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `nguoidung_id` | ObjectId | FK → NGUOIDUNG |
| `ten_nguoidung` | String | Tên người hỏi |
| `vitri_tinh` | String | Tỉnh/Thành phố |
| `vitri_ao` | String | Vị trí ao nuôi |
| `noidung` | String | Nội dung yêu cầu |
| `trang_thai` | String | "cho_phan_hoi", "da_phan_hoi" |
| `ngaytao` | Date | Ngày tạo |
| `tin_nhan[]` | Array | Lịch sử chat tư vấn |
| `ngay_phan_hoi` | Date | Ngày phản hồi |

**Subdocument `tin_nhan`:**
```javascript
{
  vai_tro: String,      // "nguoidung" hoặc "admin"
  noi_dung: String,
  thoigian: Date
}
```

---

### 1️⃣1️⃣ **KETQUANHANDIEN** - Kết Quả Chẩn Đoán AI
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `nguoidung_id` | ObjectId | FK → NGUOIDUNG |
| `hinhanh_url` | String | URL ảnh tôm upload |
| `benh_id` | ObjectId | FK → BENH (bệnh được phát hiện) |
| `do_chinh_xac` | Number | Độ chính xác (0-100%) |
| `chuandoan_text` | String | Mô tả kết quả chẩn đoán |
| `muc_do_canh_bao` | String | "Cảnh báo", "Can thiệp ngay", ... |
| `sanpham_goiy_ids[]` | Array[ObjectId] | FK → SANPHAM (sản phẩm gợi ý) |
| `ngay_nhan_dien` | Date | Ngày chẩn đoán |

**Quan hệ:** N:N với SANPHAM (gợi ý nhiều sản phẩm)

---

### 1️⃣2️⃣ **BINHLUAN** - Bình Luận
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `baiviet_id` | ObjectId | FK → BAIVIET |
| `nguoidung_id` | ObjectId | FK → NGUOIDUNG |
| `noidung` | String | Nội dung bình luận |
| `ngaytao` | Date | Ngày bình luận |

**Hiện tại:** Collection trống, chuẩn bị cho tính năng bình luận

---

### 1️⃣3️⃣ **OTP_RESET** - OTP Reset Mật Khẩu
| Trường | Kiểu | Ghi Chú |
|-------|------|--------|
| `_id` | ObjectId | Primary Key |
| `sodienthoai` | String | Số điện thoại (indexed) |
| `otp` | String | Mã OTP 6 chữ số |
| `createdAt` | Date | Ngày tạo (TTL: 300s) |

**TTL Index:** Tự động xóa sau 5 phút

---

## 🔗 Các Quan Hệ Chi Tiết

### **1:1 Relations (1-to-1)**
```
NGUOIDUNG  1 ──── 1  GIOHANG
  (mỗi user có 1 giỏ hàng)
```

### **1:N Relations (1-to-Many)**
```
NGUOIDUNG      1 ──── N  DONHANG
NGUOIDUNG      1 ──── N  BAIVIET
NGUOIDUNG      1 ──── N  LIENHE
NGUOIDUNG      1 ──── N  KETQUANHANDIEN
NGUOIDUNG      1 ──── N  BINHLUAN

DONHANG        1 ──── N  CHITIETDONHANG
GIOHANG        1 ──── N  CHITIETGIOHANG
BENH           1 ──── N  BAIVIET
BENH           1 ──── N  KETQUANHANDIEN
DANHMUC        1 ──── N  SANPHAM
BAIVIET        1 ──── N  BINHLUAN
```

### **N:N Relations (Many-to-Many)**
```
SANPHAM       N ──── N  BENH
  (sản phẩm chữa nhiều bệnh, bệnh được chữa bằng nhiều sản phẩm)

KETQUANHANDIEN N ──── N  SANPHAM
  (chẩn đoán gợi ý nhiều sản phẩm, sản phẩm gợi ý nhiều chẩn đoán)
```

---

## 🔍 Chỉ Mục (Indexes)

```javascript
// NGUOIDUNG - Tìm user theo email
db.NGUOIDUNG.createIndex({ email: 1 }, { unique: true })

// GIOHANG - Tìm giỏ theo user
db.GIOHANG.createIndex({ nguoidung_id: 1 }, { unique: true })

// LIENHE - Tìm tư vấn của user, theo trạng thái
db.LIENHE.createIndex({ nguoidung_id: 1 })
db.LIENHE.createIndex({ trang_thai: 1 })

// DONHANG - Tìm đơn hàng của user
db.DONHANG.createIndex({ nguoidung_id: 1 })
db.DONHANG.createIndex({ trang_thai_don_hang: 1 })
db.DONHANG.createIndex({ mavandon: 1 }, { unique: true })

// KETQUANHANDIEN - Tìm chẩn đoán của user
db.KETQUANHANDIEN.createIndex({ nguoidung_id: 1 })

// OTP_RESET - TTL Index (tự xóa sau 5 phút)
db.OTP_RESET.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 })
```

---

## 📊 Thống Kê Dữ Liệu Hiện Tại

| Collection | Số Records | Trạng Thái |
|-----------|----------|----------|
| NGUOIDUNG | ~5 | ✅ Active |
| SANPHAM | ~20 | ✅ Active |
| DANHMUC | ~5 | ✅ Active |
| BENH | ~10 | ✅ Active |
| DONHANG | ~10 | ✅ Active |
| CHITIETDONHANG | ~20 | ✅ Active |
| GIOHANG | ~5 | ✅ Active |
| CHITIETGIOHANG | ~10 | ✅ Active |
| BAIVIET | ~5 | ✅ Active |
| LIENHE | ~5 | ✅ Active |
| KETQUANHANDIEN | ~5 | ✅ Active |
| BINHLUAN | 0 | ⏳ Ready |
| OTP_RESET | ~ | ✅ Active (Temp) |

---

## 🎯 Quy Tắc Thiết Kế

1. **Lưu Snapshot Dữ Liệu**
   - `tensanpham_lucmua`, `gia_luc_mua` trong CHITIETDONHANG
   - Tránh dữ liệu thay đổi ảnh hưởng đến đơn hàng cũ

2. **Embedded Documents**
   - `diachi[]` trong NGUOIDUNG (subdocument)
   - `tin_nhan[]` trong LIENHE (conversation history)
   - `lich_su_trang_thai[]` trong DONHANG (status tracking)

3. **Foreign Keys / References**
   - Sử dụng ObjectId tham chiếu
   - Đánh dấu FK bằng `_id` trong collection tham chiếu

4. **TTL Indexes**
   - OTP_RESET tự xóa sau 5 phút (bảo mật)

5. **Unique Indexes**
   - email (NGUOIDUNG)
   - nguoidung_id (GIOHANG)
   - mavandon (DONHANG)

---

## 📝 File Liên Quan

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Tài liệu chi tiết
- [DATABASE_ER_DIAGRAM.md](DATABASE_ER_DIAGRAM.md) - Diagram Mermaid
- [database_schema_diagram.xml](database_schema_diagram.xml) - XML diagram

---

**Cập nhật:** 2026-06-15 | **Hệ Thống:** AquaVet Pharmacy Management System
