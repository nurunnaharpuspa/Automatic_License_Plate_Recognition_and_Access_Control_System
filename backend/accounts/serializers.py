from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['user_id', 'email', 'full_name', 'password']

    def validate_user_id(self, value):
        if User.objects.filter(user_id=value).exists():
            raise serializers.ValidationError('An account with this ID already exists.')
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CreateStaffSerializer(serializers.ModelSerializer):
    """Used by admin to create staff — sets role=STAFF, status=ACTIVE immediately."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['user_id', 'email', 'full_name', 'password']

    def validate_user_id(self, value):
        if User.objects.filter(user_id=value).exists():
            raise serializers.ValidationError('This ID is already taken.')
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            role='STAFF',
            status='ACTIVE',
            **validated_data
        )


class UserSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(
        source='approved_by.full_name', read_only=True
    )

    class Meta:
        model = User
        fields = [
            'id', 'user_id', 'email', 'full_name', 'role',
            'status', 'created_at', 'approved_at', 'approved_by_name'
        ]
        read_only_fields = ['role', 'status', 'created_at', 'approved_at']


class UserApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['status']

    def validate_status(self, value):
        if value not in ('ACTIVE', 'SUSPENDED'):
            raise serializers.ValidationError('Status must be ACTIVE or SUSPENDED.')
        return value

    def update(self, instance, validated_data):
        instance.status = validated_data['status']
        if validated_data['status'] == 'ACTIVE':
            instance.approved_by  = self.context['request'].user
            instance.approved_at  = timezone.now()
        instance.save()
        return instance