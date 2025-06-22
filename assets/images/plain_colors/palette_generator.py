import os, numpy as np, colorsys
from PIL import Image, ImageDraw

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    r, g, b = (int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return r, g, b

def create_gradient_mask(w, h, border_pct, grad_pow):
    bw = int(w * border_pct / 2); bh = int(h * border_pct / 2)
    y, x = np.ogrid[:h, :w]
    dx = np.minimum(x, w-1-x); dy = np.minimum(y, h-1-y)
    nx = np.clip(dx / bw, 0, 1); ny = np.clip(dy / bh, 0, 1)
    mask = np.minimum(nx, ny)
    return mask ** grad_pow

def apply_rounded_corners(img, r):
    circle = Image.new('L', (r*2, r*2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0,0,r*2,r*2), fill=255)
    alpha = Image.new('L', img.size, 255)
    for pos in [(0,0), (0,img.height-r*2), (img.width-r*2,0), (img.width-r*2,img.height-r*2)]:
        alpha.paste(circle, pos)
    img.putalpha(alpha); return img

def generate_images(hex_color, folder, w, h, num, grad_pow, corner_r):
    os.makedirs(folder, exist_ok=True)
    r, g, b = hex_to_rgb(hex_color)
    hls = colorsys.rgb_to_hls(r/255, g/255, b/255)
    mask = create_gradient_mask(w, h, 0.40, grad_pow)
    step = hls[1] / (num + 1)
    for i in range(1, num+1):
        nl = max(0, hls[1] - step*i)
        rgb = np.array([int(c*255) for c in colorsys.hls_to_rgb(hls[0], nl, hls[2])])
        arr = np.zeros((h, w, 4), np.uint8)
        for c in range(3): arr[:,:,c] = (mask * rgb[c]).astype(np.uint8)
        arr[:,:,3] = (mask * 255).astype(np.uint8)
        img = Image.fromarray(arr, 'RGBA')
        img = apply_rounded_corners(img, corner_r)
        path = os.path.join(folder, f"{folder}_{i}.png")
        img.save(path)

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("hex_color")
    p.add_argument("folder")
    p.add_argument("--width", type=int, default=500)
    p.add_argument("--height", type=int, default=500)
    p.add_argument("--num-shades", type=int, default=20)
    p.add_argument("--gradient-power", type=float, default=3.0)
    p.add_argument("--corner-radius", type=int, default=15)
    args = p.parse_args()
    generate_images(
        args.hex_color, args.folder,
        args.width, args.height,
        args.num_shades,
        args.gradient_power,
        args.corner_radius
    )
