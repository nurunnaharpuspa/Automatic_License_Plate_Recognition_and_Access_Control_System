from rest_framework import serializers
from django.utils import timezone
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_user_id = serializers.CharField(source='owner.user_id', read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'plate_number', 'make', 'model', 'color',
            'status', 'registered_at', 'owner', 'owner_name',
            'owner_user_id', 'reviewed_by', 'reviewed_at'
        ]
        read_only_fields = [
            'status', 'registered_at', 'owner',
            'reviewed_by', 'reviewed_at'
        ]

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class VehicleApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ['status']

    def validate_status(self, value):
        if value not in ('APPROVED', 'REJECTED'):
            raise serializers.ValidationError('Status must be APPROVED or REJECTED.')
        return value

    def update(self, instance, validated_data):
        instance.status = validated_data['status']
        instance.reviewed_by = self.context['request'].user
        instance.reviewed_at = timezone.now()
        instance.save()
        return instance