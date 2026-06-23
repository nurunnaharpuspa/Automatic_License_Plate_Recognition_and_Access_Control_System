import easyocr
import re
import unicodedata
from .text_correction import correcting_bangla_text

_reader = None


def get_reader():
    global _reader
    if _reader is None:
        # gpu=False is safer for most dev environments; set True if CUDA available
        _reader = easyocr.Reader(['bn'], gpu=False)
    return _reader


def read_plate(cropped_image):
    """
    Returns (plate_text: str | None, confidence: float).
    """
    reader = get_reader()

    try:
        results = reader.readtext(cropped_image)
    except Exception:
        return None, 0.0

    if not results:
        return None, 0.0

    final_plate_text = ""
    numbers = ""
    for line in results:
        detected_text = line[1] # Extract the text from the tuple

        # Check if the detected text contains Bengali characters
        if re.search(r'[\u0985-\u09B9]', detected_text):
            corrected_bangla_text = correcting_bangla_text(detected_text)
            district_part = corrected_bangla_text['district'] if corrected_bangla_text['district'] else ""
            series_part = corrected_bangla_text['series'] if corrected_bangla_text['series'] else ""

            if corrected_bangla_text['is_metro']:
                final_plate_text += f"{district_part} মেট্রো-{series_part}"
            else:
                final_plate_text += f"{district_part}-{series_part}"
        else:
            clean_numbers = re.sub(r'[^\u09E6-\u09EF0-9-]', '', detected_text)
            numbers = clean_numbers if clean_numbers else ""

        confidence = sum(line[2] for line in results) / len(results)

    return final_plate_text, numbers if final_plate_text and numbers else None, round(confidence, 4)

