/**
 * SMS Utility — TextBee.dev
 * Docs: https://textbee.dev/docs
 *
 * TextBee dùng điện thoại Android làm gateway gửi SMS thật
 * API Key  : process.env.TEXTBEE_API_KEY
 * Device ID: process.env.TEXTBEE_DEVICE_ID
 */

const TEXTBEE_API = 'https://api.textbee.dev/api/v1/gateway/devices';

/**
 * Chuẩn hóa số điện thoại Việt Nam sang dạng +84xxxxxxxxx
 * VD: "0383277120" → "+84383277120"
 */
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84'))  return '+' + digits;
  if (digits.startsWith('0'))   return '+84' + digits.slice(1);
  return '+84' + digits;
}

/**
 * Gửi SMS qua TextBee
 * @param {string} to       - Số điện thoại nhận (VD: "0383277120")
 * @param {string} message  - Nội dung tin nhắn
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function sendSms(to, message) {
  const apiKey  = process.env.TEXTBEE_API_KEY;
  const deviceId = process.env.TEXTBEE_DEVICE_ID;

  // Nếu chưa cấu hình: in ra console để test
  if (!apiKey || !deviceId) {
    console.log(`[SMS - DEV] Tới: ${to}\nNội dung: ${message}`);
    return { ok: true, dev: true };
  }

  try {
    const normalized = normalizePhone(to);
    const resp = await fetch(`${TEXTBEE_API}/${deviceId}/send-sms`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: [normalized],
        message,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('[SMS] TextBee lỗi:', data);
      return { ok: false, error: data?.message || 'Lỗi gửi SMS' };
    }
    console.log(`[SMS] Đã gửi tới ${normalized}`);
    return { ok: true, data };
  } catch (err) {
    console.error('[SMS] Ngoại lệ:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Template: OTP quên mật khẩu
 */
function msgOtp(otp) {
  return `[AquaHealth] Ma xac nhan cua ban la: ${otp}\nCo hieu luc trong 5 phut. Tuyet doi khong chia se ma nay voi bat ky ai.`;
}

/**
 * Template: Xác nhận đơn hàng đã giao thành công
 */
function msgOrderDelivered({ maDon, hoTen, tongTien, sanPhamDau }) {
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
  return (
    `[AquaHealth] Don hang ${maDon} cua quy khach ${hoTen} da duoc giao thanh cong!\n` +
    `San pham: ${sanPhamDau}...\n` +
    `Tong thanh toan: ${fmt(tongTien)}d\n` +
    `Cam on quy khach da tin tuong AquaHealth. Lien he 0383277120 neu can ho tro.`
  );
}

/**
 * Template: Xác nhận thanh toán thành công
 */
function msgPaymentSuccess({ maDon, tongTien }) {
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
  return `[AquaHealth] Xac nhan da nhan thanh toan ${fmt(tongTien)}d cho don hang ${maDon}. Chung toi se tien hanh giao hang som nhat.`;
}

module.exports = { sendSms, msgOtp, msgOrderDelivered, msgPaymentSuccess };
