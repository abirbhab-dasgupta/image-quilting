# 🧵 Image Quilting for Texture Synthesis

> **🚧 Work in Progress** — This project is under active development. Features and APIs may change.

An implementation of the [Image Quilting](https://people.eecs.berkeley.edu/~efros/research/quilting/quilting.pdf) algorithm (Efros & Freeman, 2001) for texture synthesis, with a FastAPI backend and a Next.js frontend.

Upload a small texture sample and generate a seamlessly tiled, larger output image.

---

## ✨ Features

- [x] Core quilting algorithm with minimum boundary cut
- [x] Vectorized patch matching (NumPy)
- [x] FastAPI REST endpoint (`POST /synthesize`)
- [ ] Next.js frontend with drag-and-drop upload
- [ ] Live preview & parameter tuning (block size, overlap, tolerance)
- [ ] Gallery of sample textures
- [ ] Dockerized deployment

## 🏗️ Project Structure

```
image-quilting/
├── backend/
│   ├── main.py          # FastAPI server
│   ├── quilting.py       # Core algorithm (patch extraction, min-cut, synthesis)
│   └── outputs/          # Generated images (git-ignored)
├── frontend/             # Next.js app (scaffolded, UI in progress)
├── .gitignore
└── README.md
```

## 🔬 How It Works

1. **Patch Extraction** — All overlapping patches of a given block size are extracted from the input texture.
2. **Candidate Selection** — For each output block, patches whose overlap region error falls within a tolerance of the best match are shortlisted.
3. **Minimum Boundary Cut** — A dynamic-programming seam cut blends the chosen patch with its neighbors, eliminating visible seams.
4. **Synthesis** — Blocks are placed left-to-right, top-to-bottom, building up the full output image.

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pillow numpy python-multipart
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and the API on `http://localhost:8000`.

## 📡 API

### `POST /synthesize`

| Parameter    | Type    | Default | Description                        |
|--------------|---------|---------|------------------------------------|
| `file`       | file    | —       | Input texture image (required)     |
| `block_size` | int     | 30      | Patch size in pixels               |
| `overlap`    | int     | 6       | Overlap width between patches      |
| `tolerance`  | float   | 0.1     | Error tolerance for candidate pool |
| `out_h`      | int     | 200     | Output image height                |
| `out_w`      | int     | 300     | Output image width                 |

**Returns:** the synthesized image as `image/png`.

## 📝 References

- Efros, A. A., & Freeman, W. T. (2001). *Image Quilting for Texture Synthesis and Transfer.* SIGGRAPH 2001.

---

<p align="center"><sub>🚧 This project is a work in progress — contributions and feedback welcome!</sub></p>
