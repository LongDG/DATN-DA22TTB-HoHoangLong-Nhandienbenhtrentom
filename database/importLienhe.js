/**
 * Script import LIENHE.json vào MongoDB
 * Chạy: node g:/KLTN/database/importLienhe.js
 */
require('dotenv').config({ path: 'g:/KLTN/backend/.env' });
const { MongoClient } = require('mongodb');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('g:/KLTN/database/BANTHUOC.LIENHE.json', 'utf8'));
const { ObjectId } = require('mongodb');

// Chuyển $oid string → ObjectId thật
function parseDoc(doc) {
  const out = { ...doc };
  if (out._id?.$oid) out._id = new ObjectId(out._id.$oid);
  if (out.nguoidung_id?.$oid) out.nguoidung_id = new ObjectId(out.nguoidung_id.$oid);
  if (out.ngaytao?.$date) out.ngaytao = new Date(out.ngaytao.$date);
  return out;
}

async function run() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('BANTHUOC');
  const col = db.collection('LIENHE');

  await col.drop().catch(() => {}); // xóa nếu tồn tại
  const docs = data.map(parseDoc);
  await col.insertMany(docs);
  console.log(`✅ Đã import ${docs.length} bản ghi vào collection LIENHE`);
  await client.close();
}

run().catch(console.error);
