import numpy as np
from PIL import Image

def load_image(path: str) -> np.ndarray:
    return np.array(Image.open(path).convert("RGB"), dtype=np.float64)

def save_image(arr: np.ndarray, path: str):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(path)

def get_all_patches(texture: np.ndarray, block_size: int) -> np.ndarray:
    """Returns shape (N, block_size, block_size, 3) — all patches at once."""
    h, w, _ = texture.shape
    patches = []
    for y in range(h - block_size + 1):
        for x in range(w - block_size + 1):
            patches.append(texture[y:y+block_size, x:x+block_size])
    return np.stack(patches)   # (N, B, B, 3)

def find_candidates(patch_arr: np.ndarray, existing: np.ndarray,
                    overlap: int, has_top: bool, has_left: bool,
                    tolerance: float) -> np.ndarray:
    """Fully vectorized — no Python loops over patches."""
    N = patch_arr.shape[0]
    errors = np.zeros(N)

    if has_left:
        # existing[:, :overlap] vs patch_arr[:, :, :overlap, :]
        diff = patch_arr[:, :, :overlap, :] - existing[np.newaxis, :, :overlap, :]
        errors += np.sum(diff ** 2, axis=(1, 2, 3))

    if has_top:
        diff = patch_arr[:, :overlap, :, :] - existing[np.newaxis, :overlap, :, :]
        errors += np.sum(diff ** 2, axis=(1, 2, 3))

    best = errors.min()
    mask = errors <= best * (1.0 + tolerance)
    return patch_arr[mask]     # return only qualifying patches

def min_cut_vertical(error_surface: np.ndarray) -> np.ndarray:
    rows, cols = error_surface.shape
    dp = error_surface.copy()

    for i in range(1, rows):
        shifted_left  = np.pad(dp[i-1, :-1], (1, 0), constant_values=np.inf)
        shifted_right = np.pad(dp[i-1, 1:],  (0, 1), constant_values=np.inf)
        dp[i] += np.minimum(np.minimum(shifted_left, dp[i-1]), shifted_right)

    mask = np.zeros((rows, cols), dtype=bool)
    j = int(np.argmin(dp[-1]))
    for i in range(rows - 1, -1, -1):
        mask[i, :j] = True
        if i > 0:
            lo = max(j - 1, 0)
            hi = min(j + 2, cols)
            j  = lo + int(np.argmin(dp[i-1, lo:hi]))
    return mask

def min_cut_horizontal(error_surface: np.ndarray) -> np.ndarray:
    return min_cut_vertical(error_surface.T).T

def apply_boundary_cut(existing: np.ndarray, candidate: np.ndarray,
                        overlap: int, has_top: bool, has_left: bool) -> np.ndarray:
    result = candidate.copy()

    if has_left:
        err  = np.sum((existing[:, :overlap] - candidate[:, :overlap]) ** 2, axis=2)
        mask = min_cut_vertical(err)
        result[:, :overlap] = np.where(mask[:, :, np.newaxis],
                                        existing[:, :overlap],
                                        candidate[:, :overlap])
    if has_top:
        err  = np.sum((existing[:overlap, :] - candidate[:overlap, :]) ** 2, axis=2)
        mask = min_cut_horizontal(err)
        result[:overlap, :] = np.where(mask[:, :, np.newaxis],
                                        existing[:overlap, :],
                                        candidate[:overlap, :])
    return result

def synthesize(texture: np.ndarray, block_size: int,
               overlap: int, tolerance: float,
               out_h: int, out_w: int) -> np.ndarray:

    output    = np.zeros((out_h, out_w, 3), dtype=np.float64)
    patch_arr = get_all_patches(texture, block_size)   # built ONCE
    step      = block_size - overlap

    num_rows = (out_h - overlap + step - 1) // step
    num_cols = (out_w - overlap + step - 1) // step

    for row in range(num_rows):
        for col in range(num_cols):
            y  = row * step
            x  = col * step
            bh = min(block_size, out_h - y)
            bw = min(block_size, out_w - x)

            has_top  = row > 0
            has_left = col > 0

            existing = np.zeros((block_size, block_size, 3))
            if has_left:
                existing[:bh, :overlap] = output[y:y+bh, x:x+overlap]
            if has_top:
                existing[:overlap, :bw] = output[y:y+overlap, x:x+bw]

            if not has_top and not has_left:
                patch = patch_arr[np.random.randint(len(patch_arr))].copy()
            else:
                candidates = find_candidates(patch_arr, existing, overlap,
                                             has_top, has_left, tolerance)
                patch = candidates[np.random.randint(len(candidates))].copy()

            blended = apply_boundary_cut(existing, patch, overlap, has_top, has_left)
            output[y:y+bh, x:x+bw] = blended[:bh, :bw]

    return output