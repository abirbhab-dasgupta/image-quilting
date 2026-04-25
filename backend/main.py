import io
from fastapi import FastAPI, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
from quilting import synthesize

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # Added localhost:3000 so you can still test your frontend locally
    allow_origins=["https://imagequilting.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "ok", "message": "Backend is running!"}

@app.post("/synthesize")
async def synthesize_texture(
    file: UploadFile = File(...),
    block_size: int  = Form(30),
    overlap: int     = Form(6),
    tolerance: float = Form(0.1),
    out_h: int       = Form(200),
    out_w: int       = Form(300),
):
    # 1. Read uploaded image into memory
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    texture = np.array(img, dtype=np.float64)

    # 2. Run quilting algorithm
    result = synthesize(texture, block_size, overlap, tolerance, out_h, out_w)

    # 3. Convert NumPy array back to a PIL Image
    result_img = Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))
    
    # 4. Save to a memory buffer instead of the hard drive!
    img_byte_arr = io.BytesIO()
    result_img.save(img_byte_arr, format='PNG')
    image_bytes = img_byte_arr.getvalue()

    # 5. Send the raw bytes back as an image response
    return Response(content=image_bytes, media_type="image/png")