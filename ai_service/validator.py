"""
validator.py — Kiểm tra chất lượng ảnh đầu vào trước khi đưa vào model.

Các tiêu chí:
  1. Định dạng file   (JPG / PNG)
  2. Kích thước file  (50KB – 10MB)
  3. Độ phân giải     (min 100×100, khuyến nghị ≥224×224)
  4. Độ mờ (blur)     — Laplacian variance
  5. Độ sáng          — HSV Value channel mean
  6. Độ tương phản    — std of grayscale
  7. Ánh sáng không đều (shadow) — so sánh 4 vùng
  8. Tỉ lệ khung hình — quá lệch dọc / ngang
"""

import io
import cv2
import numpy as np
from PIL import Image

# ─── Ngưỡng kiểm tra ──────────────────────────────────────────────────────────
ALLOWED_FORMATS      = {'jpg', 'jpeg', 'png'}
MAX_FILE_MB          = 10
MIN_FILE_KB          = 50           # < 50KB thường quá nén / lỗi
MIN_RESOLUTION       = 100         # px mỗi chiều
RECOMMEND_RESOLUTION = 224         # px mỗi chiều
BLUR_ERROR_THRESHOLD = 40          # Laplacian var < 40  → mờ nặng, từ chối
BLUR_WARN_THRESHOLD  = 100         # Laplacian var < 100 → hơi mờ, cảnh báo
DARK_THRESHOLD       = 40          # HSV-V mean < 40  → quá tối
BRIGHT_THRESHOLD     = 220         # HSV-V mean > 220 → quá sáng
CONTRAST_THRESHOLD   = 20          # std gray < 20    → ít tương phản
SHADOW_RATIO_WARN    = 0.45        # vùng sáng nhất / tối nhất < 0.45 → đổ bóng
MAX_ASPECT_RATIO     = 5.0         # w/h hoặc h/w > 5 → quá lệch


def validate_image(img_bytes: bytes, filename: str) -> dict:
    """
    Trả về dict:
      valid         : bool  — có thể đưa vào model không
      quality_score : int   — 0-100
      errors        : list  — lý do từ chối
      warnings      : list  — cảnh báo (vẫn xử lý được)
      details       : dict  — giá trị đo được
      tips          : list  — gợi ý cải thiện ảnh
    """
    errors, warnings, tips = [], [], []
    details = {}

    # ── 1. Định dạng ──────────────────────────────────────────────────────────
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    details['format'] = ext
    if ext not in ALLOWED_FORMATS:
        return _reject([f'Định dạng "{ext}" không được hỗ trợ. Chỉ dùng JPG hoặc PNG.'],
                       details)

    # ── 2. Kích thước file ────────────────────────────────────────────────────
    size_bytes = len(img_bytes)
    size_mb    = size_bytes / (1024 * 1024)
    details['file_size_mb'] = round(size_mb, 2)
    if size_mb > MAX_FILE_MB:
        errors.append(f'File quá lớn ({size_mb:.1f}MB). Tối đa {MAX_FILE_MB}MB.')
    elif size_bytes < MIN_FILE_KB * 1024:
        warnings.append(f'File rất nhỏ ({size_bytes/1024:.0f}KB), có thể bị nén quá mức.')
        tips.append('Dùng ảnh gốc từ camera thay vì ảnh đã nén.')

    # ── Đọc ảnh ───────────────────────────────────────────────────────────────
    try:
        pil_img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception:
        return _reject(['Không thể đọc file ảnh. File có thể bị hỏng.'], details)

    img_np  = np.array(pil_img)
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
    h, w    = img_bgr.shape[:2]
    details['width']  = w
    details['height'] = h

    # ── 3. Độ phân giải ───────────────────────────────────────────────────────
    if w < MIN_RESOLUTION or h < MIN_RESOLUTION:
        errors.append(
            f'Độ phân giải quá thấp ({w}×{h}px). Tối thiểu {MIN_RESOLUTION}×{MIN_RESOLUTION}px.'
        )
    elif w < RECOMMEND_RESOLUTION or h < RECOMMEND_RESOLUTION:
        warnings.append(
            f'Độ phân giải thấp ({w}×{h}px). Khuyến nghị ≥{RECOMMEND_RESOLUTION}×{RECOMMEND_RESOLUTION}px.'
        )
        tips.append('Chụp gần hơn hoặc dùng camera độ phân giải cao hơn.')

    # ── 4. Tỉ lệ khung hình ───────────────────────────────────────────────────
    aspect = max(w, h) / max(min(w, h), 1)
    details['aspect_ratio'] = round(aspect, 2)
    if aspect > MAX_ASPECT_RATIO:
        warnings.append(
            f'Tỉ lệ ảnh quá lệch ({w}×{h}). Nên chụp ảnh gần vuông hoặc 4:3.'
        )
        tips.append('Xoay ngang điện thoại để chụp ảnh cân đối hơn.')

    # ── Chuyển grayscale & HSV ────────────────────────────────────────────────
    gray    = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    hsv     = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    v_chan  = hsv[:, :, 2].astype(float)   # Value (độ sáng)
    s_chan  = hsv[:, :, 1].astype(float)   # Saturation

    # ── 5. Độ sáng ────────────────────────────────────────────────────────────
    brightness = float(v_chan.mean())
    details['brightness'] = round(brightness, 1)
    if brightness < DARK_THRESHOLD:
        errors.append(
            f'Ảnh quá tối (độ sáng {brightness:.0f}/255). '
            'Chụp ở nơi đủ ánh sáng hoặc bật đèn flash.'
        )
        tips.append('Chụp dưới ánh sáng tự nhiên hoặc đèn chiếu sáng tốt.')
    elif brightness > BRIGHT_THRESHOLD:
        warnings.append(
            f'Ảnh quá sáng (độ sáng {brightness:.0f}/255). '
            'Có thể mất chi tiết do phơi sáng quá mức.'
        )
        tips.append('Tránh chụp thẳng vào ánh đèn hoặc mặt trời.')

    # ── 6. Độ mờ (blur) — Laplacian variance ─────────────────────────────────
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    details['blur_score'] = round(blur_score, 1)
    if blur_score < BLUR_ERROR_THRESHOLD:
        errors.append(
            f'Ảnh quá mờ (điểm sắc nét: {blur_score:.0f}). '
            'Giữ máy thật ổn định và lấy nét trước khi chụp.'
        )
        tips.append('Chờ tôm đứng yên và nhấn nút chụp nhẹ nhàng.')
    elif blur_score < BLUR_WARN_THRESHOLD:
        warnings.append(
            f'Ảnh hơi mờ (điểm sắc nét: {blur_score:.0f}). '
            'Kết quả có thể kém chính xác hơn.'
        )
        tips.append('Thử chụp lại khi tôm ít chuyển động hơn.')

    # ── 7. Độ tương phản ──────────────────────────────────────────────────────
    contrast = float(gray.std())
    details['contrast'] = round(contrast, 1)
    if contrast < CONTRAST_THRESHOLD:
        warnings.append(
            f'Độ tương phản thấp ({contrast:.0f}). Ảnh có thể quá đồng đều màu.'
        )
        tips.append('Đảm bảo tôm nổi bật so với nền.')

    # ── 8. Ánh sáng không đều / đổ bóng ─────────────────────────────────────
    shadow_ratio = _shadow_ratio(v_chan)
    details['shadow_ratio'] = round(shadow_ratio, 3)
    if shadow_ratio < SHADOW_RATIO_WARN:
        warnings.append(
            'Ánh sáng không đều, có thể có bóng đổ trên ảnh. '
            'Ảnh hưởng đến độ chính xác phân tích.'
        )
        tips.append('Chiếu sáng đều từ nhiều phía, tránh nguồn sáng đơn chiều.')

    # ── Tính điểm chất lượng ──────────────────────────────────────────────────
    quality_score = _compute_quality(blur_score, brightness, contrast, shadow_ratio, w, h)
    details['quality_score'] = quality_score

    valid = len(errors) == 0
    return {
        'valid':         valid,
        'quality_score': quality_score,
        'errors':        errors,
        'warnings':      warnings,
        'tips':          list(dict.fromkeys(tips)),   # dedup, preserve order
        'details':       details,
    }


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _reject(errors: list, details: dict) -> dict:
    return {
        'valid': False, 'quality_score': 0,
        'errors': errors, 'warnings': [], 'tips': [], 'details': details,
    }


def _shadow_ratio(v_chan: np.ndarray) -> float:
    """So sánh độ sáng trung bình của 4 góc ảnh."""
    h, w  = v_chan.shape
    qh, qw = max(h // 3, 1), max(w // 3, 1)
    regions = [
        v_chan[:qh, :qw],
        v_chan[:qh, -qw:],
        v_chan[-qh:, :qw],
        v_chan[-qh:, -qw:],
    ]
    means  = [r.mean() for r in regions]
    mn, mx = min(means), max(means)
    return mn / mx if mx > 0 else 1.0


def _compute_quality(blur: float, brightness: float, contrast: float,
                     shadow: float, w: int, h: int) -> int:
    score = 100

    # Blur penalty
    if blur < BLUR_ERROR_THRESHOLD:
        score -= 50
    elif blur < BLUR_WARN_THRESHOLD:
        score -= 20
    elif blur < 200:
        score -= 5

    # Brightness penalty
    if brightness < DARK_THRESHOLD or brightness > BRIGHT_THRESHOLD:
        score -= 30
    elif brightness < 60 or brightness > 200:
        score -= 10

    # Contrast penalty
    if contrast < CONTRAST_THRESHOLD:
        score -= 15
    elif contrast < 35:
        score -= 5

    # Shadow penalty
    if shadow < SHADOW_RATIO_WARN:
        score -= 10
    elif shadow < 0.6:
        score -= 5

    # Resolution bonus/penalty
    min_dim = min(w, h)
    if min_dim < MIN_RESOLUTION:
        score -= 30
    elif min_dim < RECOMMEND_RESOLUTION:
        score -= 10

    return max(0, min(100, score))
