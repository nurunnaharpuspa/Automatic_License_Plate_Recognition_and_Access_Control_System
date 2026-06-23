import threading
import numpy as np
import cv2
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django.core.files.storage import default_storage
from django.conf import settings
from accounts.permissions import IsAdminOrStaff
from cameras.models import CameraConfig
from .pipeline import process_video, process_frame
import os


class VideoUploadView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAdminOrStaff]

    def post(self, request):
        video_file = request.FILES.get('video')
        event_type = request.data.get('event_type', 'ENTRY').upper()

        if not video_file:
            return Response({'error': 'No video file provided.'}, status=400)

        if event_type not in ('ENTRY', 'EXIT'):
            return Response(
                {'error': 'event_type must be ENTRY or EXIT.'}, status=400
            )

        filename = f'uploads/{video_file.name}'
        path = default_storage.save(filename, video_file)
        full_path = os.path.join(settings.MEDIA_ROOT, path)

        def run():
            process_video(full_path, event_type, camera_id='upload')

        thread = threading.Thread(target=run, daemon=True)
        thread.start()

        return Response({'message': 'Video processing started.', 'file': filename})


class CameraFrameView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAdminOrStaff]

    def post(self, request, camera_id):
        frame_file = request.FILES.get('frame')
        if not frame_file:
            return Response({'error': 'No frame provided.'}, status=400)

        try:
            cam = CameraConfig.objects.get(camera_id=camera_id, is_active=True)
        except CameraConfig.DoesNotExist:
            return Response(
                {'error': 'Unknown or inactive camera.'}, status=404
            )

        if cam.direction == 'BOTH':
            event_type = request.data.get('event_type', 'ENTRY').upper()
        else:
            event_type = cam.direction

        nparr = np.frombuffer(frame_file.read(), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return Response({'error': 'Could not decode frame image.'}, status=400)

        process_frame(frame, event_type, camera_id)
        return Response({'message': 'Frame processed.'})