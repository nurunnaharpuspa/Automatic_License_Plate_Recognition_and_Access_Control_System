from django.urls import path
from .views import VideoUploadView, CameraFrameView

urlpatterns = [
    path('upload/', VideoUploadView.as_view()),
    path('frame/<str:camera_id>/', CameraFrameView.as_view()),
]