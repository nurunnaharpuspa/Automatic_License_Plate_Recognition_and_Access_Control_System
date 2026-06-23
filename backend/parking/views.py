from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils.timezone import localtime
from collections import defaultdict

from .models import ParkingLog, CorrectionRecord
from .serializers import (
    ParkingLogSerializer, CorrectionSubmitSerializer, GuestLogSerializer
)
from accounts.permissions import IsAdminOrStaff, IsActiveUser
from vehicles.models import Vehicle

channel_layer = get_channel_layer()


def broadcast_event(log):
    try:
        async_to_sync(channel_layer.group_send)(
            'events',
            {'type': 'parking_event', 'data': ParkingLogSerializer(log).data}
        )
    except Exception as e:
        print(f'Broadcast error: {e}')


class AllLogsView(generics.ListAPIView):
    serializer_class = ParkingLogSerializer
    permission_classes = [IsAdminOrStaff]

    def get_queryset(self):
        qs = ParkingLog.objects.select_related('vehicle__owner', 'correction__staff')
        status_filter = self.request.query_params.get('status')
        plate         = self.request.query_params.get('plate')
        event_type    = self.request.query_params.get('event_type')
        if status_filter: qs = qs.filter(status=status_filter)
        if plate:         qs = qs.filter(plate_number__icontains=plate)
        if event_type:    qs = qs.filter(event_type=event_type)
        return qs


class GroupedLogsView(APIView):
    """
    Returns logs grouped by date → plate → list of events.
    Structure:
    [
      {
        date: '2026-04-04',
        vehicles: [
          {
            plate_number: 'ABC1234',
            owner_name: 'Mahdi',
            is_guest: false,
            events: [ {id, event_type, timestamp, confidence_score, status, ...} ]
          }
        ]
      }
    ]
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        qs = ParkingLog.objects.select_related(
            'vehicle__owner', 'correction__staff'
        ).order_by('-timestamp')

        # optional filters
        plate = request.query_params.get('plate')
        date  = request.query_params.get('date')   # YYYY-MM-DD
        if plate: qs = qs.filter(plate_number__icontains=plate)
        if date:  qs = qs.filter(timestamp__date=date)

        # group: date to plate to events
        date_map = defaultdict(lambda: defaultdict(list))

        for log in qs:
            local_ts  = localtime(log.timestamp)
            date_key  = local_ts.strftime('%Y-%m-%d')
            plate_key = log.plate_number

            date_map[date_key][plate_key].append({
                'id':               log.id,
                'event_type':       log.event_type,
                'timestamp':        log.timestamp.isoformat(),
                'confidence_score': log.confidence_score,
                'status':           log.status,
                'camera_id':        log.camera_id,
                'is_guest':         log.is_guest,
                'guest_note':       log.guest_note,
                'owner_name':       log.vehicle.owner.full_name if log.vehicle else None,
                'owner_user_id':    log.vehicle.owner.user_id  if log.vehicle else None,
                'correction':       {
                    'corrected_plate': log.correction.corrected_plate,
                    'staff_name':      log.correction.staff.full_name if log.correction.staff else None,
                } if hasattr(log, 'correction') else None,
            })

        result = []
        for date_key in sorted(date_map.keys(), reverse=True):
            vehicles = []
            plate_group = date_map[date_key]
            for plate_number, events in sorted(plate_group.items()):
                first = events[0]
                vehicles.append({
                    'plate_number': plate_number,
                    'owner_name':   first['owner_name'],
                    'owner_user_id': first['owner_user_id'],
                    'is_guest':     first['is_guest'],
                    'events':       sorted(events, key=lambda e: e['timestamp']),
                })
            result.append({'date': date_key, 'vehicles': vehicles})

        return Response(result)


class MyLogsView(generics.ListAPIView):
    serializer_class = ParkingLogSerializer
    permission_classes = [IsActiveUser]

    def get_queryset(self):
        return ParkingLog.objects.filter(
            vehicle__owner=self.request.user
        ).select_related('vehicle__owner')


class CurrentParkingStatusView(APIView):
    permission_classes = [IsActiveUser]

    def get(self, request):
        vehicles = Vehicle.objects.filter(owner=request.user, status='APPROVED')
        result = []
        for vehicle in vehicles:
            last_log = ParkingLog.objects.filter(
                vehicle=vehicle, status__in=['AUTO', 'CORRECTED']
            ).first()
            is_parked = last_log is not None and last_log.event_type == 'ENTRY'
            result.append({
                'plate':    vehicle.plate_number,
                'make':     vehicle.make,
                'model':    vehicle.model,
                'color':    vehicle.color,
                'is_parked': is_parked,
                'since':    last_log.timestamp if is_parked else None,
            })
        return Response(result)


class PendingCorrectionsView(generics.ListAPIView):
    serializer_class = ParkingLogSerializer
    permission_classes = [IsAdminOrStaff]

    def get_queryset(self):
        return ParkingLog.objects.filter(status='PENDING').order_by('timestamp')


class SubmitCorrectionView(APIView):
    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        try:
            log = ParkingLog.objects.get(pk=pk, status='PENDING')
        except ParkingLog.DoesNotExist:
            return Response(
                {'error': 'Log not found or already resolved.'},
                status=404
            )

        serializer = CorrectionSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            # return the actual validation errors so frontend can show them
            return Response(serializer.errors, status=400)

        corrected_plate = serializer.validated_data['corrected_plate'].strip().upper()
        note            = serializer.validated_data.get('note', '')

        # store original before modifying
        original_text = log.raw_ocr_text or log.plate_number

        # match against registered vehicles
        try:
            vehicle = Vehicle.objects.get(
                plate_number=corrected_plate, status='APPROVED'
            )
            log.vehicle      = vehicle
            log.plate_number = corrected_plate
            log.status       = 'CORRECTED'
        except Vehicle.DoesNotExist:
            log.plate_number = corrected_plate
            log.status       = 'UNREGISTERED'

        log.save()

        # avoid duplicate CorrectionRecord
        CorrectionRecord.objects.update_or_create(
            log=log,
            defaults={
                'original_ocr_text': original_text,
                'corrected_plate':   corrected_plate,
                'staff':             request.user,
                'note':              note,
            }
        )

        broadcast_event(log)
        return Response(ParkingLogSerializer(log).data)


class GuestLogView(APIView):
    """Staff or admin manually logs a guest vehicle entry or exit."""
    permission_classes = [IsAdminOrStaff]

    def post(self, request):
        serializer = GuestLogSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        plate      = serializer.validated_data['plate_number'].strip().upper()
        event_type = serializer.validated_data['event_type']
        note       = serializer.validated_data.get('guest_note', '')

        log = ParkingLog.objects.create(
            vehicle          = None,
            plate_number     = plate,
            event_type       = event_type,
            raw_ocr_text     = plate,
            confidence_score = 1.0,
            status           = 'GUEST',
            camera_id        = 'manual',
            is_guest         = True,
            guest_note       = note,
        )

        broadcast_event(log)
        return Response(ParkingLogSerializer(log).data, status=201)
    

class UnregisteredApprovalView(APIView):
    """
    Staff/admin can approve an UNREGISTERED or GUEST log:
    - link it to an existing vehicle (converts to AUTO)
    - approve as guest (keeps GUEST status, marks reviewed)
    - dismiss (deletes the log)
    """
    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        try:
            log = ParkingLog.objects.get(pk=pk, status__in=['UNREGISTERED', 'GUEST'])
        except ParkingLog.DoesNotExist:
            return Response({'error': 'Log not found or not in review state.'}, status=404)

        action = request.data.get('action')   # 'link' or 'approve_guest' or 'dismiss'

        if action == 'link':
            plate = request.data.get('plate_number', '').strip().upper()
            try:
                vehicle = Vehicle.objects.get(plate_number=plate, status='APPROVED')
                log.vehicle      = vehicle
                log.plate_number = plate
                log.status       = 'AUTO'
                log.is_guest     = False
                log.save()
                broadcast_event(log)
                return Response(ParkingLogSerializer(log).data)
            except Vehicle.DoesNotExist:
                return Response({'error': 'No approved vehicle with that plate.'}, status=400)

        elif action == 'approve_guest':
            log.status   = 'GUEST'
            log.is_guest = True
            log.save()
            broadcast_event(log)
            return Response(ParkingLogSerializer(log).data)

        elif action == 'dismiss':
            log.delete()
            return Response({'message': 'Log dismissed.'})

        return Response({'error': 'action must be link, approve_guest, or dismiss.'}, status=400)


class CurrentlyParkedView(APIView):
    """
    Returns all vehicles currently inside the parking area.
    A vehicle is 'parked' if its latest resolved log is an ENTRY.
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        from django.db.models import Max

        resolved_statuses = ['AUTO', 'CORRECTED', 'GUEST']

        latest = (
            ParkingLog.objects
            .filter(status__in=resolved_statuses)
            .values('plate_number')
            .annotate(latest_ts=Max('timestamp'))
        )

        parked = []
        for row in latest:
            log = ParkingLog.objects.select_related('vehicle__owner').get(
                plate_number=row['plate_number'],
                timestamp=row['latest_ts'],
                status__in=resolved_statuses,
            )
            if log.event_type == 'ENTRY':
                parked.append({
                    'plate_number':  log.plate_number,
                    'owner_name':    log.vehicle.owner.full_name if log.vehicle else None,
                    'owner_user_id': log.vehicle.owner.user_id  if log.vehicle else None,
                    'is_guest':      log.is_guest,
                    'entry_time':    log.timestamp.isoformat(),
                    'camera_id':     log.camera_id,
                    'log_id':        log.id,
                })

        return Response({
            'count':   len(parked),
            'vehicles': parked,
        })