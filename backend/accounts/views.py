from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import (
    RegisterSerializer, UserSerializer,
    UserApprovalSerializer, CreateStaffSerializer
)
from .permissions import IsAdmin, IsAdminOrStaff

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class CreateStaffView(generics.CreateAPIView):
    """Admin creates a staff account directly — no approval needed."""
    serializer_class = CreateStaffSerializer
    permission_classes = [IsAdmin]


class PendingUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrStaff]

    def get_queryset(self):
        return User.objects.filter(status='PENDING', role='USER').order_by('-created_at')


class AllUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return User.objects.all().order_by('-created_at')


class UserApprovalView(generics.UpdateAPIView):
    serializer_class = UserApprovalSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = User.objects.filter(role='USER')
    http_method_names = ['patch']


class CurrentUserView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class DeleteUserView(generics.DestroyAPIView):
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return User.objects.exclude(role='ADMIN')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.id == request.user.id:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=400
            )
        self.perform_destroy(instance)
        return Response({'message': 'User deleted.'}, status=200)