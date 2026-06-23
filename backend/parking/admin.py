from django.contrib import admin
from .models import ParkingLog, CorrectionRecord
# Register your models here.
admin.site.register(ParkingLog)
admin.site.register(CorrectionRecord)