from django.db import models
from django.conf import settings


class ParkingLog(models.Model):
    EVENT_CHOICES = [('ENTRY', 'Entry'), ('EXIT', 'Exit')]
    STATUS_CHOICES = [
        ('AUTO', 'Auto'),
        ('PENDING', 'Pending Correction'),
        ('CORRECTED', 'Corrected'),
        ('UNREGISTERED', 'Unregistered'),
        ('GUEST', 'Guest'),
    ]

    vehicle = models.ForeignKey(
        'vehicles.Vehicle', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='logs'
    )
    plate_number = models.CharField(max_length=100, db_index=True)
    event_type = models.CharField(max_length=5, choices=EVENT_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    raw_ocr_text = models.CharField(max_length=100, blank=True)
    confidence_score = models.FloatField(default=0.0)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='AUTO')
    image_path = models.CharField(max_length=255, blank=True)
    camera_id = models.CharField(max_length=50, blank=True)
    is_guest = models.BooleanField(default=False)
    guest_note = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        prefix = '[GUEST]' if self.is_guest else ''
        return f'{prefix} {self.event_type} {self.plate_number} @ {self.timestamp}'


class CorrectionRecord(models.Model):
    log = models.OneToOneField(
        ParkingLog, on_delete=models.CASCADE, related_name='correction'
    )
    original_ocr_text = models.CharField(max_length=60)
    corrected_plate = models.CharField(max_length=60)
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True
    )
    note = models.TextField(blank=True)
    corrected_at = models.DateTimeField(auto_now_add=True)