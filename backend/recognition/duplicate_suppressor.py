import time
import threading


class DuplicateSuppressor:
    """
    Thread-safe in-memory duplicate suppressor.
    For production with multiple workers, replace with Redis-backed version.
    """

    def __init__(self, window_seconds=30):
        self.window = window_seconds
        self._seen = {}
        self._lock = threading.Lock()

    def is_duplicate(self, plate, camera_id):
        key = f'{camera_id}:{plate}'
        now = time.time()
        with self._lock:
            last_seen = self._seen.get(key, 0)
            if now - last_seen < self.window:
                return True
            self._seen[key] = now
            return False

    def clear_expired(self):
        now = time.time()
        with self._lock:
            self._seen = {
                k: v for k, v in self._seen.items()
                if now - v < self.window
            }


suppressor = DuplicateSuppressor()