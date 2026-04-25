import io
import uuid
import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image
import numpy as np
from quilting import synthesize, load_image, save_image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://imagequilting.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("outputs", exist_ok=True)

@app.get("/")
def health():
    return {"status": "ok"}

@app.post("/synthesize")
async def synthesize_texture(
    file: UploadFile = File(...),
    block_size: int  = Form(30),
    overlap: int     = Form(6),
    tolerance: float = Form(0.1),
    out_h: int       = Form(200),
    out_w: int       = Form(300),
):
    # Read uploaded image
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    texture = np.array(img, dtype=np.float64)

    # Run quilting
    result = synthesize(texture, block_size, overlap, tolerance, out_h, out_w)

    # Save and return
    out_path = f"outputs/{uuid.uuid4().hex}.png"
    save_image(result, out_path)
    return FileResponse(out_path, media_type="image/png")