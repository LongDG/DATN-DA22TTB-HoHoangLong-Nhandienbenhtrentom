const fs = require('fs');
const path = 'g:/KLTN/database/BANTHUOC.SANPHAM.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. Tối ưu hoá logic gợi ý thuốc: Bổ sung định danh mảng 'muc_dich_su_dung'
// ["dieutri", "phongbenh", "hotro"] cho TẤT CẢ các thuốc củ
if(data[0]) data[0].muc_dich_su_dung = ['phongbenh', 'hotro'];
if(data[1]) data[1].muc_dich_su_dung = ['dieutri', 'hotro'];
if(data[2]) data[2].muc_dich_su_dung = ['dieutri', 'phongbenh'];
if(data[3]) data[3].muc_dich_su_dung = ['phongbenh', 'hotro'];

// 2. Bổ sung các loại thuốc thực tế để chữa/phòng 2 bệnh Đen mang (0004) và Đầu vàng (0005)

data.push({
  "_id": { "$oid": "60f1a2b3c4d5e6f7a8b91005" },
  "tensanpham": "Trợ lắng Yucca Zeo - Hấp thu khí độc",
  "thuonghieu": "EcoAqua",
  "loaisanpham": "vi_sinh_moi_truong",
  "muc_dich_su_dung": ["hotro", "dieutri"],
  "mota": "Hấp thu cực nhanh khí độc NH3, H2S, làm sạch đáy ao, làm thông thoáng mang tôm bị dơ bẩn, giúp tôm thở dễ dàng hơn trong bệnh đen mang.",
  "congdung": ["Hấp thu khí độc", "Cấp cứu tôm ngạt nổi đầu", "Giúp tôm sạch mang, đặc trị mảng bám đen mang do môi trường dơ"],
  "lieudung": { "dinh_ky": "1kg/2000m3", "xu_ly_benh": "2kg/1000m3 tạt thẳng xuống ao" },
  "goc_thuoc": "Yucca Schidigera, Zeolite",
  "benh_ids": [ { "$oid": "60f1a2b3c4d5e6f7a8b90004" } ],
  "gia": 180000, 
  "soluong": 100, 
  "daban": 20, 
  "trangthai": "dang_ban",
  "hinhanh": ["/assets/images/yucca-zeo.jpg"],
  "ngaytao": { "$date": "2026-05-08T00:00:00Z" }
});

data.push({
  "_id": { "$oid": "60f1a2b3c4d5e6f7a8b91006" },
  "tensanpham": "Iodine 90 - Siêu Diệt Khuẩn & Nấm",
  "thuonghieu": "AquaVet",
  "loaisanpham": "dac_tri",
  "muc_dich_su_dung": ["dieutri", "phongbenh"],
  "mota": "Dung dịch sát khuẩn phổ rộng cực mạnh. Đặc trị các bệnh do nấm, ký sinh trùng bám trên vỏ tôm - nguyên nhân gây đen mang, đốm đen.",
  "congdung": ["Đặc trị đen mang do nấm và vi khuẩn", "Trị đốm đen, mòn đuôi", "Sát trùng nguồn nước trị virus đầu vàng"],
  "lieudung": { "dinh_ky": "1L/3000m3", "xu_ly_benh": "1L/1500m3" },
  "goc_thuoc": "Povidone Iodine 90%",
  "benh_ids": [ { "$oid": "60f1a2b3c4d5e6f7a8b90004" }, { "$oid": "60f1a2b3c4d5e6f7a8b90005" } ],
  "gia": 210000, 
  "soluong": 150, 
  "daban": 80, 
  "trangthai": "dang_ban",
  "hinhanh": ["/assets/images/iodine-90.jpg"],
  "ngaytao": { "$date": "2026-05-08T00:00:00Z" }
});

data.push({
  "_id": { "$oid": "60f1a2b3c4d5e6f7a8b91007" },
  "tensanpham": "C Tạt Chống Sốc - Vitamin C 30%",
  "thuonghieu": "BioPharma",
  "loaisanpham": "dinh_duong_de_khang",
  "muc_dich_su_dung": ["phongbenh", "hotro"],
  "mota": "Chống sốc môi trường, giảm stress khi thời tiết thay đổi đột ngột. Cực kỳ quan trọng để hỗ trợ tăng miễn dịch tự nhiên giúp tôm cầm cự với Virus (Đầu vàng yHV, đốm trắng).",
  "congdung": ["Chống sốc nhiệt, tụt pH", "Hỗ trợ tăng sức đề kháng cầm cự Virus Đầu Vàng và đốm trắng", "Kích thích tôm lột xác"],
  "lieudung": { "dinh_ky": "1kg/3000m3", "xu_ly_benh": "2kg/1000m3" },
  "goc_thuoc": "Acid Ascorbic (Vitamin C)",
  "benh_ids": [ { "$oid": "60f1a2b3c4d5e6f7a8b90005" }, { "$oid": "60f1a2b3c4d5e6f7a8b90001" } ],
  "gia": 120000, 
  "soluong": 300, 
  "daban": 150, 
  "trangthai": "dang_ban",
  "hinhanh": ["/assets/images/c-tat-30.jpg"],
  "ngaytao": { "$date": "2026-05-08T00:00:00Z" }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log('Thành công! Đã thêm thuốc mới và trường muc_dich_su_dung.');
