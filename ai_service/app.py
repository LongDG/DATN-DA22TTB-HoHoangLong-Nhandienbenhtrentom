"""
app.py — Flask AI service — EfficientNet-B3 (custom classifier) nhận diện bệnh tôm.

Model: best_model_v3.pth
Classes: ['BlackGill', 'Healthy', 'WSSV', 'Yellowhead']
Classifier: Dropout(0.4) → Linear(1536,512) → SiLU → Dropout(0.3) → Linear(512,4)
Image size: 224×224
"""

import os, io, time, logging
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from validator import validate_image

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s [%(levelname)s] %(message)s')
log = logging.getLogger(__name__)

# ─── Cấu hình ────────────────────────────────────────────────────────────────
MODEL_PATH = os.environ.get(
    'MODEL_PATH',
    os.path.join(os.path.dirname(__file__), '..', 'model_ai', 'best_model_v3.pth')
)
AI_PORT  = int(os.environ.get('AI_PORT', 5001))
DEVICE   = 'cuda' if torch.cuda.is_available() else 'cpu'
IMG_SIZE = 224   # kích thước chuẩn khi training

# ─── 4 Class đúng theo thứ tự training ───────────────────────────────────────
#   CLASS_NAMES = ['BlackGill', 'Healthy', 'WSSV', 'Yellowhead']
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
            '3. Dùng thuốc xử lý mang theo chỉ định bác sỹ thú y thủy sản.\n'
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
            '6. Liên hệ ngay chuyên gia thú y thủy sản.'
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

# ─── Transform ảnh (đúng như lúc training + TTA) ────────────────────────────
_transform_base = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

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

# ─── Load model ──────────────────────────────────────────────────────────────
_model     = None
_model_ver = 'unknown'

def load_model_once():
    global _model, _model_ver

    if _model is not None:
        return

    path = os.path.abspath(MODEL_PATH)
    if not os.path.exists(path):
        raise FileNotFoundError(f'Model không tồn tại: {path}')

    log.info(f'Đang load model: {path}  device={DEVICE}')
    ckpt = torch.load(path, map_location=DEVICE, weights_only=False)

    # Lấy state_dict từ key 'model_state' (theo code training)
    if isinstance(ckpt, dict) and 'model_state' in ckpt:
        state_dict = ckpt['model_state']
        log.info(f'  epoch={ckpt.get("epoch","?")}  '
                 f'val_acc={ckpt.get("val_acc",0)*100:.2f}%  '
                 f'retrain_v={ckpt.get("retrain_v","?")}')
    elif isinstance(ckpt, dict):
        # fallback
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
    _model     = m
    _model_ver = os.path.basename(path)
    log.info(f'✅ Model sẵn sàng — {len(DISEASE_CLASSES)} classes  device={DEVICE}')
    log.info(f'   Classes: {[d["name"] for d in DISEASE_CLASSES]}')

# ─── Dự đoán với TTA ×8 ─────────────────────────────────────────────────────
@torch.no_grad()
def predict(img_bytes: bytes) -> dict:
    pil_img = Image.open(io.BytesIO(img_bytes)).convert('RGB')

    t0         = time.perf_counter()
    probs_list = []

    for tf in _TTA_TRANSFORMS:
        tensor = tf(pil_img).unsqueeze(0).to(DEVICE)
        probs  = torch.softmax(_model(tensor), dim=1).cpu().numpy()[0]
        probs_list.append(probs)

    # Trung bình xác suất của 8 lần
    avg     = np.mean(probs_list, axis=0)
    top_idx = int(np.argmax(avg))
    conf    = float(avg[top_idx]) * 100
    ms      = (time.perf_counter() - t0) * 1000

    disease   = DISEASE_CLASSES[top_idx].copy()
    all_probs = [
        {'name': DISEASE_CLASSES[i]['name'], 'prob': round(float(p) * 100, 2)}
        for i, p in enumerate(avg)
    ]

    return {
        'disease_index': top_idx,
        'disease':       disease,
        'confidence':    round(conf, 2),
        'all_probs':     all_probs,
        'inference_ms':  round(ms, 1),
        'model_version': _model_ver,
        'tta_count':     len(_TTA_TRANSFORMS),
    }

# ─── Flask App ───────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    ready = _model is not None
    return jsonify({
        'status':       'ok' if ready else 'loading',
        'model_loaded': ready,
        'model_version': _model_ver,
        'num_classes':  len(DISEASE_CLASSES),
        'classes':      [d['name'] for d in DISEASE_CLASSES],
        'device':       DEVICE,
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

    if _model is None:
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
