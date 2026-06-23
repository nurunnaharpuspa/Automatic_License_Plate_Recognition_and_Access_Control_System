"""
License Plate Perspective Correction Pipeline
=============================================
Takes a cropped license plate image, detects its corners automatically
(or accepts manual corners), applies a 4-point perspective transformation
to produce a flat, rectified plate ready for OCR.

Usage
-----
    from plate_transform import correct_plate

    # Auto-detect corners:
    result = correct_plate("plate.jpg", debug=True)

    # Manual corners (if auto-detection is unreliable):
    src_pts = [(x1,y1), (x2,y2), (x3,y3), (x4,y4)]  # TL, TR, BR, BL
    result = correct_plate("plate.jpg", src_pts=src_pts, debug=True)

Requirements
------------
    pip install opencv-python numpy matplotlib
"""

import cv2
import numpy as np
import matplotlib.pyplot as plt
import os
from typing import Optional


def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Order 4 points as: top-left, top-right, bottom-right, bottom-left.

    Works by:
      - TL has the smallest (x+y)  sum
      - BR has the largest  (x+y)  sum
      - TR has the smallest (y-x)  difference
      - BL has the largest  (y-x)  difference
    """
    pts = pts.reshape(4, 2).astype("float32")
    rect = np.zeros((4, 2), dtype="float32")

    s    = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).ravel()

    rect[0] = pts[np.argmin(s)]     # top-left
    rect[2] = pts[np.argmax(s)]     # bottom-right
    rect[1] = pts[np.argmin(diff)]  # top-right
    rect[3] = pts[np.argmax(diff)]  # bottom-left

    return rect


def compute_output_size(rect: np.ndarray) -> tuple[int, int]:
    """
    Compute the width and height of the output rectangle.
    Uses the maximum of the two opposing side lengths so no
    information is lost during the warp.
    """
    tl, tr, br, bl = rect

    width_top    = np.linalg.norm(tr - tl)
    width_bottom = np.linalg.norm(br - bl)
    width        = int(max(width_top, width_bottom))

    height_left  = np.linalg.norm(bl - tl)
    height_right = np.linalg.norm(br - tr)
    height       = int(max(height_left, height_right))

    return width, height


def four_point_transform(image: np.ndarray,
                         src_pts: np.ndarray) -> np.ndarray:
    """
    Apply a 4-point perspective transformation.

    Parameters
    image   : BGR image (H × W × 3 numpy array)
    src_pts : (4, 2) array of source corner coordinates
              in any order — they will be sorted automatically.

    Returns
    Warped BGR image.
    """
    rect = order_points(src_pts)
    w, h = compute_output_size(rect)

    # Destination: a clean upright rectangle
    dst = np.array([
        [0,     0    ],
        [w - 1, 0    ],
        [w - 1, h - 1],
        [0,     h - 1],
    ], dtype="float32")

    H = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, H, (w, h))
    return warped


# Corner Ditection
def detect_plate_corners(image: np.ndarray) -> Optional[np.ndarray]:
    """
    Automatically detect the 4 corners of a license plate using
    edge detection + contour finding.

    Returns a (4, 2) float32 array if successful, else None.

    Strategy
    1. Convert to grayscale and blur.
    2. Threshold (Otsu) or use Canny edges.
    3. Find the largest 4-sided closed contour.
    4. Fall back to image-boundary corners if none found.
    """
    gray    = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Method 1: Canny + contours
    edges    = cv2.Canny(blurred, 30, 120)
    kernel   = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 3))
    edges    = cv2.dilate(edges, kernel, iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL,
                                   cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    for cnt in contours[:10]:                     # check top-10 largest
        peri   = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
        if len(approx) == 4:
            area = cv2.contourArea(approx)
            img_area = image.shape[0] * image.shape[1]
            if area > 0.15 * img_area:
                return approx.reshape(4, 2).astype("float32")

    # Method 2: Threshold + contours
    _, thresh = cv2.threshold(blurred, 0, 255,
                              cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    contours2, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL,
                                    cv2.CHAIN_APPROX_SIMPLE)
    contours2 = sorted(contours2, key=cv2.contourArea, reverse=True)

    for cnt in contours2[:5]:
        peri   = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
        if len(approx) == 4:
            area = cv2.contourArea(approx)
            if area > 0.15 * image.shape[0] * image.shape[1]:
                return approx.reshape(4, 2).astype("float32")

    return None


def boundary_corners(image: np.ndarray) -> np.ndarray:
    """Return the full image boundary as fallback corners."""
    h, w = image.shape[:2]
    return np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype="float32")


#  Debug visualisation
def _draw_corners(image: np.ndarray, corners: np.ndarray,
                  ordered: bool = False) -> np.ndarray:
    """Draw detected/ordered corners on a copy of the image."""
    vis    = image.copy()
    rect   = order_points(corners) if ordered else corners.reshape(4, 2)
    colors = [(0, 0, 255), (0, 255, 0), (255, 165, 0), (255, 0, 255)]
    labels = ["TL", "TR", "BR", "BL"]

    for i, ((x, y), color, label) in enumerate(zip(rect, colors, labels)):
        x, y = int(x), int(y)
        cv2.circle(vis, (x, y), 7, color, -1)
        cv2.circle(vis, (x, y), 9, (255, 255, 255), 2)
        cv2.putText(vis, label, (x + 10, y - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
    pts = rect.astype(int)
    for i in range(4):
        cv2.line(vis, tuple(pts[i]), tuple(pts[(i+1) % 4]),
                 (0, 255, 255), 2)
    return vis


def show_debug(original: np.ndarray,
               warped: np.ndarray,
               corners: np.ndarray,
               save_path: Optional[str] = None) -> None:
    """
    Display original image (with detected corners) and the
    transformed image side by side using matplotlib.
    """
    orig_vis = _draw_corners(original, corners, ordered=True)

    # Convert BGR -> RGB
    orig_rgb   = cv2.cvtColor(orig_vis,  cv2.COLOR_BGR2RGB)
    warped_rgb = cv2.cvtColor(warped,    cv2.COLOR_BGR2RGB)

    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    fig.suptitle("License Plate — 4-Point Perspective Correction",
                 fontsize=14, fontweight="bold", y=1.01)

    axes[0].imshow(orig_rgb)
    axes[0].set_title("Original  (detected corners shown)", fontsize=12)
    axes[0].axis("off")

    # Legend for corner colours
    from matplotlib.patches import Patch
    legend = [
        Patch(color='red',     label='TL — top-left'),
        Patch(color='lime',    label='TR — top-right'),
        Patch(color='orange',  label='BR — bottom-right'),
        Patch(color='magenta', label='BL — bottom-left'),
    ]
    axes[0].legend(handles=legend, loc="lower left",
                   fontsize=9, framealpha=0.85)

    axes[1].imshow(warped_rgb)
    h, w = warped.shape[:2]
    axes[1].set_title(f"Transformed  ({w}×{h} px)", fontsize=12)
    axes[1].axis("off")

    plt.tight_layout()

    if save_path:
        fig.savefig(save_path, dpi=150, bbox_inches="tight")
        print(f"[DEBUG] Comparison saved → {save_path}")

    plt.show()

#  Public pipeline entry point
def correct_plate(
    img,
    # image_path: str,
    src_pts: Optional[list | np.ndarray] = None,
    output_path: Optional[str] = None,
    debug: bool = False,
    debug_save_path: Optional[str] = None,
) -> np.ndarray:
    """
    Full pipeline: load → detect corners → warp → (optionally display & save).

    Parameters
    image_path      : Path to the input license plate image.
    src_pts         : Optional manual corners [(x,y)×4].
                      If None, corners are auto-detected.
    output_path     : If set, saves the warped image here.
    debug           : Show original vs. transformed side by side.
    debug_save_path : If set (and debug=True), saves the comparison figure.

    Returns
    Warped BGR numpy array.

    Raises
    FileNotFoundError  : If image_path does not exist.
    ValueError         : If corner detection fails and no fallback is possible.
    """
    # 1. Load
    # if not os.path.exists(image_path):
    #     raise FileNotFoundError(f"Image not found: {image_path}")

    # image = cv2.imread(image_path)
    # if image is None:
    #     raise ValueError(f"cv2.imread failed for: {image_path}")

    image = img

    # print(f"[INFO] Loaded image  : {image_path}  ({image.shape[1]}×{image.shape[0]} px)")

    print(f"[INFO] Loaded image  :   ({image.shape[1]}×{image.shape[0]} px)")

    # 2. Determine source corners
    if src_pts is not None:
        corners = np.array(src_pts, dtype="float32").reshape(4, 2)
        print("[INFO] Using manual corners.")
    else:
        corners = detect_plate_corners(image)
        if corners is None:
            print("[WARN] Auto-detection failed — using full image boundary as fallback.")
            corners = boundary_corners(image)
        else:
            print("[INFO] Corners auto-detected successfully.")

    # 3. Transform
    warped = four_point_transform(image, corners)
    print(f"[INFO] Output size   : {warped.shape[1]}×{warped.shape[0]} px")

    # 4. Save output
    if output_path:
        cv2.imwrite(output_path, warped)
        print(f"[INFO] Warped image saved → {output_path}")

    #5. Debug visualisation
    if debug:
        show_debug(image, warped, corners, save_path=debug_save_path)

    return warped


# Quick demo (runs when executed directly)
def _generate_synthetic_plate(path: str) -> None:
    """Create a synthetic tilted license plate for demo purposes."""
    canvas = np.full((300, 500, 3), (100, 100, 100), dtype=np.uint8)

    # Plate quad (simulate perspective tilt)
    src = np.array([[60, 80], [440, 50], [460, 240], [40, 260]], dtype=np.float32)
    dst = np.array([[0, 0],   [380, 0],  [380, 130], [0,  130]], dtype=np.float32)
    H   = cv2.getPerspectiveTransform(dst, src)

    # Draw flat plate content then warp it onto canvas
    plate = np.full((130, 380, 3), (240, 220, 50), dtype=np.uint8)
    cv2.rectangle(plate, (4, 4), (375, 125), (30, 30, 30), 3)
    cv2.putText(plate, "ABC 1234", (30, 90),
                cv2.FONT_HERSHEY_DUPLEX, 2.4, (20, 20, 20), 4)

    warped_plate = cv2.warpPerspective(plate, H, (500, 300))

    # Composite onto canvas (only non-black pixels)
    mask = warped_plate.sum(axis=2) > 0
    canvas[mask] = warped_plate[mask]

    # Add border noise
    cv2.rectangle(canvas, (0, 0), (499, 299), (80, 80, 80), 2)
    cv2.imwrite(path, canvas)
    print(f"[DEMO] Synthetic plate saved → {path}")

