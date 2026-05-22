"""
inspect_model.py — Kiểm tra thông tin model .pth
Chạy: python inspect_model.py
"""
import os, sys
import torch

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'model_ai', 'best_model_v3.pth')

print("=" * 60)
print(f"Đang kiểm tra: {os.path.abspath(MODEL_PATH)}")
print("=" * 60)

checkpoint = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)

# ── Lấy state_dict ─────────────────────────────────────────────
if isinstance(checkpoint, dict):
    print(f"\n[Checkpoint keys]: {list(checkpoint.keys())[:10]}")
    state_dict = (
        checkpoint.get('model_state_dict') or
        checkpoint.get('state_dict') or
        checkpoint
    )
else:
    state_dict = checkpoint

print(f"\n[Tổng số layers]: {len(state_dict)}")

# ── In 10 layer đầu ────────────────────────────────────────────
print("\n[10 Layer đầu tiên]:")
for i, (k, v) in enumerate(state_dict.items()):
    print(f"  {k:60s}  shape={tuple(v.shape)}")
    if i >= 9: break

# ── In 5 layer cuối ────────────────────────────────────────────
print("\n[5 Layer cuối cùng]:")
items = list(state_dict.items())
for k, v in items[-5:]:
    print(f"  {k:60s}  shape={tuple(v.shape)}")

# ── Tìm số class từ layer cuối ──────────────────────────────────
num_classes = None
for key in ['classifier.1.weight', 'classifier.weight', 'fc.weight',
            'head.fc.weight', 'head.weight']:
    if key in state_dict:
        num_classes = state_dict[key].shape[0]
        in_features = state_dict[key].shape[1]
        print(f"\n✅ Phát hiện layer output: '{key}'")
        print(f"   → Số class (num_classes): {num_classes}")
        print(f"   → in_features: {in_features}")
        break

if num_classes is None:
    for k, v in reversed(items):
        if k.endswith('.weight') and len(v.shape) == 2:
            num_classes = v.shape[0]
            print(f"\n✅ Layer output (fallback): '{k}' → num_classes={num_classes}")
            break

# ── Đoán kiến trúc ─────────────────────────────────────────────
keys_str = ' '.join(list(state_dict.keys())[:30])
if 'features' in keys_str:
    arch = 'EfficientNet (B0/B3/B4/...)'
elif 'layer1' in keys_str:
    arch = 'ResNet (34/50/...)'
elif 'dense' in keys_str:
    arch = 'DenseNet'
else:
    arch = 'Không xác định'

print(f"\n🏗️  Kiến trúc ước tính: {arch}")
print(f"📊  Số lượng class     : {num_classes}")
print("\n" + "=" * 60)
print("SAO CHÉP thông tin trên và báo lại để cấu hình đúng!")
print("=" * 60)
