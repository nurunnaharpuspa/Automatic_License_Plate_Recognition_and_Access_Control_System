from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, CreateStaffView, PendingUsersView, AllUsersView,
    UserApprovalView, CurrentUserView, DeleteUserView
)

urlpatterns = [
    path('register/',               RegisterView.as_view()),
    path('staff/create/',           CreateStaffView.as_view()),
    path('login/',                  TokenObtainPairView.as_view()),
    path('token/refresh/',          TokenRefreshView.as_view()),
    path('me/',                     CurrentUserView.as_view()),
    path('users/',                  AllUsersView.as_view()),
    path('users/pending/',          PendingUsersView.as_view()),
    path('users/<int:pk>/approval/', UserApprovalView.as_view()),
    path('users/<int:pk>/delete/',  DeleteUserView.as_view()),
]