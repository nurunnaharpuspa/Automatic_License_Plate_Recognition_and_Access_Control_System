import cv2
import numpy as np

def plate_deblur(cropped_plate, threshold=100.0):
    # 1. Convert to grayscale for consistent processing
    gray = cv2.cvtColor(cropped_plate, cv2.COLOR_BGR2GRAY)

    # 2. Check for blur
    focus_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    is_blurry = focus_score < threshold

    # 3. Apply High-Pass Filter (Unsharp Masking)
    # We subtract a low-pass (Gaussian) version from the original to boost edges.
    gaussian = cv2.GaussianBlur(gray, (5, 5), 0)
    deblurred = cv2.addWeighted(gray, 1.5, gaussian, -0.5, 0)

    # 4. Display for debugging
    status = "BLURRY - Deblurring Applied" if is_blurry else "SHARP - No Action"
    print(f"Debug Info: Focus Score = {focus_score:.2f} | Status: {status}")

    # Stack images horizontally for comparison (Original Gray vs Deblurred)
    comparison = np.hstack((gray, deblurred))

    # cv2_imshow(comparison)
    #make deblurred an image here


    return deblurred if is_blurry else gray