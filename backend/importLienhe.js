require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs'), path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/BANTHUOC.LIENHE.json'), 'utf8'));

const docs = raw.map(d => ({
  ...d,
  _id: new ObjectId(d._id.$oid),
  nguoidung_id: new ObjectId(d.nguoidung_id.$oid),
  ngaytao: new Date(d.ngaytao.$date),
  tin_nhan: (d.tin_nhan || []).map(m => ({ ...m, thoigian: new Date(m.thoigian.$date) })),
}));

(async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const col = client.db().collection('LIENHE');
  await col.drop().catch(() => {});
  await col.insertMany(docs);
  console.log(`✅ Re-import ${docs.length} bản ghi LIENHE với tin nhắn`);
  await client.close();
})().catch(console.error);
