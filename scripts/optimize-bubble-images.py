"""Optional lossless image variants. Requires Pillow; not needed to start iNEX."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
count=before=after=0
for source_path in (root/'public/bubbleblast/images').rglob('*.png'):
    if source_path.stat().st_size<300000:
        continue
    target=Path(str(source_path)+'.webp')
    with Image.open(source_path) as image:
        rgba=image.convert('RGBA')
        rgba.save(target,format='WEBP',lossless=True,exact=True,method=6)
        with Image.open(target) as decoded:
            identical=rgba.tobytes()==decoded.convert('RGBA').tobytes()
    if not identical or target.stat().st_size>=source_path.stat().st_size:
        target.unlink()
        continue
    before+=source_path.stat().st_size
    after+=target.stat().st_size
    count+=1
print(json.dumps({'files':count,'originalBytes':before,'losslessWebpBytes':after,'pixelsIdentical':True}))
