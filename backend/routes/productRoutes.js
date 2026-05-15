const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const CATEGORY_LABELS = {
  dac_tri:               'Đặc trị',
  vi_sinh:               'Vi sinh',
  vi_sinh_moi_truong:    'Vi sinh MT',
  dinh_duong_de_khang:   'Dinh dưỡng',
};

// Tag colors cho mỗi loại
const TAG_COLORS = {
  dac_tri:               'bg-red-600',
  vi_sinh:               'bg-[#005d90]',
  vi_sinh_moi_truong:    'bg-green-700',
  dinh_duong_de_khang:   'bg-amber-600',
};

/**
 * GET /api/products
 * Lấy danh sách sản phẩm (public)
 * Query: category, search, sort (newest|price_asc|price_desc|popular), page, limit
 */
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { category, search, sort = 'newest', page = 1, limit = 9 } = req.query;

    const filter = {};
    if (category && category !== 'all') filter.loaisanpham = category;
    if (search) {
      filter.$or = [
        { tensanpham: { $regex: search, $options: 'i' } },
        { thuonghieu: { $regex: search, $options: 'i' } },
        { mota: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await db.collection('SANPHAM').countDocuments(filter);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortOpt = { ngaytao: -1 };
    if (sort === 'price_asc')  sortOpt = { gia: 1 };
    if (sort === 'price_desc') sortOpt = { gia: -1 };
    if (sort === 'popular')    sortOpt = { daban: -1 };

    const products = await db.collection('SANPHAM')
      .find(filter)
      .sort(sortOpt)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const formatted = products.map(p => {
      const qty = p.soluong ?? 0;
      const status = qty === 0 ? 'het_hang' : qty <= 15 ? 'sap_het' : 'con_hang';
      return {
        id:         p._id.toString(),
        name:       p.tensanpham || 'Sản phẩm',
        description: p.mota || p.thanhphan || 'Sản phẩm chất lượng cao',
        price:      p.gia || 0,
        priceLabel: p.gia ? p.gia.toLocaleString('vi-VN') + 'đ' : 'Liên hệ',
        brand:      p.thuonghieu || '',
        category:   p.loaisanpham,
        categoryLabel: CATEGORY_LABELS[p.loaisanpham] || p.loaisanpham,
        tagColor:   TAG_COLORS[p.loaisanpham] || 'bg-[#005d90]',
        image:      (p.hinhanh && p.hinhanh[0]) || null,
        sold:       p.daban || 0,
        status,
        qty,
        unit:       p.donvi || 'gói',
      };
    });

    // Đếm theo từng danh mục
    const categoryCounts = await db.collection('SANPHAM').aggregate([
      { $group: { _id: '$loaisanpham', count: { $sum: 1 } } }
    ]).toArray();

    res.json({
      products: formatted,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      categoryCounts: categoryCounts.reduce((acc, c) => {
        acc[c._id] = c.count; return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Lỗi lấy sản phẩm:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

/**
 * GET /api/products/featured
 * Lấy 4 sản phẩm nổi bật (bán nhiều nhất)
 */
router.get('/featured', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const products = await db.collection('SANPHAM')
      .find({ soluong: { $gt: 0 } })
      .sort({ daban: -1 })
      .limit(4)
      .toArray();

    const formatted = products.map(p => ({
      id:          p._id.toString(),
      name:        p.tensanpham || 'Sản phẩm',
      description: p.mota || p.thanhphan || 'Sản phẩm chất lượng cao',
      price:       p.gia || 0,
      priceLabel:  p.gia ? p.gia.toLocaleString('vi-VN') + 'đ' : 'Liên hệ',
      brand:       p.thuonghieu || '',
      category:    p.loaisanpham,
      categoryLabel: CATEGORY_LABELS[p.loaisanpham] || p.loaisanpham,
      tagColor:    TAG_COLORS[p.loaisanpham] || 'bg-[#005d90]',
      image:       (p.hinhanh && p.hinhanh[0]) || null,
      sold:        p.daban || 0,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

/**
 * GET /api/products/:id
 * Chi tiết một sản phẩm
 */
router.get('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');
    const { id } = req.params;

    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'ID không hợp lệ' });

    const p = await db.collection('SANPHAM').findOne({ _id: new ObjectId(id) });
    if (!p) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const qty = p.soluong ?? 0;
    const status = qty === 0 ? 'het_hang' : qty <= 15 ? 'sap_het' : 'con_hang';

    res.json({
      id:           p._id.toString(),
      name:         p.tensanpham || 'Sản phẩm',
      brand:        p.thuonghieu || '',
      category:     p.loaisanpham,
      categoryLabel: CATEGORY_LABELS[p.loaisanpham] || p.loaisanpham,
      tagColor:     TAG_COLORS[p.loaisanpham] || 'bg-[#005d90]',
      description:  p.mota || '',
      uses:         p.congdung || [],
      dosage:       p.lieudung || {},
      origin:       p.goc_thuoc || '',
      purpose:      p.muc_dich_su_dung || [],
      price:        p.gia || 0,
      priceLabel:   p.gia ? p.gia.toLocaleString('vi-VN') + 'đ' : 'Liên hệ',
      qty,
      unit:         p.donvi || 'gói',
      sold:         p.daban || 0,
      status,
      images:       p.hinhanh || [],
      createdAt:    p.ngaytao,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

module.exports = router;
