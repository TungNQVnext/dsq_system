import threading
import os
import logging
import queue
import re
import time
import tempfile
import pygame
from gtts import gTTS
import asyncio
import datetime
from websocket_backend.record_utils import handle_reading_end

pygame.mixer.init()

appQueue = queue.Queue()
status_callback = None
main_loop = None
time_sleep = 0.5

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def set_status_callback(callback):
    global status_callback
    status_callback = callback

def set_main_loop(loop):
    global main_loop
    main_loop = loop

def push_status_ws(message):
    if status_callback and main_loop:
        try:
            asyncio.run_coroutine_threadsafe(status_callback(message), main_loop)
        except Exception as e:
            logger.warning(f" Could not push status to WebSocket (threadsafe): {e}")

def normalize_number(number_str):
    tokens = re.findall(r'\w+', number_str)
    cleaned_tokens = []
    seen = set()
    for token in tokens:
        if token not in seen:
            cleaned_tokens.append(token)
            seen.add(token)
    return ' '.join(cleaned_tokens)

def worker():
    logger.info(" TTS worker started...")
    while True:
        try:
            number, lang = appQueue.get(block=True)
            speak(number, lang, status_callback=push_status_ws)
            appQueue.task_done()
        except Exception as e:
            logger.error(f" Error in TTS worker: {e}")

def start_worker():
    if not hasattr(start_worker, "started"):
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        start_worker.started = True
        logger.info(" Worker thread launched once")

def add_to_queue(number, lang):
    cleaned_number = normalize_number(number)
    logger.info(f" Adding number {cleaned_number} with language {lang} to queue")
    appQueue.put((cleaned_number, lang))
    logger.info(f" Queue size is now {appQueue.qsize()}")

def speak(number, lang, status_callback=None):
    cleaned_number = normalize_number(number)
    tokens = cleaned_number.split()

    if not tokens:
        return

    if status_callback:
        logger.info(f"📢 sending reading_start for {cleaned_number}")
        status_callback({
            "type": "call",
            "number": cleaned_number,
            "metadata": {
                "language": lang,
                "timestamp": datetime.datetime.now().isoformat(),
                "counter": "3"
            }
        })
        status_callback({
            "type": "reading_start",
            "number": cleaned_number
        })

    try:
        if lang == "english":
            speak_english(tokens)
            speak_text("Please proceed to counter 03 for your result.", "en")
        else:
            # --- 🇻🇳 Vietnamese ---
            time.sleep(time_sleep)
            vi_parts = [convert_to_vietnamese_pronunciation(t.lstrip('0') or '0') for t in tokens]
            vi_sentence = f"Xin mời quý khách mang số hồ sơ {', '.join(vi_parts)} đến quầy số 3 nhận kết quả"
            speak_text(vi_sentence, "vi")
            time.sleep(time_sleep)

            # --- 🇯🇵 Japanese ---
            time.sleep(time_sleep)
            ja_parts = [convert_to_japanese_pronunciation(t.lstrip('0') or '0') for t in tokens]
            ja_sentence = f"書類番号 {'、'.join(ja_parts)} 3番窓口まで結果を受け取りにお越しください"
            speak_text(ja_sentence, "ja")
            time.sleep(time_sleep)

    except Exception as e:
        logger.error(f"Error during speaking: {e}")
    finally:
        if status_callback:
            push_status_ws({
                "type": "reading_end",
                "number": cleaned_number
            })
            try:
                logger.info(f" sending reading_end for {cleaned_number}")
                handle_reading_end(cleaned_number)
            except Exception as e:
                logger.error(f" Error updating DB in TTS thread: {e}")

def speak_text(text, lang):
    logger.info(f" Speaking: \"{text}\" [{lang}]")
    tmpfile = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    tmpfile_path = tmpfile.name
    tmpfile.close()

    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(tmpfile_path)

        pygame.mixer.music.load(tmpfile_path)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        pygame.mixer.music.unload()
    except Exception as e:
        logger.error(f"Error during speak_text: {e}")
    finally:
        if os.path.exists(tmpfile_path):
            os.remove(tmpfile_path)

def speak_english(tokens):
    first_token = tokens[0].lstrip('0') or '0'
    speak_text(f"Number", "en")
    time.sleep(0.5)
    speak_text(convert_to_english_pronunciation(first_token), "en")
    if len(tokens) > 1:
        time.sleep(time_sleep)
    for i, token in enumerate(tokens[1:]):
        speak_text(convert_to_english_pronunciation(token.lstrip('0') or '0'), "en")
        if i < len(tokens[1:]) - 1:
            time.sleep(time_sleep)

def convert_to_english_pronunciation(input_str):
    english_map = {
        '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three',
        '4': 'Four', '5': 'Five', '6': 'Six',
        '7': 'Seven', '8': 'Eight', '9': 'Nine',
    }
    return ' '.join(english_map[c] for c in input_str if c in english_map)

def convert_to_japanese_pronunciation(input_str):
    kana_map = {
        '0': 'ゼロ', '1': 'いち', '2': 'に', '3': 'さん',
        '4': 'よん', '5': 'ご', '6': 'ろく',
        '7': 'なな', '8': 'はち', '9': 'きゅう',
    }
    return '・'.join(kana_map[c] for c in input_str if c in kana_map)

def convert_to_vietnamese_pronunciation(input_str):
    vietnamese_map = {
        '0': 'không', '1': 'một', '2': 'hai', '3': 'ba',
        '4': 'bốn', '5': 'năm', '6': 'sáu',
        '7': 'bảy', '8': 'tám', '9': 'chín',
    }
    return ' '.join(vietnamese_map[c] for c in input_str if c in vietnamese_map)
