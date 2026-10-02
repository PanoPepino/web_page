"""Create slide tile previews with macOS Quick Look and sips.

Run from new_webpage: python3 scripts/generate-slide-thumbnails.py
Presentation videos and generated previews both live inside this project.
"""

from pathlib import Path
import json
import re
import subprocess
from tempfile import TemporaryDirectory


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PRESENTATIONS = PROJECT_ROOT / "public/main_page/presentations"
OUTPUT = PROJECT_ROOT / "public/assets/slides"
OUTPUT.mkdir(parents=True, exist_ok=True)
SLIDES = json.loads((PROJECT_ROOT / "src/data/slides.json").read_text())


with TemporaryDirectory(prefix="slide-thumbnails-") as temporary:
    temporary_path = Path(temporary)
    for slide in SLIDES:
        image_name = slide["preview"]
        video_index = slide["videoIndex"]
        html_path = PRESENTATIONS / slide["path"]
        videos = re.findall(
            r"data-background-video=['\"]([^'\"]+\.mp4)['\"]",
            html_path.read_text(),
        )
        if len(videos) <= video_index:
            raise RuntimeError(f"Missing video {video_index} in {html_path}")
        video_path = html_path.parent / videos[video_index]
        subprocess.run(
            ["qlmanage", "-t", "-s", "1200", "-o", str(temporary_path), str(video_path)],
            check=True,
            capture_output=True,
            text=True,
        )
        thumbnail = temporary_path / f"{video_path.name}.png"
        if not thumbnail.exists():
            raise RuntimeError(f"Quick Look did not create thumbnail: {video_path}")
        subprocess.run(
            ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82", str(thumbnail), "--out", str(OUTPUT / image_name)],
            check=True,
            capture_output=True,
            text=True,
        )
        print(f"{image_name} ← {video_path.name}")
