"""
app.py — Flask AI service — EfficientNet-B3 (custom classifier) nhận diện bệnh tôm.

Cải tiến v4:
  - Ensemble 3 models (v1, v2, v3) → trung bình xác suất → chính xác hơn
  - Smart preprocessing: loại bỏ nền, tăng cường contrast
  - Confidence threshold: cảnh báo khi model không chắc chắn
  - TTA ×8 cho mỗi model

Classes: ['BlackGill', 'Healthy', 'WSSV', 'Yellowhead']
Classifier: Dropout(0.4) → Linear(1536,512) → SiLU → Dropout(0.3) → Linear(512,4)
Image size: 224×224
"""

import os, io, time, logging
import numpy as np
import cv2
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image, ImageEnhance, ImageFilter
from flask import Flask, request, jsonify
from flask_cors import CORS
from validator import validate_image

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s [%(levelname)s] %(message)s')
log = logging.getLogger(__name__)

# ─── Cấu hình ────────────────────────────────────────────────────────────────
MODEL_DIR = os.environ.get(
    'MODEL_DIR',
    os.path.join(os.path.dirname(__file__), '..', 'model_ai')
)

# 3 model files để ensemble
MODEL_FILES = [
    'best_model.pth',
    'best_model_v2.pth',
    'best_model_v3.pth',
]

AI_PORT  = int(os.environ.get('AI_PORT', 5001))
DEVICE   = 'cuda' if torch.cuda.is_available() else 'cpu'
IMG_SIZE = 224   # kích thước chuẩn khi training

# Confidence thresholds
CONFIDENCE_HIGH   = 70.0   # >= 70%: chẩn đoán tin cậy
CONFIDENCE_MEDIUM = 50.0   # 50-70%: cần xem xét thêm
# < 50%: không chắc chắn

# ─── 4 Class đúng theo thứ tự training ───────────────────────────────────────
DISEASE_CLASSES = [
    {   # index 0 → BlackGill
        'code': 'mang_den',
        'name': 'Bệnh mang đen (BlackGill)',
        'name_en': 'Black Gill Disease',
        'severity': 'high',
        'color': '#333333',
        'description': (
            'Bệnh mang đen do vi khuẩn, ký sinh trùng hoặc tảo bám vào mang tôm, '
            'làm mang chuyển màu đen/nâu tối, tôm giảm hô hấp và chết dần.'
        ),
        'recommendation': (
            '1. Cải thiện chất lượng nước, tăng cường sục khí.\n'
            '2. Giảm mật độ tảo và hữu cơ trong ao.\n'
            '3. Dùng thuốc xử lý mang theo chỉ định chuyên gia thủy sản.\n'
            '4. Kiểm tra và xử lý đáy ao, giảm khí độc (H₂S, NH₃).\n'
            '5. Tăng tần suất thay nước 10–20%/ngày.'
        ),
        'products': ['diatomite', 'zeolite', 'vi sinh xử lý đáy', 'thuốc xử lý mang'],
    },
    {   # index 1 → Healthy
        'code': 'khoe_manh',
        'name': 'Khỏe mạnh',
        'name_en': 'Healthy',
        'severity': 'none',
        'color': '#2c694e',
        'description': 'Tôm khỏe mạnh, không phát hiện dấu hiệu bệnh lý.',
        'recommendation': (
            'Tiếp tục duy trì chế độ chăm sóc và theo dõi hiện tại.\n'
            'Kiểm tra chất lượng nước (pH 7.8–8.2, DO ≥ 5 mg/L) định kỳ.\n'
            'Bổ sung Vitamin C và khoáng chất để tăng sức đề kháng.'
        ),
        'products': ['Vitamin C', 'khoáng tổng hợp', 'men vi sinh'],
    },
    {   # index 2 → WSSV
        'code': 'dom_trang',
        'name': 'Bệnh đốm trắng (WSSV)',
        'name_en': 'White Spot Syndrome Virus',
        'severity': 'critical',
        'color': '#ba1a1a',
        'description': (
            'White Spot Syndrome Virus — virus gây đốm trắng trên vỏ tôm, '
            'lây lan cực nhanh, tỷ lệ chết có thể đạt 100% trong 3–10 ngày.'
        ),
        'recommendation': (
            '1. Cách ly ao ngay lập tức, hạn chế người và thiết bị ra vào.\n'
            '2. Giảm cho ăn 50–70%, dừng nếu tôm bỏ ăn.\n'
            '3. Tăng cường sục khí, duy trì DO ≥ 5 mg/L.\n'
            '4. Xử lý ao bằng Iodine hoặc BKC theo liều khuyến cáo.\n'
            '5. Bổ sung Vitamin C liều cao và Beta-glucan tăng miễn dịch.\n'
            '6. Liên hệ ngay chuyên gia thủy sản.'
        ),
        'products': ['Iodine', 'BKC', 'Vitamin C liều cao', 'Beta-glucan'],
    },
    {   # index 3 → Yellowhead
        'code': 'dau_vang',
        'name': 'Bệnh đầu vàng (Yellowhead)',
        'name_en': 'Yellowhead Disease',
        'severity': 'critical',
        'color': '#b65600',
        'description': (
            'Yellowhead disease do Okavirus gây ra, làm gan tụy và đầu tôm chuyển vàng, '
            'tôm chết hàng loạt trong 3–5 ngày kể từ khi xuất hiện triệu chứng.'
        ),
        'recommendation': (
            '1. Cách ly và thu hoạch khẩn cấp nếu có thể.\n'
            '2. Tiêu hủy tôm chết đúng cách, không xả nước ao ra môi trường.\n'
            '3. Tăng cường quạt nước, duy trì oxy hòa tan cao.\n'
            '4. Dùng chế phẩm tăng cường miễn dịch và hỗ trợ gan tụy.\n'
            '5. Sát trùng toàn bộ ao và dụng cụ sau vụ nuôi bằng Chlorine.'
        ),
        'products': ['Chlorine', 'vôi bột', 'hỗ trợ gan tụy', 'tăng cường miễn dịch'],
    },
]

# ─── Smart Preprocessing ────────────────────────────────────────────────────
def smart_preprocess(pil_img: Image.Image) -> Image.Image:
    """
    Tiền xử lý thông minh:
      1. Loại bỏ nền (giữ vùng tôm) bằng GrabCut
      2. Tăng cường contrast & sharpness
      3. Cân bằng sáng (CLAHE)
    """
    img_np = np.array(pil_img)
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
    h, w = img_bgr.shape[:2]

    # --- 1. GrabCut để tách vùng chủ thể (tôm) ---
    try:
        mask = np.zeros((h, w), np.uint8)
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)
        # ROI: bỏ 5% viền mỗi cạnh
        margin_x = max(int(w * 0.05), 5)
        margin_y = max(int(h * 0.05), 5)
        rect = (margin_x, margin_y, w - 2 * margin_x, h - 2 * margin_y)
        cv2.grabCut(img_bgr, mask, rect, bgd_model, fgd_model, 3, cv2.GC_INIT_WITH_RECT)
        fg_mask = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype('uint8')

        # Nếu foreground quá nhỏ (< 10%), bỏ qua grabcut
        fg_ratio = fg_mask.sum() / (255.0 * h * w)
        if fg_ratio > 0.10:
            # Tìm bounding box chủ thể và crop
            coords = cv2.findNonZero(fg_mask)
            if coords is not None:
                x, y, bw, bh = cv2.boundingRect(coords)
                # Thêm padding 10%
                pad = int(max(bw, bh) * 0.10)
                x1 = max(0, x - pad)
                y1 = max(0, y - pad)
                x2 = min(w, x + bw + pad)
                y2 = min(h, y + bh + pad)
                img_bgr = img_bgr[y1:y2, x1:x2]
    except Exception:
        pass  # Nếu GrabCut fail, giữ ảnh gốc

    # --- 2. CLAHE (Contrast Limited Adaptive Histogram Equalization) ---
    try:
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        lab = cv2.merge([l, a, b])
        img_bgr = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    except Exception:
        pass

    # Chuyển lại PIL
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_out = Image.fromarray(img_rgb)

    # --- 3. Tăng sharpness nhẹ ---
    try:
        enhancer = ImageEnhance.Sharpness(pil_out)
        pil_out = enhancer.enhance(1.3)
    except Exception:
        pass

    return pil_out


# ─── Transform ảnh (đúng như lúc training + TTA) ────────────────────────────
# 8 TTA transforms đúng theo code training (predict_tta)
_TTA_TRANSFORMS = [
    # 1. Ảnh gốc
    transforms.Compose([transforms.Resize((IMG_SIZE, IMG_SIZE)),
                        transforms.ToTensor(),
                        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])]),
    # 2. Flip ngang
    transforms.Compose([transforms.Resize((IMG_SIZE, IMG_SIZE)),
                        transforms.RandomHorizontalFlip(p=1.0),
                        transforms.ToTensor(),
                        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])]),
    # 3. Flip dọc
    transforms.Compose([transforms.Resize((IMG_SIZE, IMG_SIZE)),
                        transforms.RandomVerticalFlip(p=1.0),
                        transforms.ToTensor(),
                        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])]),
    # 4. Xoay 90°
    transforms.Compose([transforms.Resize((IMG_SIZE, IMG_SIZE)),
                        transforms.RandomRotation((90, 90)),
                        transforms.ToTensor(),
                        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])]),
    # 5. Xoay 180°
    transforms.Compose([transforms.Resize((IMG_SIZE, IMG_SIZE)),
                        transforms.RandomRotation((180, 180)),
                        transforms.ToTensor(),
                        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])]),
    # 6. Center crop
    transforms.Compose([transforms.Resize((256, 256)),
                        transforms.CenterCrop(IMG_SIZE),
                        transforms.ToTensor(),
                        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])]),
    # 7. Brightness nhẹ
    transforms.Compose([transforms.Resize((IMG_SIZE, IMG_SIZE)),
                        transforms.ColorJitter(brightness=0.15),
                        transforms.ToTensor(),
                        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])]),
    # 8. Flip ngang + xoay 90°
    transforms.Compose([transforms.Resize((IMG_SIZE, IMG_SIZE)),
                        transforms.RandomHorizontalFlip(p=1.0),
                        transforms.RandomRotation((90, 90)),
                        transforms.ToTensor(),
                        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])]),
]

# ─── Build model đúng kiến trúc training ────────────────────────────────────
def _build_model_arch() -> nn.Module:
    """
    Đúng kiến trúc từ code training:
      model.classifier = nn.Sequential(
          nn.Dropout(p=0.4),
          nn.Linear(in_features, 512),
          nn.SiLU(),
          nn.Dropout(p=0.3),
          nn.Linear(512, 4),
      )
    """
    m = models.efficientnet_b3(weights=None)
    in_features = m.classifier[1].in_features  # 1536
    m.classifier = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(in_features, 512),
        nn.SiLU(),
        nn.Dropout(p=0.3),
        nn.Linear(512, len(DISEASE_CLASSES)),   # 4
    )
    return m

# ─── Load ENSEMBLE models ────────────────────────────────────────────────────
_models    = []      # list of loaded models
_model_ver = 'unknown'

def load_model_once():
    global _models, _model_ver

    if _models:
        return

    loaded_names = []
    for fname in MODEL_FILES:
        path = os.path.abspath(os.path.join(MODEL_DIR, fname))
        if not os.path.exists(path):
            log.warning(f'Model không tồn tại, bỏ qua: {path}')
            continue

        log.info(f'Đang load model: {path}  device={DEVICE}')
        ckpt = torch.load(path, map_location=DEVICE, weights_only=False)

        # Lấy state_dict từ key 'model_state' (theo code training)
        if isinstance(ckpt, dict) and 'model_state' in ckpt:
            state_dict = ckpt['model_state']
            log.info(f'  epoch={ckpt.get("epoch","?")}  '
                     f'val_acc={ckpt.get("val_acc",0)*100:.2f}%  '
                     f'retrain_v={ckpt.get("retrain_v","?")}')
        elif isinstance(ckpt, dict):
            state_dict = ckpt.get('model_state_dict') or ckpt.get('state_dict') or ckpt
        else:
            state_dict = ckpt

        m = _build_model_arch()
        missing, unexpected = m.load_state_dict(state_dict, strict=True)
        if missing:
            log.warning(f'  Missing keys: {missing}')
        if unexpected:
            log.warning(f'  Unexpected keys: {unexpected}')

        m.eval()
        m.to(DEVICE)
        _models.append(m)
        loaded_names.append(fname)
        log.info(f'✅ Loaded: {fname}')

    if not _models:
        raise FileNotFoundError(f'Không tìm thấy model nào trong {MODEL_DIR}')

    _model_ver = f'ensemble({",".join(loaded_names)})'
    log.info(f'✅ ENSEMBLE {len(_models)} models sẵn sàng — '
             f'{len(DISEASE_CLASSES)} classes  device={DEVICE}')
    log.info(f'   Classes: {[d["name"] for d in DISEASE_CLASSES]}')


# ─── Dự đoán: Ensemble + TTA + Smart Preprocessing ──────────────────────────
@torch.no_grad()
def predict(img_bytes: bytes) -> dict:
    pil_img = Image.open(io.BytesIO(img_bytes)).convert('RGB')

    # Smart preprocess
    pil_processed = smart_preprocess(pil_img)

    t0 = time.perf_counter()

    # Chạy TTA ×8 trên MỖI model, rồi trung bình tất cả
    all_probs_list = []

    for model in _models:
        for tf in _TTA_TRANSFORMS:
            tensor = tf(pil_processed).unsqueeze(0).to(DEVICE)
            probs  = torch.softmax(model(tensor), dim=1).cpu().numpy()[0]
            all_probs_list.append(probs)

    # Trung bình xác suất của tất cả (N_models × 8_TTA)
    avg     = np.mean(all_probs_list, axis=0)
    top_idx = int(np.argmax(avg))
    conf    = float(avg[top_idx]) * 100
    ms      = (time.perf_counter() - t0) * 1000

    # Tính độ lệch chuẩn giữa các model (đo mức đồng thuận)
    if len(_models) > 1:
        # Nhóm probs theo từng model
        per_model_avg = []
        n_tta = len(_TTA_TRANSFORMS)
        for i in range(len(_models)):
            model_probs = all_probs_list[i * n_tta : (i + 1) * n_tta]
            per_model_avg.append(np.mean(model_probs, axis=0))
        model_std = float(np.mean(np.std(per_model_avg, axis=0)))
        agreement = max(0.0, 1.0 - model_std * 5)  # 0-1, 1 = perfect agreement
    else:
        agreement = 1.0

    # Xác định mức tin cậy
    if conf >= CONFIDENCE_HIGH:
        confidence_level = 'high'
        confidence_label = 'Tin cậy cao'
    elif conf >= CONFIDENCE_MEDIUM:
        confidence_level = 'medium'
        confidence_label = 'Cần xem xét thêm'
    else:
        confidence_level = 'low'
        confidence_label = 'Không chắc chắn — nên tham vấn chuyên gia'

    disease   = DISEASE_CLASSES[top_idx].copy()
    all_probs = [
        {'name': DISEASE_CLASSES[i]['name'], 'prob': round(float(p) * 100, 2)}
        for i, p in enumerate(avg)
    ]

    # Sắp xếp all_probs theo xác suất giảm dần
    all_probs_sorted = sorted(all_probs, key=lambda x: x['prob'], reverse=True)

    # Top-2 gap: nếu top1 - top2 quá nhỏ → model phân vân
    sorted_probs = sorted(avg, reverse=True)
    top2_gap = (sorted_probs[0] - sorted_probs[1]) * 100 if len(sorted_probs) > 1 else 100.0

    return {
        'disease_index':    top_idx,
        'disease':          disease,
        'confidence':       round(conf, 2),
        'confidence_level': confidence_level,
        'confidence_label': confidence_label,
        'all_probs':        all_probs_sorted,
        'inference_ms':     round(ms, 1),
        'model_version':    _model_ver,
        'tta_count':        len(_TTA_TRANSFORMS),
        'ensemble_count':   len(_models),
        'model_agreement':  round(agreement * 100, 1),
        'top2_gap':         round(top2_gap, 2),
    }

# ─── Flask App ───────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    ready = len(_models) > 0
    return jsonify({
        'status':        'ok' if ready else 'loading',
        'model_loaded':  ready,
        'model_version': _model_ver,
        'num_models':    len(_models),
        'num_classes':   len(DISEASE_CLASSES),
        'classes':       [d['name'] for d in DISEASE_CLASSES],
        'device':        DEVICE,
    }), 200 if ready else 503

@app.route('/classes', methods=['GET'])
def classes_endpoint():
    return jsonify({'classes': DISEASE_CLASSES})

@app.route('/predict', methods=['POST'])
def predict_endpoint():
    if 'image' not in request.files:
        return jsonify({'error': 'Thiếu trường "image".'}), 400

    file      = request.files['image']
    filename  = file.filename or 'upload.jpg'
    img_bytes = file.read()

    # ── Kiểm tra chất lượng ảnh ──────────────────────────────────────────────
    validation = validate_image(img_bytes, filename)
    if not validation['valid']:
        return jsonify({'ok': False, 'stage': 'validation',
                        'validation': validation}), 422

    if not _models:
        return jsonify({'error': 'Model chưa sẵn sàng, thử lại sau.'}), 503

    try:
        result = predict(img_bytes)
    except Exception as e:
        log.exception('Lỗi predict')
        return jsonify({'error': f'Lỗi dự đoán: {e}'}), 500

    return jsonify({'ok': True, 'validation': validation, 'result': result})

# ─── Khởi động ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    try:
        load_model_once()
    except Exception as e:
        log.error(f'[FATAL] Không load được model: {e}')
    app.run(host='0.0.0.0', port=AI_PORT, debug=False)
