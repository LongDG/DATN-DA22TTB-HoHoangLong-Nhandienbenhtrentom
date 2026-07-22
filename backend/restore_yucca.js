const mongoose = require('mongoose');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/thuy-san-kltn').then(async () => {
  const db = mongoose.connection.db;
  const p = await db.collection('SANPHAM').findOne({ tensanpham: /Yucca Zeo/i });
  if (p) {
    const sanphamSeed = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/BANTHUOC.SANPHAM.json'), 'utf8'));
    const seed = sanphamSeed.find(s => s.tensanpham.includes('Yucca Zeo'));
    
    if (seed) {
      const { ObjectId } = mongoose.Types;
      const benh_ids = seed.benh_ids.map(b => new ObjectId(b.$oid));
      
      await db.collection('SANPHAM').updateOne(
        { _id: p._id },
        {
          $set: {
            mota: seed.mota,
            congdung: seed.congdung,
            lieudung: seed.lieudung,
            goc_thuoc: seed.goc_thuoc,
            benh_ids: benh_ids,
            hinhanh: seed.hinhanh // khôi phục lại hình ảnh chuẩn
          }
        }
      );
      console.log('Restored Yucca Zeo data');
    }
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
