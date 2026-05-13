const fs = require('fs');
const path = require('path');

const benh = [
  {
    "_id": { "$oid": "60f1a2b3c4d5e6f7a8b9c001" },
    "tenbenh": "Bệnh đốm trắng (WSSV)",
    "mota": "Bệnh do virus WSSV gây ra. Tôm yếu, tấp mé bờ, vỏ có đốm trắng, lây lan và gây chết hàng loạt trong thời gian rất ngắn (3-10 ngày).",
    "trieuchung": ["Xuất hiện đốm trắng kích thước 0.5-2mm ở giáp đầu ngực, vỏ thân", "Tôm lờ đờ, bơi tấp mé bờ, giảm ăn", "Gan tụy nhợt nhạt"],
    "nguyennhan": "Virus White Spot Syndrome (WSSV), môi trường nước biến động mạnh (mưa nhiều, nhiệt độ thay đổi).",
    "dieutri": "Chưa có thuốc đặc trị. Buộc phải sử dụng các chế phẩm tăng sức đề kháng (Vitamin C, Beta Glucan) và diệt khuẩn ao nuôi gấp.",
    "phongngua": "Chọn giống sạch bệnh (PCR âm tính), quản lý môi trường, diệt giáp xác mang mầm bệnh.",
    "nhom": "Virus",
    "mucdo": "Rất nghiêm trọng",
    "ngaytao": { "$date": "2026-05-01T00:00:00Z" }
  },
  {
    "_id": { "$oid": "60f1a2b3c4d5e6f7a8b9c002" },
    "tenbenh": "Hoại tử gan tụy cấp tính (AHPND/EMS)",
    "mota": "Hội chứng tôm chết sớm. Tôm thường chết hàng loạt trong 20-30 ngày đầu thả nuôi. Khó cứu chữa khi đã bùng phát.",
    "trieuchung": ["Khối gan tụy teo lại, có màu trắng nhợt hoặc đen sẫm", "Xương tụy mềm nhũn", "Vỏ mềm, ruột rỗng", "Chết rớt đáy"],
    "nguyennhan": "Vi khuẩn Vibrio parahaemolyticus tiết độc tố làm phá hủy mô gan tụy.",
    "dieutri": "Sử dụng các dòng kháng sinh đặc trị Vibrio kết hợp với men vi sinh đường ruột và thảo dược cải thiện gan.",
    "phongngua": "Cấy vi sinh có lợi định kỳ (Bacillus) để ép khuẩn Vibrio, kiểm soát mật độ tảo, sát khuẩn định kỳ.",
    "nhom": "Vi khuẩn",
    "mucdo": "Nghiêm trọng",
    "ngaytao": { "$date": "2026-05-01T00:00:00Z" }
  },
  {
    "_id": { "$oid": "60f1a2b3c4d5e6f7a8b9c003" },
    "tenbenh": "Bệnh phân trắng trên tôm (WFD)",
    "mota": "Dịch bệnh đường ruột phổ biến, không làm tôm chết ngay nhưng tôm bị ốp thân, chậm lớn, hao hụt dần làm giảm năng suất nghiêm trọng.",
    "trieuchung": ["Phân tôm màu trắng nổi trên mặt nước hoặc dọc bờ ao", "Ruột tôm đứt khúc, có màu trắng", "Tôm ăn kém, ốp thân, vỏ mềm"],
    "nguyennhan": "Khuẩn Vibrio, vi bào tử trùng EHP, tôm ăn phải tảo độc hoặc mùn bã hữu cơ thối rữa dưới đáy.",
    "dieutri": "Cắt cử ăn 1-2 ngày, diệt khuẩn nước, sau đó trộn men tiêu hóa sống, acid hữu cơ và tỏi/thảo dược vào thức ăn.",
    "phongngua": "Xử lý đáy ao kỹ (siphon), cắt tảo độc, duy trì hệ vi sinh đường ruột khỏe mạnh cho tôm.",
    "nhom": "Đường ruột / Ký sinh trùng",
    "mucdo": "Trung bình",
    "ngaytao": { "$date": "2026-05-01T00:00:00Z" }
  }
];

const sanpham = [
  {
    "_id": { "$oid": "60f1a2b3c4d5e6f7a8b9p001" },
    "tensanpham": "Beta Glucan tỏi - Đề Kháng WSSV",
    "thuonghieu": "AquaVet",
    "loaisanpham": "dinh_duong_de_khang",
    "mota": "Kích thích hệ miễn dịch, bổ sung Allicin từ tỏi tươi giúp tôm tăng sức đề kháng chống lại Virus đốm trắng và thời tiết thay đổi.",
    "congdung": ["Tăng đề kháng chống WSSV", "Phục hồi sức khỏe sau bệnh", "Thúc đẩy tiêu hóa"],
    "lieudung": {"dinh_ky": "3g/kg thức ăn", "xu_ly_benh": "5-7g/kg thức ăn"},
    "goc_thuoc": "Thảo dược / Vitamin",
    "benh_ids": [ { "$oid": "60f1a2b3c4d5e6f7a8b9c001" }, { "$oid": "60f1a2b3c4d5e6f7a8b9c003" } ],
    "gia": 150000,
    "soluong": 200,
    "daban": 45,
    "trangthai": "dang_ban",
    "hinhanh": ["/assets/images/beta-glucan-toi.jpg"],
    "ngaytao": { "$date": "2026-05-02T00:00:00Z" }
  },
  {
    "_id": { "$oid": "60f1a2b3c4d5e6f7a8b9p002" },
    "tensanpham": "Hepato Protect Max (Đặc trị Gan tụy)",
    "thuonghieu": "BioPharma",
    "loaisanpham": "dac_tri",
    "mota": "Thảo dược chiết xuất từ hoa kế sữa và Sorbitol làm mát gan, phục hồi tế bào gan tụy sưng, teo do vi khuẩn Vibrio trong bệnh EMS.",
    "congdung": ["Đặc trị sưng gan, teo gan tụy", "Ức chế vi khuẩn Vibrio parahaemolyticus", "Tái tạo mô gan tụy"],
    "lieudung": {"dinh_ky": "5ml/kg thức ăn", "xu_ly_benh": "10-15ml/kg thức ăn (trộn ăn liên tục 5 ngày)"},
    "goc_thuoc": "Thảo dược tổng hợp",
    "benh_ids": [ { "$oid": "60f1a2b3c4d5e6f7a8b9c002" } ],
    "gia": 320000,
    "soluong": 100,
    "daban": 80,
    "trangthai": "dang_ban",
    "hinhanh": ["/assets/images/hepato-protect.jpg"],
    "ngaytao": { "$date": "2026-05-02T00:00:00Z" }
  },
  {
    "_id": { "$oid": "60f1a2b3c4d5e6f7a8b9p003" },
    "tensanpham": "Bio-Lactic (Men đường ruột Sống)",
    "thuonghieu": "MicroBio",
    "loaisanpham": "vi_sinh",
    "mota": "Cung cấp Lactobacillus nồng độ cao, tạo môi trường acid trong ruột tôm nhằm cạnh tranh triệt để Vibrio và EHP gây bệnh phân trắng.",
    "congdung": ["Trị tôm đi phân trắng, lỏng ruột, đứt khúc", "Nong to đường ruột tôm", "Ép khuẩn có hại"],
    "lieudung": {"dinh_ky": "5g/kg thức ăn", "xu_ly_benh": "10g/kg thức ăn"},
    "goc_thuoc": "Lactobacillus plantarum, Bacillus subtilis",
    "benh_ids": [ { "$oid": "60f1a2b3c4d5e6f7a8b9c003" } ],
    "gia": 250000,
    "soluong": 150,
    "daban": 120,
    "trangthai": "dang_ban",
    "hinhanh": ["/assets/images/bio-lactic.jpg"],
    "ngaytao": { "$date": "2026-05-02T00:00:00Z" }
  },
  {
    "_id": { "$oid": "60f1a2b3c4d5e6f7a8b9p004" },
    "tensanpham": "Vibrio-Clear Xử Lý Nước",
    "thuonghieu": "EcoAqua",
    "loaisanpham": "vi_sinh_moi_truong",
    "mota": "Vi sinh cắt tảo, phân hủy thức ăn thừa, ức chế vi khuẩn Vibrio trong nước nền tảng để tránh lây nhiễm Gan tụy và Phân trắng.",
    "congdung": ["Phân hủy bùn đáy Siphon", "Giảm khí độc NH3, NO2", "Ác chế mầm bệnh Vibrio ngoài môi trường"],
    "lieudung": {"dinh_ky": "1 gói(200g)/ 2000m3", "xu_ly_benh": "1 gói/ 1000m3 lúc 8h tối"},
    "goc_thuoc": "Bacillus sp. nồng độ cao",
    "benh_ids": [ { "$oid": "60f1a2b3c4d5e6f7a8b9c002" }, { "$oid": "60f1a2b3c4d5e6f7a8b9c003" } ],
    "gia": 110000,
    "soluong": 500,
    "daban": 300,
    "trangthai": "dang_ban",
    "hinhanh": ["/assets/images/vibrio-clear.jpg"],
    "ngaytao": { "$date": "2026-05-02T00:00:00Z" }
  }
];

const ketqua = [
  {
    "_id": { "$oid": "60f1a2b3k4d5e6f7a8b9r001" },
    "nguoidung_id": { "$oid": "69f4287a81e2cc492a955ff3" },
    "hinhanh_url": "https://storage.thuy-san.com/detect/tom_ruot_trang_1.jpg",
    "ketqua_benh_id": { "$oid": "60f1a2b3c4d5e6f7a8b9c003" },
    "do_chinh_xac": 92.5,
    "chuandoan_text": "Phát hiện dấu hiệu đường ruột rỗng và phân trắng nhạt dọc thành ruột.",
    "muc_do_canh_bao": "Can thiệp ngay",
    "sanpham_goiy_ids": [
      { "$oid": "60f1a2b3c4d5e6f7a8b9p003" },
      { "$oid": "60f1a2b3c4d5e6f7a8b9p004" }
    ],
    "ngay_nhan_dien": { "$date": "2026-05-05T09:15:00Z" }
  },
  {
    "_id": { "$oid": "60f1a2b3k4d5e6f7a8b9r002" },
    "nguoidung_id": { "$oid": "69f4287a81e2cc492a955ff3" },
    "hinhanh_url": "https://storage.thuy-san.com/detect/tom_gan_den_teo.jpg",
    "ketqua_benh_id": { "$oid": "60f1a2b3c4d5e6f7a8b9c002" },
    "do_chinh_xac": 88.0,
    "chuandoan_text": "Gan tụy teo nhỏ và chuyển màu sẫm đen bất thường.",
    "muc_do_canh_bao": "Cấp cứu",
    "sanpham_goiy_ids": [
      { "$oid": "60f1a2b3c4d5e6f7a8b9p002" },
      { "$oid": "60f1a2b3c4d5e6f7a8b9p004" }
    ],
    "ngay_nhan_dien": { "$date": "2026-05-06T14:30:00Z" }
  }
];

const donhang = [
  {
    "_id": { "$oid": "60f1a2b3d4d5e6f7a8b9o001" },
    "nguoidung_id": { "$oid": "69f4287a81e2cc492a955ff3" },
    "mavandon": "AQUAVET-120526001",
    "tong_tien_hang": 440000,
    "phi_vanchuyen": 30000,
    "giam_gia": 0,
    "tong_tien_thanh_toan": 470000,
    "phuong_thuc_thanh_toan": "Chuyển khoản VNPay",
    "trang_thai_thanh_toan": "da_thanh_toan",
    "trang_thai_don_hang": "dang_giao_hang",
    "lich_su_trang_thai": [
      { "trangthai": "cho_xac_nhan", "thoigian": { "$date": "2026-05-06T15:00:00Z" } },
      { "trangthai": "dang_giao_hang", "thoigian": { "$date": "2026-05-07T08:00:00Z" } }
    ],
    "thong_tin_nhan_hang": {
      "nguoi_nhan": "Nguyễn Văn A",
      "sodienthoai": "0123456789",
      "diachi": "Ấp 1, Long Đức, Long Hồ, Vĩnh Long"
    },
    "ghi_chu": "Giao giờ hành chính, tôm đang bệnh gấp",
    "ngaytao": { "$date": "2026-05-06T15:00:00Z" }
  }
];

const chitiet = [
  {
    "_id": { "$oid": "60f1a2b3i4d5e6f7a8b9d001" },
    "donhang_id": { "$oid": "60f1a2b3d4d5e6f7a8b9o001" },
    "sanpham_id": { "$oid": "60f1a2b3c4d5e6f7a8b9p002" },
    "tensanpham_lucmua": "Hepato Protect Max (Đặc trị Gan tụy)",
    "soluong": 1,
    "gia_luc_mua": 320000,
    "tong_tien_chi_tiet": 320000
  },
  {
    "_id": { "$oid": "60f1a2b3i4d5e6f7a8b9d002" },
    "donhang_id": { "$oid": "60f1a2b3d4d5e6f7a8b9o001" },
    "sanpham_id": { "$oid": "60f1a2b3c4d5e6f7a8b9p004" },
    "tensanpham_lucmua": "Vibrio-Clear Xử Lý Nước",
    "soluong": 1,
    "gia_luc_mua": 110000,
    "tong_tien_chi_tiet": 110000
  }
];

const writeDb = (name, data) => {
  fs.writeFileSync(path.join(__dirname, 'BANTHUOC.' + name + '.json'), JSON.stringify(data, null, 2));
};

writeDb('BENH', benh);
writeDb('SANPHAM', sanpham);
writeDb('KETQUANHANDIEN', ketqua);
writeDb('DONHANG', donhang);
writeDb('CHITIETDONHANG', chitiet);

console.log('Database updated successfully.');
