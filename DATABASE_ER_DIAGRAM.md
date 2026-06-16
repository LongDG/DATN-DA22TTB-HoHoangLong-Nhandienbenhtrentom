```mermaid
erDiagram
    NGUOIDUNG ||--o{ DONHANG : "places"
    NGUOIDUNG ||--|| GIOHANG : "owns"
    NGUOIDUNG ||--o{ BAIVIET : "writes"
    NGUOIDUNG ||--o{ LIENHE : "initiates"
    NGUOIDUNG ||--o{ KETQUANHANDIEN : "uploads"
    NGUOIDUNG ||--o{ BINHLUAN : "comments"
    
    SANPHAM }o--|| DANHMUC : "belongs_to"
    SANPHAM }o--o{ BENH : "treats"
    
    DONHANG ||--o{ CHITIETDONHANG : "contains"
    CHITIETDONHANG }o--|| SANPHAM : "includes"
    
    GIOHANG ||--o{ CHITIETGIOHANG : "contains"
    CHITIETGIOHANG }o--|| SANPHAM : "holds"
    
    BAIVIET }o--|| BENH : "discusses"
    BAIVIET ||--o{ BINHLUAN : "has"
    
    KETQUANHANDIEN }o--|| BENH : "detects"
    KETQUANHANDIEN }o--o{ SANPHAM : "recommends"
    
    LIENHE : int _id
    LIENHE : objectId nguoidung_id
    LIENHE : string trang_thai
    
    NGUOIDUNG : objectId _id
    NGUOIDUNG : string ten
    NGUOIDUNG : string email
    NGUOIDUNG : string vaitro
    NGUOIDUNG : array diachi
    
    SANPHAM : objectId _id
    SANPHAM : string tensanpham
    SANPHAM : number gia
    SANPHAM : number soluong
    SANPHAM : array benh_ids
    
    DANHMUC : objectId _id
    DANHMUC : string tendanhmuc
    
    BENH : objectId _id
    BENH : string tenbenh
    BENH : string nhom
    BENH : string mucdo
    
    DONHANG : objectId _id
    DONHANG : objectId nguoidung_id
    DONHANG : number tong_tien_thanh_toan
    DONHANG : string trang_thai_don_hang
    
    CHITIETDONHANG : objectId _id
    CHITIETDONHANG : objectId donhang_id
    CHITIETDONHANG : objectId sanpham_id
    CHITIETDONHANG : number soluong
    
    GIOHANG : objectId _id
    GIOHANG : objectId nguoidung_id
    
    CHITIETGIOHANG : objectId _id
    CHITIETGIOHANG : objectId giohang_id
    CHITIETGIOHANG : objectId sanpham_id
    
    BAIVIET : objectId _id
    BAIVIET : string tieude
    BAIVIET : objectId benh_id
    BAIVIET : objectId tacgia_id
    
    KETQUANHANDIEN : objectId _id
    KETQUANHANDIEN : objectId nguoidung_id
    KETQUANHANDIEN : objectId benh_id
    KETQUANHANDIEN : number do_chinh_xac
    KETQUANHANDIEN : array sanpham_goiy_ids
    
    BINHLUAN : objectId _id
    BINHLUAN : objectId baiviet_id
    BINHLUAN : objectId nguoidung_id
    
    OTP_RESET : objectId _id
    OTP_RESET : string sodienthoai
    OTP_RESET : string otp
    OTP_RESET : date createdAt "TTL: 300s"
```

# Mermaid ER Diagram - Hệ Thống Bán Thuốc Tôm AquaVet

Diagram trên hiển thị:

## Các Thực Thể Chính:

1. **NGUOIDUNG** - Trung tâm (hub)
   - Relationship 1:N với DONHANG (đặt hàng)
   - Relationship 1:1 với GIOHANG (giỏ hàng)
   - Relationship 1:N với BAIVIET (viết bài)
   - Relationship 1:N với LIENHE (tư vấn)
   - Relationship 1:N với KETQUANHANDIEN (upload chẩn đoán)
   - Relationship 1:N với BINHLUAN (bình luận)

2. **SANPHAM** - Sản phẩm
   - Relationship N:1 với DANHMUC (danh mục)
   - Relationship N:N với BENH (sản phẩm chữa được bệnh)

3. **Đơn Hàng**
   - DONHANG → (1:N) → CHITIETDONHANG
   - CHITIETDONHANG → (N:1) → SANPHAM

4. **Giỏ Hàng**
   - GIOHANG → (1:N) → CHITIETGIOHANG
   - CHITIETGIOHANG → (N:1) → SANPHAM

5. **Bệnh & Bài Viết**
   - BAIVIET → (N:1) → BENH (bài viết nói về bệnh)
   - BAIVIET → (1:N) → BINHLUAN (bài viết có bình luận)

6. **Chẩn Đoán**
   - KETQUANHANDIEN → (N:1) → BENH (phát hiện bệnh)
   - KETQUANHANDIEN → (N:N) → SANPHAM (gợi ý sản phẩm)

## Mô Hình Dữ Liệu:
- **MongoDB** (NoSQL Document)
- **Embedded Documents**: diachi (trong NGUOIDUNG), tin_nhan (trong LIENHE), lich_su_trang_thai (trong DONHANG)
- **References**: ObjectId tham chiếu giữa các collections
