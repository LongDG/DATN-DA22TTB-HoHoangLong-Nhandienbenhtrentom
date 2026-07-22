"""
test_rembg.py - Demo background removal for shrimp images.
Usage: python test_rembg.py <image_path>
"""
import sys
import os
import io

# Fix Windows console encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from PIL import Image
from rembg import remove, new_session

def remove_background_white(input_path: str, output_path: str = None):
    """
    Tách nền ảnh → dán lên nền trắng → lưu kết quả.
    """
    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_nobg.png"

    print(f"[INFO] Processing: {input_path}")

    # Load image bytes
    with open(input_path, "rb") as f:
        img_bytes = f.read()

    # Tách nền (dùng model u2net — tốt nhất cho object rõ ràng)
    session = new_session("u2net")
    removed = remove(
        img_bytes,
        session=session,
        alpha_matting=True,           # làm mịn cạnh (quan trọng với râu tôm)
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10,
    )

    # Ảnh RGBA (nền trong suốt)
    fg = Image.open(__import__("io").BytesIO(removed)).convert("RGBA")

    # Tạo nền trắng, dán tôm lên
    white_bg = Image.new("RGBA", fg.size, (255, 255, 255, 255))
    white_bg.paste(fg, mask=fg.split()[3])  # dùng alpha channel làm mask

    # Lưu PNG (giữ chất lượng) và JPEG (nhỏ hơn)
    result = white_bg.convert("RGB")
    result.save(output_path, "PNG")
    print(f"[OK]   Saved white-bg: {output_path}")

    # Also save 224x224 version (model input size)
    resized = result.resize((224, 224), Image.LANCZOS)
    resized_path = output_path.replace(".png", "_224.png")
    resized.save(resized_path, "PNG")
    print(f"[OK]   224x224 version: {resized_path}")

    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_rembg.py <image1> [image2] ...")
        print("Example: python test_rembg.py shrimp.jpg")
        sys.exit(1)

    for path in sys.argv[1:]:
        if not os.path.exists(path):
            print(f"[ERR]  File not found: {path}")
            continue
        try:
            remove_background_white(path)
        except Exception as e:
            print(f"[ERR]  {path}: {e}")
