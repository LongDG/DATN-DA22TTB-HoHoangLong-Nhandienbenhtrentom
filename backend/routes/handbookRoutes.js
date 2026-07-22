const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const CATEGORY_MAP = {
  ky_thuat_nuoi:  { label: 'Kỹ thuật nuôi',  color: 'bg-[#0077b6] text-white'   },
  phong_tri_benh: { label: 'Phòng & Trị',     color: 'bg-red-600 text-white'     },
  quan_ly_ao:     { label: 'Quản lý ao',      color: 'bg-[#2c694e] text-white'   },
  sop:            { label: 'SOP',             color: 'bg-[#904300] text-white'   },
  dinh_duong:     { label: 'Dinh dưỡng',      color: 'bg-purple-600 text-white'  },
};

function format(a) {
  const cat = CATEGORY_MAP[a.danhmuc] || { label: a.danhmuc, color: 'bg-slate-500 text-white' };
  return {
    id:          a._id.toString(),
    title:       a.tieude,
    summary:     a.tomtat || '',
    content:     a.noidung || '',
    category:    a.danhmuc,
    categoryLabel: cat.label,
    categoryColor: cat.color,
    image:       a.hinhanh || '',
    videoUrl:    a.video_url || '',
    videoDuration: a.video_thoigian || '',
    author:      a.tacgia || 'Ban biên tập',
    views:       a.luotxem || 0,
    status:      a.trangthai || 'nhap',
    tags:        a.tags || [],
    createdAt:   a.ngaytao ? new Date(a.ngaytao).toLocaleDateString('vi-VN') : '',
    updatedAt:   a.ngaycapnhat ? new Date(a.ngaycapnhat).toLocaleDateString('vi-VN') : '',
  };
}

/* GET /api/handbook — danh sách bài viết */
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { category, search, page = 1, limit = 9, type, _admin } = req.query;
    // Admin có thể xem tất cả trạng thái
    const filter = _admin === '1' ? {} : { trangthai: 'published' };
    if (category && category !== 'all') filter.danhmuc = category;
    if (search) filter.$or = [
      { tieude:  { $regex: search, $options: 'i' } },
      { tomtat:  { $regex: search, $options: 'i' } },
      { noidung: { $regex: search, $options: 'i' } },
    ];
    if (type === 'video') filter.video_url = { $exists: true, $ne: '' };

    const total = await db.collection('SOTAYKYTHUAT').countDocuments(filter);
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const articles = await db.collection('SOTAYKYTHUAT')
      .find(filter).sort({ ngaytao: -1 }).skip(skip).limit(parseInt(limit)).toArray();

    res.json({ articles: articles.map(format), total, totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* GET /api/handbook/admin-detail/:id — chi tiết đầy đủ cho admin (không tăng lượt xem) */
router.get('/admin-detail/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const a = await db.collection('SOTAYKYTHUAT').findOne({ _id: new ObjectId(req.params.id) });
    if (!a) return res.status(404).json({ message: 'Không tìm thấy' });
    // Trả về field gốc để form chỉnh sửa
    res.json({
      id:             a._id.toString(),
      tieude:         a.tieude         || '',
      tomtat:         a.tomtat         || '',
      noidung:        a.noidung        || '',
      danhmuc:        a.danhmuc        || 'ky_thuat_nuoi',
      hinhanh:        a.hinhanh        || '',
      video_url:      a.video_url      || '',
      video_thoigian: a.video_thoigian || '',
      tacgia:         a.tacgia         || '',
      trangthai:      a.trangthai      || 'nhap',
      tags:           a.tags           || [],
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* GET /api/handbook/featured — bài nổi bật */
router.get('/featured', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const articles = await db.collection('SOTAYKYTHUAT')
      .find({ trangthai: 'published' }).sort({ luotxem: -1 }).limit(3).toArray();
    res.json(articles.map(format));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* GET /api/handbook/:id */
router.get('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const a = await db.collection('SOTAYKYTHUAT').findOne({ _id: new ObjectId(req.params.id) });
    if (!a) return res.status(404).json({ message: 'Không tìm thấy' });
    // tăng lượt xem
    await db.collection('SOTAYKYTHUAT').updateOne({ _id: new ObjectId(req.params.id) }, { $inc: { luotxem: 1 } });
    res.json(format(a));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* POST /api/handbook — tạo bài (admin) */
router.post('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { tieude, tomtat, noidung, danhmuc, hinhanh, video_url, video_thoigian, tacgia, tags, trangthai } = req.body;
    if (!tieude?.trim()) return res.status(400).json({ message: 'Tiêu đề không được để trống' });
    const doc = { tieude, tomtat, noidung, danhmuc, hinhanh, video_url, video_thoigian, tacgia, tags: tags || [], trangthai: trangthai || 'nhap', luotxem: 0, ngaytao: new Date(), ngaycapnhat: new Date() };
    const result = await db.collection('SOTAYKYTHUAT').insertOne(doc);
    res.status(201).json({ id: result.insertedId.toString(), message: 'Tạo bài viết thành công' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* PUT /api/handbook/:id — cập nhật */
router.put('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const { tieude, tomtat, noidung, danhmuc, hinhanh, video_url, video_thoigian, tacgia, tags, trangthai } = req.body;
    await db.collection('SOTAYKYTHUAT').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { tieude, tomtat, noidung, danhmuc, hinhanh, video_url, video_thoigian, tacgia, tags, trangthai, ngaycapnhat: new Date() } }
    );
    res.json({ message: 'Cập nhật thành công' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* DELETE /api/handbook/:id */
router.delete('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    await db.collection('SOTAYKYTHUAT').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Đã xóa bài viết' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
