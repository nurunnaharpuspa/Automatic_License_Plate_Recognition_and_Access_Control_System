import os
import cv2
from django.conf import settings
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .frame_extractor import extract_frames
from .detector import detect_plate
from .ocr import read_plate
from .duplicate_suppressor import suppressor
from cameras.models import SystemSettings
from parking.models import ParkingLog
from parking.serializers import ParkingLogSerializer
from vehicles.models import Vehicle

channel_layer = get_channel_layer()


def save_frame_image(frame, plate_text, frame_index):
    timestamp = int(timezone.now().timestamp())
    filename = f'captures/{plate_text}_{frame_index}_{timestamp}.jpg'
    full_path = os.path.join(settings.MEDIA_ROOT, filename)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    cv2.imwrite(full_path, frame)
    return filename


def broadcast(log):
    try:
        async_to_sync(channel_layer.group_send)(
            'events',
            {'type': 'parking_event', 'data': ParkingLogSerializer(log).data}
        )
    except Exception as e:
        print(f'WebSocket broadcast failed: {e}')


def _resolve_and_log(plate_text, ocr_confidence, frame, frame_index, event_type, camera_id, threshold):
    """Shared logic for both video and live-frame pipelines."""

    if suppressor.is_duplicate(plate_text, camera_id):
        return None

    image_path = save_frame_image(frame, plate_text, frame_index)

    vehicle = None
    try:
        vehicle = Vehicle.objects.get(plate_number=plate_text, status='APPROVED')
    except Vehicle.DoesNotExist:
        pass

    if ocr_confidence >= threshold:
        log_status = 'AUTO' if vehicle else 'UNREGISTERED'
    else:
        log_status = 'PENDING'

    log = ParkingLog.objects.create(
        vehicle=vehicle,
        plate_number=plate_text,
        event_type=event_type,
        raw_ocr_text=plate_text,
        confidence_score=ocr_confidence,
        status=log_status,
        image_path=image_path,
        camera_id=camera_id,
    )

    broadcast(log)
    return log.id


def process_video(video_path, event_type, camera_id='upload'):
    """
    Entry point for video upload mode.
    Returns list of created ParkingLog IDs.
    """
    sys_settings = SystemSettings.get()
    threshold = sys_settings.confidence_threshold
    sample_rate = sys_settings.frame_sample_rate
    log_ids = []
    last_seen_plate = None
    consecutive_count = 0
    final_license_plate = ""
    for frame_index, frame in extract_frames(video_path, sample_rate):
        detections = detect_plate(frame)

        for detection in detections:
            temp_license_plate = ""
            plate_text, plate_number, ocr_confidence = read_plate(detection['cropped'])
            if plate_text is not None:
                temp_license_plate += plate_text
            else:
                continue

            if plate_number is not None and len(plate_number)==7:
                plate_number = plate_number[:2]+ "-" + plate_number[3:]
                temp_license_plate += " "+ plate_number
            else:
                continue
            
            final_license_plate = temp_license_plate
            print(final_license_plate)
            
            #a stopping critaria if "final_license plate" remains same for 4 iteration here
            if final_license_plate == last_seen_plate:
                consecutive_count += 1
                final_license_plate = ""
            else:
                last_seen_plate = final_license_plate
                consecutive_count = 1 # Reset count for a new plate
                final_license_plate = ""

            if consecutive_count > 4:
                print(f"Stopping: Plate {final_license_plate} confirmed 3 times.")
                
                return log_ids
            
            log_id = _resolve_and_log(
                last_seen_plate, ocr_confidence, detection['cropped'],
                frame_index, event_type, camera_id, threshold
            )
            if log_id:
                log_ids.append(log_id)

    return log_ids


def process_frame(frame, event_type, camera_id):
    """
    Entry point for live camera mode (single or dual).
    """
    sys_settings = SystemSettings.get()
    threshold = sys_settings.confidence_threshold

    last_seen_plate = None
    consecutive_count = 0
    final_license_plate = ""
    
    detections = detect_plate(frame)

    for detection in detections:
        temp_license_plate = ""
        plate_text, plate_number, ocr_confidence = read_plate(detection['cropped'])
        if plate_text is not None:
            temp_license_plate += plate_text
        else:
            continue

        if plate_number is not None and len(plate_number)==7:
            plate_number = plate_number[:2]+ "-" + plate_number[3:]
            temp_license_plate += " "+ plate_number
        else:
            continue
        
        final_license_plate = temp_license_plate
        print(final_license_plate)
        
        # a stopping critaria if "final_license plate" remains same for 4 iteration here
        if final_license_plate == last_seen_plate:
            consecutive_count += 1
            final_license_plate = ""
        else:
            last_seen_plate = final_license_plate
            consecutive_count = 1 # Reset count for a new plate
            final_license_plate = ""

        if consecutive_count > 4:
            print(f"Stopping: Plate {final_license_plate} confirmed 3 times.")

        _resolve_and_log(
            last_seen_plate, ocr_confidence, frame,
            0, event_type, camera_id, threshold
        )