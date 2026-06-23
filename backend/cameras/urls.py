from django.urls import path
from .views import SystemSettingsView, CameraListView, CameraDetailView

urlpatterns = [
    path('settings/', SystemSettingsView.as_view()),
    path('', CameraListView.as_view()),
    path('<int:pk>/', CameraDetailView.as_view()),
]