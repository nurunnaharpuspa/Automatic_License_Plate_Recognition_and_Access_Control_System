import re
import unicodedata
from thefuzz import process

def correcting_bangla_text(text):
    DISTRICTS = [
        # Dhaka Division
        "ঢাকা", "গাজীপুর", "নারায়ণগঞ্জ", "নরসিংদী", "মানিকগঞ্জ", "মুন্সীগঞ্জ",
        "রাজবাড়ী", "মাদারীপুর", "শরীয়তপুর", "ফরিদপুর", "গোপালগঞ্জ", "টাঙ্গাইল", "কিশোরগঞ্জ",

        # Chattogram Division
        "চট্ট", "কক্সবাজার", "ব্রাহ্মণবাড়িয়া", "চাঁদপুর", "লক্ষ্মীপুর", "নোয়াখালী",
        "ফেনী", "খাগড়াছড়ি", "রাঙ্গামাটি", "বান্দরবান", "কুমিল্লা",

        # Rajshahi Division
        "রাজশাহী", "নাটোর", "নওগাঁ", "পাবনা", "সিরাজগঞ্জ", "বগুড়া", "জয়পুরহাট", "চাঁপাইনবাবগঞ্জ",

        # Khulna Division
        "খুলনা", "যশোর", "ঝিনাইদহ", "মাগুরা", "নড়াইল", "বাগেরহাট", "সাতক্ষীরা", "চুয়াডাঙ্গা", "কুষ্টিয়া", "মেহেরপুর",

        # Barishal Division
        "বরিশাল", "ভোলা", "পটুয়াখালী", "পিরোজপুর", "ঝালকাঠি", "বরগুনা",

        # Sylhet Division
        "সিলেট", "মৌলভীবাজার", "হবিগঞ্জ", "সুনামগঞ্জ",

        # Rangpur Division
        "রংপুর", "দিনাজপুর", "কুড়িগ্রাম", "গাইবান্ধা", "নীলফামারী", "পঞ্চগড়", "ঠাকুরগাঁও", "লালমনিরহাট",

        # Mymensingh Division
        "ময়মনসিংহ", "জামালপুর", "নেত্রকোণা", "শেরপুর"
    ]
    metro = "মেট্রো"


    header = unicodedata.normalize('NFKC', text).replace(" ", "")

    best_district, score = process.extractOne(header, DISTRICTS)
    final_district = best_district if score > 60 else None
    # for c in final_district:
    #     header = header.replace(c, "")
    #     print("AFTER REMOVE 'district'")
    #     print(header)

    is_metro = False
    metro_exists, metro_score = process.extractOne(header, [metro])
    is_metro = True if metro_score > 60 else False

    # for c in metro:
    #     print("c: ", c)
    #     hearder = header.replace(c, "")
    #     print("AFTER REMOVE 'metro'")
    #     print(header)

    to_remove = final_district + metro if final_district and metro else final_district if final_district else metro
    series_letter = ""
    for char in header:
        if char not in to_remove and char not in "-_।.,":
            series_letter += char
    # series_letter = re.sub(r'[^\u0980-\u09FF]', '', header)
    print("'series': ")
    print(series_letter)
    series_letter = series_letter[0] if series_letter else "Unknown"

    return {
        "district": final_district,
        "score": score,
        "is_metro": is_metro,
        "metro_score": metro_score,
        "series": series_letter
    }