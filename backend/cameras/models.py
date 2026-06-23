from django.db import models


class CameraConfig(models.Model):
    DIRECTION_CHOICES = [
        ('ENTRY', 'Entry'),
        ('EXIT', 'Exit'),
        ('BOTH', 'Both'),
    ]

    camera_id = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)
    direction = models.CharField(max_length=5, choices=DIRECTION_CHOICES)
    stream_url = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.label} ({self.camera_id})'


class SystemSettings(models.Model):
    MODE_CHOICES = [
        ('VIDEO_UPLOAD', 'Video Upload'),
        ('SINGLE_CAMERA', 'Single Camera'),
        ('DUAL_CAMERA', 'Dual Camera'),
    ]

    confidence_threshold = models.FloatField(default=0.85)
    frame_sample_rate = models.IntegerField(default=5)
    input_mode = models.CharField(
        max_length=15, choices=MODE_CHOICES, default='VIDEO_UPLOAD'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'System Settings'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj