from django.contrib import admin
from .models import CameraConfig, SystemSettings
# Register your models here.
admin.site.register(CameraConfig)
admin.site.register(SystemSettings)