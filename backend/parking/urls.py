from django.urls import path
from .views import (
    AllLogsView, GroupedLogsView, MyLogsView, CurrentParkingStatusView,
    PendingCorrectionsView, SubmitCorrectionView, GuestLogView, UnregisteredApprovalView, CurrentlyParkedView,
)

urlpatterns = [
    path('logs/',                       AllLogsView.as_view()),
    path('logs/grouped/',               GroupedLogsView.as_view()),
    path('logs/currently-parked/',           CurrentlyParkedView.as_view()),
    path('my-logs/',                    MyLogsView.as_view()),
    path('my-status/',                  CurrentParkingStatusView.as_view()),
    path('corrections/pending/',        PendingCorrectionsView.as_view()),
    path('corrections/<int:pk>/submit/', SubmitCorrectionView.as_view()),
    path('guest/',                      GuestLogView.as_view()),
    path('logs/<int:pk>/review/',            UnregisteredApprovalView.as_view()),
]