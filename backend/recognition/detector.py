from ultralytics import YOLO
from django.conf import settings
from .perspective import correct_plate
from .deblur_cropped_plate import plate_deblur
import cv2


_model = None


def get_model():
    global _model
    if _model is None:
        _model = YOLO(str(settings.ALPR_MODEL_PATH))
    return _model

def detect_plate(frame):
    """
    Returns list of dicts: [{'bbox': (x1,y1,x2,y2), 'confidence': float, 'cropped': ndarray}]
    """
    model = get_model()
    results = model.predict(
        source=frame,
        conf=0.4,
        iou=0.5,
        imgsz=640,
        device='cuda' if cv2.cuda.getCudaEnabledDeviceCount() > 0 else 'cpu',
        # verbose=False
    )
    detections = []

    for result in results:
        for box in result.boxes:
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            if x2 <= x1 or y2 <= y1:
                continue
            cropped_plate = frame[y1:y2, x1:x2]
            if cropped_plate.size == 0:
                continue
            
            plate = correct_plate(img=cropped_plate)
            plate = plate_deblur(plate)

            detections.append({
                'bbox': (x1, y1, x2, y2),
                'confidence': conf,
                'cropped': plate,
            })

    return detections