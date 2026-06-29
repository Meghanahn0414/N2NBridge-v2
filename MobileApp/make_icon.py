"""
Converts n2n-logo.jpeg → square 1024x1024 PNG suitable for Expo app icons.
Run from: D:\CRM-02\CRM-01\MobileApp\
  python make_icon.py
"""
from PIL import Image
import os

SRC  = "src/assets/images/n2n-logo.jpeg"
OUT  = "src/assets/images/n2n-logo-icon.png"
SIZE = 1024
BG   = (15, 22, 41)   # #0f1629 navy

img = Image.open(SRC).convert("RGBA")

# Scale image to fit inside SIZE×SIZE keeping aspect ratio
img.thumbnail((SIZE, SIZE), Image.LANCZOS)

# Paste centred on a navy square canvas
canvas = Image.new("RGBA", (SIZE, SIZE), BG + (255,))
x = (SIZE - img.width)  // 2
y = (SIZE - img.height) // 2
canvas.paste(img, (x, y), img)

canvas = canvas.convert("RGB")  # Expo icon must be RGB PNG (no alpha)
canvas.save(OUT, "PNG")
print(f"Saved {OUT}  ({SIZE}x{SIZE})")
