const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/banthuoc', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const db = mongoose.connection.db;
  const products = await db.collection('SANPHAM').find().sort({ _id: -1 }).limit(3).toArray();
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
