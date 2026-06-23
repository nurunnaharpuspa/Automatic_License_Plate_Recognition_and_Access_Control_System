from rest_framework import serializers
from .models import ParkingLog, CorrectionRecord


class CorrectionRecordSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)

    class Meta:
        model = CorrectionRecord
        fields = [
            'original_ocr_text', 'corrected_plate',
            'staff_name', 'note', 'corrected_at'
        ]


class ParkingLogSerializer(serializers.ModelSerializer):
    correction = CorrectionRecordSerializer(read_only=True)
    owner_name = serializers.SerializerMethodField()
    owner_user_id = serializers.SerializerMethodField()

    class Meta:
        model = ParkingLog
        fields = [
            'id', 'plate_number', 'event_type', 'timestamp',
            'raw_ocr_text', 'confidence_score', 'status',
            'image_path', 'camera_id', 'owner_name',
            'owner_user_id', 'correction', 'is_guest', 'guest_note'
        ]

    def get_owner_name(self, obj):
        return obj.vehicle.owner.full_name if obj.vehicle else None

    def get_owner_user_id(self, obj):
        return obj.vehicle.owner.user_id if obj.vehicle else None


class GuestLogSerializer(serializers.Serializer):
    plate_number = serializers.CharField(max_length=20)
    event_type   = serializers.ChoiceField(choices=['ENTRY', 'EXIT'])
    guest_note   = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')


class CorrectionSubmitSerializer(serializers.Serializer):
    corrected_plate = serializers.CharField(
        max_length=100,
        min_length=1,
        trim_whitespace=True,
    )
    note = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        max_length=500,
    )

    def validate_corrected_plate(self, value):
        cleaned = value.strip().upper()
        if not cleaned:
            raise serializers.ValidationError('Plate number cannot be empty.')
        return cleaned