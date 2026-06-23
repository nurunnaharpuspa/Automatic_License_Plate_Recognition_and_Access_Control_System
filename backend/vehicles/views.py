from rest_framework import generics
from .models import Vehicle
from .serializers import VehicleSerializer, VehicleApprovalSerializer
from accounts.permissions import IsAdminOrStaff, IsActiveUser


class MyVehiclesView(generics.ListCreateAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [IsActiveUser]

    def get_queryset(self):
        return Vehicle.objects.filter(owner=self.request.user).order_by('-registered_at')


class AllVehiclesView(generics.ListAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = Vehicle.objects.all().order_by('-registered_at')


class PendingVehiclesView(generics.ListAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [IsAdminOrStaff]

    def get_queryset(self):
        return Vehicle.objects.filter(status='PENDING').order_by('-registered_at')


class VehicleApprovalView(generics.UpdateAPIView):
    serializer_class = VehicleApprovalSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = Vehicle.objects.all()
    http_method_names = ['patch']