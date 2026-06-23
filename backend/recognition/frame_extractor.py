import cv2


def extract_frames(video_path, sample_rate=5):
    """
    Generator — yields (frame_index, frame) for every Nth frame.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f'Cannot open video: {video_path}')

    frame_index = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_index % sample_rate == 0:
            yield frame_index, frame
        frame_index += 1

    cap.release()