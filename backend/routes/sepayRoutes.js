/**
 * sepayRoutes.js — Tích hợp thanh toán SePay
 *
 * Flow:
 *   1. User chọn "Chuyển khoản (SePay)" → Frontend hiển thị QR code
 *   2. User quét QR và chuyển khoản → SePay gửi webhook đến server
 *   3. Server nhận webhook → cập nhật đơn hàng "đã thanh toán"
 *
 * Cấu hình SePay webhook:
 *   - URL: https://your-domain.com/api/sepay/webhook
 *   - Loại: Tiền vào
 *   - Định dạng: JSON
 */

const express  = require('express');
const mongoose = require('mongoose');
const { sendSms, msgPaymentSuccess } = require('../utils/sms');
const router   = express.Router();

// ─── POST /api/sepay/webhook — Nhận thông báo giao dịch từ SePay ─────────────
router.post('/webhook', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // SePay gửi data dạng JSON
    const {
      id,                    // ID giao dịch SePay
      gateway,               // Tên ngân hàng
      transactionDate,       // Ngày giao dịch
      accountNumber,         // Số tài khoản nhận
      subAccount,            // Sub account (nếu có)
      transferType,          // in / out
      transferAmount,        // Số tiền chuyển
      accumulated,           // Số dư tích lũy
      code,                  // Code (null hoặc string)
      content,               // Nội dung chuyển khoản
      referenceCode,         // Mã tham chiếu
      description,           // Mô tả
    } = req.body;

    console.log('[SEPAY] Webhook nhận:', JSON.stringify(req.body, null, 2));

    // Chỉ xử lý giao dịch tiền vào
    if (transferType === 'out') {
      console.log('[SEPAY] Bỏ qua giao dịch tiền ra');
      return res.json({ success: true });
    }

    // Tìm mã đơn hàng trong nội dung chuyển khoản
    // Ngân hàng hay xóa dấu "-" → cần match cả 2 dạng:
    //   AQUA-100626-9WJ6  (có dấu gạch, gốc)
    //   AQUA1006269WJ6    (không có dấu gạch, ngân hàng tự xóa)
    const contentUpper = (content || '').toUpperCase();
    const descUpper    = (description || '').toUpperCase();
    const searchText   = contentUpper + ' ' + descUpper;

    // Tìm cả 2 pattern
    const matchWithDash    = searchText.match(/AQUA-\d{6}-\w{3,6}/i);
    const matchWithoutDash = searchText.match(/AQUA(\d{6})(\w{3,6})/i);

    let mavandon = null;
    if (matchWithDash) {
      mavandon = matchWithDash[0].toUpperCase();
    } else if (matchWithoutDash) {
      // Khôi phục lại dạng có dấu gạch: AQUA-DDMMYY-XXXX
      mavandon = `AQUA-${matchWithoutDash[1]}-${matchWithoutDash[2]}`.toUpperCase();
    }
    console.log(`[SEPAY] Mã đơn tìm được: ${mavandon} (từ nội dung: "${content}")`);

    if (!mavandon) {
      console.log('[SEPAY] Không tìm thấy mã đơn hàng trong nội dung:', content);
      await db.collection('SEPAY_TRANSACTIONS').insertOne({
        sepay_id: id,
        gateway,
        transactionDate,
        accountNumber,
        transferAmount,
        content,
        description,
        referenceCode,
        matched: false,
        ngaytao: new Date(),
      });
      return res.json({ success: true });
    }

    // Tìm đơn hàng theo mã vận đơn (thử cả 2 field)
    const order = await db.collection('DONHANG').findOne({
      $or: [
        { mavandon },
        { ma_don_hang: mavandon },
      ]
    });

    if (!order) {
      console.log(`[SEPAY] Không tìm thấy đơn hàng: ${mavandon}`);
      await db.collection('SEPAY_TRANSACTIONS').insertOne({
        sepay_id: id,
        gateway,
        transferAmount,
        content,
        mavandon,
        matched: false,
        ngaytao: new Date(),
      });
      return res.json({ success: true });
    }

    // Kiểm tra số tiền khớp (cho phép chênh lệch 1000đ)
    const expectedAmount = order.tong_tien_thanh_toan || order.tong_tien || 0;
    const paidAmount     = Number(transferAmount) || 0;
    const amountMatch    = paidAmount >= (expectedAmount - 1000);

    if (!amountMatch) {
      console.log(`[SEPAY] Số tiền không khớp: nhận ${paidAmount}, cần ${expectedAmount}`);
    }

    // Cập nhật trạng thái đơn hàng
    const now = new Date();
    await db.collection('DONHANG').updateOne(
      { _id: order._id },
      {
        $set: {
          trang_thai_thanh_toan: amountMatch ? 'da_thanh_toan' : 'thanh_toan_thieu',
          sepay_transaction_id:  id,
          sepay_amount:          paidAmount,
          sepay_gateway:         gateway,
          sepay_reference:       referenceCode,
          sepay_paid_at:         transactionDate || now,
          capnhat:               now,
        },
        $push: {
          lich_su_trang_thai: {
            trang_thai: 'da_thanh_toan',
            thoi_gian:  now,
            ghi_chu:    `Thanh toán qua ${gateway}: ${paidAmount.toLocaleString('vi-VN')}đ (SePay #${id})`,
          },
        },
      },
    );

    // Lưu log giao dịch
    await db.collection('SEPAY_TRANSACTIONS').insertOne({
      sepay_id: id,
      gateway,
      transactionDate,
      accountNumber,
      transferAmount: paidAmount,
      content,
      description,
      referenceCode,
      mavandon,
      order_id:     order._id.toString(),
      amountMatch,
      matched:      true,
      ngaytao:      new Date(),
    });

    console.log(`[SEPAY] ✅ Đơn ${mavandon} đã thanh toán ${paidAmount.toLocaleString('vi-VN')}đ qua ${gateway}`);

    // Gửi SMS xác nhận thanh toán thành công
    const phone = order.so_dien_thoai
      || order.thong_tin_nhan_hang?.so_dien_thoai
      || order.thong_tin_nhan_hang?.sodienthoai;
    if (phone) {
      sendSms(phone, msgPaymentSuccess({
        maDon: mavandon,
        tongTien: paidAmount,
      })).catch(err => console.error('[SEPAY SMS error]', err.message));
    }

    // SePay yêu cầu trả về status 200
    res.json({ success: true });
  } catch (err) {
    console.error('[SEPAY] Lỗi webhook:', err);
    // Vẫn trả 200 để SePay không retry liên tục
    res.json({ success: true });
  }
});

// ─── GET /api/sepay/check/:mavandon — Frontend kiểm tra trạng thái thanh toán ──
router.get('/check/:mavandon', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const order = await db.collection('DONHANG').findOne({
      $or: [
        { mavandon: req.params.mavandon.toUpperCase() },
        { ma_don_hang: req.params.mavandon.toUpperCase() },
      ]
    });

    if (!order) return res.status(404).json({ paid: false, message: 'Không tìm thấy đơn hàng' });

    res.json({
      paid:     order.trang_thai_thanh_toan === 'da_thanh_toan',
      status:   order.trang_thai_thanh_toan,
      amount:   order.sepay_amount || 0,
      gateway:  order.sepay_gateway || '',
      paid_at:  order.sepay_paid_at || null,
    });
  } catch (err) {
    res.status(500).json({ paid: false, message: err.message });
  }
});

module.exports = router;
