import io
from fastapi import FastAPI, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
from quilting import synthesize

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
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
    
    # 2. SAFETY CHECK: Shrink the image to prevent Vercel 1GB RAM crash
    # This keeps the image under ~150x150 pixels before processing
    img.thumbnail((150, 150)) 
    
    # 3. Convert to float32 (Uses 50% less memory than float64)
    texture = np.array(img, dtype=np.float32)

    # 4. Run quilting algorithm
    result = synthesize(texture, block_size, overlap, tolerance, out_h, out_w)

    # 5. Convert NumPy array back to a PIL Image
    result_img = Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))
    
    # 6. Save to a memory buffer instead of the hard drive
    img_byte_arr = io.BytesIO()
    result_img.save(img_byte_arr, format='PNG')
    image_bytes = img_byte_arr.getvalue()

    # 7. Send the raw bytes back to the Next.js frontend
    return Response(content=image_bytes, media_type="image/png")