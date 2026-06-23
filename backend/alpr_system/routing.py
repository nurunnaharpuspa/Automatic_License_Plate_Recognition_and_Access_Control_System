from django.urls import path
from consumers.events import EventConsumer

websocket_urlpatterns = [
    path('ws/events/', EventConsumer.as_asgi()),
]