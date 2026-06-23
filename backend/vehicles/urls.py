from django.urls import path
from .views import MyVehiclesView, AllVehiclesView, PendingVehiclesView, VehicleApprovalView

urlpatterns = [
    path('my/', MyVehiclesView.as_view()),
    path('all/', AllVehiclesView.as_view()),
    path('pending/', PendingVehiclesView.as_view()),
    path('<int:pk>/approval/', VehicleApprovalView.as_view()),
]