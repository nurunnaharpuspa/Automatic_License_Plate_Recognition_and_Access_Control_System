from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from .models import SystemSettings, CameraConfig
from .serializers import SystemSettingsSerializer, CameraConfigSerializer
from accounts.permissions import IsAdmin


class SystemSettingsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(SystemSettingsSerializer(SystemSettings.get()).data)

    def patch(self, request):
        settings_obj = SystemSettings.get()
        serializer = SystemSettingsSerializer(
            settings_obj, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class CameraListView(generics.ListCreateAPIView):
    serializer_class = CameraConfigSerializer
    permission_classes = [IsAdmin]
    queryset = CameraConfig.objects.all()


class CameraDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CameraConfigSerializer
    permission_classes = [IsAdmin]
    queryset = CameraConfig.objects.all()