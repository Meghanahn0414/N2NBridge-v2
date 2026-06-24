"""
Auto-translate en.json → kn.json using deep-translator (free, no API key needed)

Install:  pip install deep-translator
Run:      python translate.py
"""

import json
import time
from pathlib import Path
from deep_translator import GoogleTranslator

translator = GoogleTranslator(source='en', target='kn')

def translate_value(value: str) -> str:
    """Translate a single string, preserving empty strings."""
    if not value or not value.strip():
        return value
    try:
        result = translator.translate(value)
        time.sleep(0.1)  # Small delay to avoid rate limiting
        return result or value
    except Exception as e:
        print(f"  ⚠ Could not translate '{value}': {e}")
        return value  # Fallback to original

def translate_dict(data: dict) -> dict:
    """Recursively translate all string values in a nested dict."""
    translated = {}
    for key, value in data.items():
        if isinstance(value, dict):
            print(f"  Translating section: {key}")
            translated[key] = translate_dict(value)
        elif isinstance(value, str):
            translated[key] = translate_value(value)
        else:
            translated[key] = value
    return translated

def process_file(en_path: Path, kn_path: Path):
    print(f"\n{'='*50}")
    print(f"Processing: {en_path}")
    print(f"Output:     {kn_path}")
    print(f"{'='*50}")

    with open(en_path, 'r', encoding='utf-8') as f:
        en_data = json.load(f)

    print("Translating English → Kannada...")
    kn_data = translate_dict(en_data)

    with open(kn_path, 'w', encoding='utf-8') as f:
        json.dump(kn_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Done! Saved to {kn_path}")

if __name__ == "__main__":
    base = Path(__file__).parent

    # Frontend
    frontend_en = base / "Frontend" / "src" / "i18n" / "en.json"
    frontend_kn = base / "Frontend" / "src" / "i18n" / "kn.json"

    # MobileApp
    mobile_en = base / "MobileApp" / "src" / "i18n" / "en.json"
    mobile_kn = base / "MobileApp" / "src" / "i18n" / "kn.json"

    if frontend_en.exists():
        process_file(frontend_en, frontend_kn)
    else:
        print(f"❌ Not found: {frontend_en}")

    if mobile_en.exists():
        process_file(mobile_en, mobile_kn)
    else:
        print(f"❌ Not found: {mobile_en}")

    print("\n🎉 All translations complete!")
    print("Restart your apps to see the changes.")
