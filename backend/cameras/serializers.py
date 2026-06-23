from rest_framework import serializers
from .models import CameraConfig, SystemSettings


class CameraConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = CameraConfig
        fields = '__all__'


class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = [
            'confidence_threshold', 'frame_sample_rate',
            'input_mode', 'updated_at'
        ]
        read_only_fields = ['updated_at']