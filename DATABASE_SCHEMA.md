# Lược Đồ Cơ Sở Dữ Liệu - Hệ Thống Bán Thuốc Tôm

## Tổng Quan

Hệ thống quản lý bán thuốc aquavet cho tôm sử dụng **MongoDB** với 11 collections chính:

### Collections:
1. **NGUOIDUNG** - Người dùng (User)
2. **SANPHAM** - Sản phẩm thuốc
3. **DANHMUC** - Danh mục sản phẩm
4. **BENH** - Bệnh tôm (Disease)
5. **DONHANG** - Đơn hàng (Order)
6. **CHITIETDONHANG** - Chi tiết đơn hàng (Order Detail)
7. **GIOHANG** - Giỏ hàng (Shopping Cart)
8. **CHITIETGIOHANG** - Chi tiết giỏ hàng (Cart Item)
9. **BAIVIET** - Bài viết/Handbook
10. **LIENHE** - Liên hệ/Tư vấn (Consultation)
11. **KETQUANHANDIEN** - Kết quả chẩn đoán hình ảnh (Diagnostic Result)
12. **BINHLUAN** - Bình luận (Comment)
13. **OTP_RESET** - OTP reset mật khẩu

---

## Chi Tiết Collections

### 1. NGUOIDUNG (Users)
Lưu thông tin người dùng hệ thống.

```
{
  _id: ObjectId,
  ten: String (required) - Tên người dùng
  email: String (required, unique) - Email đăng nhập
  matkhau: String - Mật khẩu (hash), null nếu dùng Google OAuth
  sodienthoai: String - Số điện thoại
  vaitro: String (enum: "user", "admin") - Vai trò
  anhdaidien: String - URL ảnh đại diện
  googleId: String - ID Google nếu đăng nhập Google
  diachi: Array[DiaChi] - Danh sách địa chỉ (nested)
    - _id: String
    - macdinh: Boolean - Địa chỉ mặc định
    - tennguoinhan: String - Tên người nhận
    - sodienthoai: String
    - sonha: String
    - xa: String
    - huyen: String
    - tinh: String
  ngaytao: Date - Ngày tạo tài khoản
}
```

**Chỉ mục:** email (unique)

---

### 2. SANPHAM (Products)
Lưu thông tin sản phẩm thuốc.

```
{
  _id: ObjectId,
  tensanpham: String - Tên sản phẩm
  thuonghieu: String - Nhãn hiệu
  loaisanpham: String - Loại sản phẩm (dinh_duong_de_khang, khoang_san, ...)
  mota: String - Mô tả chi tiết
  congdung: Array[String] - Công dụng
  lieudung: Object - Liều dùng
    - dinh_ky: String
    - xu_ly_benh: String
  goc_thuoc: String - Thành phần gốc
  benh_ids: Array[ObjectId] - Tham chiếu đến BENH
  gia: Number - Giá bán
  soluong: Number - Số lượng tồn kho
  daban: Number - Số lượng đã bán
  ngaytao: Date
}
```

**Quan hệ:** N:N với BENH (qua `benh_ids`)

---

### 3. DANHMUC (Categories)
Danh mục sản phẩm.

```
{
  _id: ObjectId,
  tendanhmuc: String - Tên danh mục
  mota: String - Mô tả
  icon: String - URL icon
  sapxep: Number - Thứ tự sắp xếp
}
```

---

### 4. BENH (Diseases/Illnesses)
Lưu thông tin các bệnh tôm.

```
{
  _id: ObjectId,
  tenbenh: String - Tên bệnh
  mota: String - Mô tả bệnh
  trieuchung: Array[String] - Triệu chứng
  nguyennhan: String - Nguyên nhân
  dieutri: String - Cách điều trị
  phongngua: String - Phòng ngừa
  nhom: String - Nhóm bệnh (Virus, Vi khuẩn, Ký sinh, ...)
  mucdo: String - Mức độ nguy hiểm
  ngaytao: Date
}
```

**Quan hệ:** N:N với SANPHAM (sản phẩm dùng để chữa bệnh)

---

### 5. DONHANG (Orders)
Lưu đơn hàng của người dùng.

```
{
  _id: ObjectId,
  nguoidung_id: ObjectId → NGUOIDUNG - Tham chiếu người dùng
  mavandon: String - Mã vận đơn
  tong_tien_hang: Number - Tổng tiền hàng
  phi_vanchuyen: Number - Phí vận chuyển
  giam_gia: Number - Tiền giảm giá
  tong_tien_thanh_toan: Number - Tổng thanh toán
  phuong_thuc_thanh_toan: String - Phương thức (VNPay, COD, ...)
  trang_thai_thanh_toan: String - Trạng thái (da_thanh_toan, chua_thanh_toan, ...)
  trang_thai_don_hang: String - Trạng thái đơn (cho_xac_nhan, dang_giao_hang, ...)
  lich_su_trang_thai: Array - Lịch sử thay đổi trạng thái
    - trangthai: String
    - thoigian: Date
  ngaytao: Date
}
```

**Quan hệ:** N:1 với NGUOIDUNG

---

### 6. CHITIETDONHANG (Order Details)
Chi tiết từng sản phẩm trong đơn hàng.

```
{
  _id: ObjectId,
  donhang_id: ObjectId → DONHANG
  sanpham_id: ObjectId → SANPHAM
  tensanpham_lucmua: String - Tên sản phẩm lúc mua (lưu lại)
  soluong: Number - Số lượng
  gia_luc_mua: Number - Giá lúc mua
  tong_tien_chi_tiet: Number - Tổng tiền
}
```

**Quan hệ:** N:1 với DONHANG, N:1 với SANPHAM

---

### 7. GIOHANG (Shopping Cart)
Giỏ hàng của người dùng.

```
{
  _id: ObjectId,
  nguoidung_id: ObjectId → NGUOIDUNG
  ngaytao: Date
}
```

**Quan hệ:** 1:1 với NGUOIDUNG (mỗi user có 1 giỏ hàng)

---

### 8. CHITIETGIOHANG (Cart Items)
Chi tiết các sản phẩm trong giỏ hàng.

```
{
  _id: ObjectId,
  giohang_id: ObjectId → GIOHANG
  sanpham_id: ObjectId → SANPHAM
  soluong: Number - Số lượng
}
```

**Quan hệ:** N:1 với GIOHANG, N:1 với SANPHAM

---

### 9. BAIVIET (Articles/Handbook)
Bài viết hướng dẫn, handbook.

```
{
  _id: ObjectId,
  tieude: String - Tiêu đề bài viết
  noidung: String - Nội dung bài viết
  tomtat: String - Tóm tắt
  anhbia: String - URL ảnh bìa
  benh_id: ObjectId → BENH - Bệnh mà bài viết nói về
  tacgia_id: ObjectId → NGUOIDUNG - Tác giả
  the: Array[String] - Tags/Tags
  luotxem: Number - Lượt xem
  ngaytao: Date
}
```

**Quan hệ:** N:1 với BENH, N:1 với NGUOIDUNG

---

### 10. LIENHE (Consultation/Contact)
Tư vấn, liên hệ với chuyên gia.

```
{
  _id: ObjectId,
  nguoidung_id: ObjectId → NGUOIDUNG
  ten_nguoidung: String
  vitri_tinh: String - Tỉnh/Thành phố
  vitri_ao: String - Vị trí ao nuôi
  noidung: String - Nội dung yêu cầu
  trang_thai: String - Trạng thái (cho_phan_hoi, da_phan_hoi, ...)
  ngaytao: Date
  tin_nhan: Array - Lịch sử tin nhắn tư vấn
    - vai_tro: String (nguoidung, admin)
    - noi_dung: String
    - thoigian: Date
}
```

**Quan hệ:** N:1 với NGUOIDUNG

---

### 11. KETQUANHANDIEN (Diagnostic Results)
Kết quả chẩn đoán bệnh từ hình ảnh (AI).

```
{
  _id: ObjectId,
  nguoidung_id: ObjectId → NGUOIDUNG
  hinhanh_url: String - URL hình ảnh tôm
  benh_id: ObjectId → BENH - Bệnh được chẩn đoán
  do_chinh_xac: Number - Độ chính xác (0-100%)
  chuandoan_text: String - Mô tả kết quả chẩn đoán
  muc_do_canh_bao: String - Mức độ cảnh báo
  sanpham_goiy_ids: Array[ObjectId] → SANPHAM - Sản phẩm gợi ý
  ngay_nhan_dien: Date - Ngày chẩn đoán
}
```

**Quan hệ:** N:1 với NGUOIDUNG, N:1 với BENH, N:N với SANPHAM

---

### 12. BINHLUAN (Comments)
Bình luận (hiện tại rỗng).

```
{
  _id: ObjectId,
  baiviet_id: ObjectId → BAIVIET - Bài viết được bình luận
  nguoidung_id: ObjectId → NGUOIDUNG - Người bình luận
  noidung: String - Nội dung bình luận
  ngaytao: Date
}
```

---

### 13. OTP_RESET (One-Time Password)
OTP tạm thời cho reset mật khẩu.

```
{
  _id: ObjectId,
  sodienthoai: String - Số điện thoại
  otp: String - Mã OTP
  createdAt: Date (TTL: 5 phút tự xóa)
}
```

**TTL Index:** 300 giây (5 phút)

---

## Sơ Đồ Quan Hệ (ERD)

```
NGUOIDUNG (1)
├── (N) DONHANG
├── (1) GIOHANG
├── (N) BAIVIET
├── (N) LIENHE
├── (N) KETQUANHANDIEN
└── (N) BINHLUAN

SANPHAM (N:N) BENH

DONHANG (1)
└── (N) CHITIETDONHANG
    └── (N) SANPHAM

GIOHANG (1)
└── (N) CHITIETGIOHANG
    └── (N) SANPHAM

BENH (1)
├── (N) BAIVIET
└── (N) KETQUANHANDIEN

KETQUANHANDIEN (N:N) SANPHAM
```

---

## Thống Kê Dữ Liệu

| Collection | Số Records | Mục Đích |
|-----------|-----------|---------|
| NGUOIDUNG | ~5 | Người dùng/Admin |
| SANPHAM | ~20+ | Sản phẩm thuốc |
| DANHMUC | ~5 | Danh mục |
| BENH | ~10+ | Loại bệnh |
| DONHANG | ~10+ | Đơn hàng |
| CHITIETDONHANG | ~20+ | Chi tiết đơn |
| GIOHANG | ~5 | Giỏ hàng |
| CHITIETGIOHANG | ~10+ | Mục giỏ hàng |
| BAIVIET | ~5 | Bài hướng dẫn |
| LIENHE | ~5+ | Tư vấn |
| KETQUANHANDIEN | ~5+ | Kết quả chẩn đoán |
| BINHLUAN | 0 | Bình luận |
| OTP_RESET | ~ | Tạm thời OTP |

---

## Các Chỉ Mục (Indexes)

### Khuyến nghị tạo:
```javascript
// NGUOIDUNG
db.NGUOIDUNG.createIndex({ email: 1 }, { unique: true })

// GIOHANG
db.GIOHANG.createIndex({ nguoidung_id: 1 }, { unique: true })

// LIENHE
db.LIENHE.createIndex({ nguoidung_id: 1 })
db.LIENHE.createIndex({ trang_thai: 1 })

// DONHANG
db.DONHANG.createIndex({ nguoidung_id: 1 })
db.DONHANG.createIndex({ trang_thai_don_hang: 1 })

// KETQUANHANDIEN
db.KETQUANHANDIEN.createIndex({ nguoidung_id: 1 })

// OTP_RESET (TTL index)
db.OTP_RESET.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 })
```

---

## Lưu Ý

- **Lưu lại dữ liệu tại thời điểm mua:** `tensanpham_lucmua`, `gia_luc_mua` để tránh ảnh hưởng khi sản phẩm thay đổi
- **Lịch sử trạng thái:** DONHANG lưu mảng `lich_su_trang_thai` để tracking
- **TTL Index:** OTP_RESET tự xóa sau 5 phút
- **Subdocument:** NGUOIDUNG lưu `diachi` là mảng (embedded document) chứ không tạo collection riêng
- **Liên hệ tin nhắn:** LIENHE lưu mảng `tin_nhan` cho cuộc tư vấn (conversation)
