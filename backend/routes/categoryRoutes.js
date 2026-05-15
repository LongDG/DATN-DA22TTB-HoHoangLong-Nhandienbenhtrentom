const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');

function fmt(c) {
  return {
    id:       c._id.toString(),
    key:      c.key,
    label:    c.tensanpham || c.label,
    color:    c.color || 'bg-slate-500 text-white',
    icon:     c.icon || 'Package',
    order:    c.thutu || 0,
    active:   c.active !== false,
    count:    c.count || 0,
  };
}

/* GET /api/categories — danh sách */
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const cats = await db.collection('DANHMUC').find({}).sort({ thutu: 1 }).toArray();
    
    // Nếu chưa có data thì seed mặc định
    if (cats.length === 0) {
      const defaults = [
        { key: 'dac_tri',             tensanpham: 'Đặc trị bệnh',  color: 'bg-red-600 text-white',     icon: 'Droplet',  thutu: 1, active: true },
        { key: 'vi_sinh',             tensanpham: 'Vi sinh',        color: 'bg-[#0077b6] text-white',   icon: 'Beaker',   thutu: 2, active: true },
        { key: 'vi_sinh_moi_truong',  tensanpham: 'Vi sinh MT',     color: 'bg-green-700 text-white',   icon: 'Leaf',     thutu: 3, active: true },
        { key: 'dinh_duong_de_khang', tensanpham: 'Dinh dưỡng',    color: 'bg-amber-600 text-white',   icon: 'Heart',    thutu: 4, active: true },
      ];
      await db.collection('DANHMUC').insertMany(defaults);
      return res.json(defaults.map((c, i) => ({ ...fmt(c), id: String(i) })));
    }
    res.json(cats.map(fmt));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* POST /api/categories — tạo mới */
router.post('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { key, label, color, icon, order } = req.body;
    if (!key?.trim() || !label?.trim()) return res.status(400).json({ message: 'Key và Tên là bắt buộc' });
    
    // Check key trùng
    const exists = await db.collection('DANHMUC').findOne({ key: key.trim() });
    if (exists) return res.status(409).json({ message: `Key "${key}" đã tồn tại` });

    const doc = { key: key.trim(), tensanpham: label.trim(), color: color || 'bg-slate-500 text-white', icon: icon || 'Package', thutu: parseInt(order) || 99, active: true, ngaytao: new Date() };
    const result = await db.collection('DANHMUC').insertOne(doc);
    res.status(201).json({ id: result.insertedId.toString(), message: 'Tạo danh mục thành công' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* PUT /api/categories/:id — cập nhật */
router.put('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });
    const { label, color, icon, order, active } = req.body;
    await db.collection('DANHMUC').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { tensanpham: label, color, icon, thutu: parseInt(order) || 0, active, ngaycapnhat: new Date() } }
    );
    res.json({ message: 'Cập nhật thành công' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

/* DELETE /api/categories/:id */
router.delete('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID không hợp lệ' });

    // Kiểm tra còn sản phẩm dùng danh mục này không
    const cat = await db.collection('DANHMUC').findOne({ _id: new ObjectId(req.params.id) });
    if (cat) {
      const count = await db.collection('SANPHAM').countDocuments({ loaisanpham: cat.key });
      if (count > 0) return res.status(400).json({ message: `Không thể xóa! Còn ${count} sản phẩm trong danh mục này.` });
    }
    await db.collection('DANHMUC').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Đã xóa danh mục' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
