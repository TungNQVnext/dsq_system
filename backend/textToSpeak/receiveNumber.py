import threading
import os
import logging
import queue
import re
import time
import tempfile
try:
    import pygame
    PYGAME_AVAILABLE = True
except ImportError:
    PYGAME_AVAILABLE = False
    print("Warning: pygame not available, audio features disabled")
from gtts import gTTS
import asyncio
import datetime
from websocket_backend.receive_number.call_number_utils import handle_reading_end

try:
    if PYGAME_AVAILABLE:
        pygame.mixer.init()
except (pygame.error, NameError) as e:
    print(f"Warning: pygame mixer init failed: {e}")
    PYGAME_AVAILABLE = False
    # Continue without audio support

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
            logger.warning(f"Could not push status to WebSocket (threadsafe): {e}")

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
    logger.info("Receive Number TTS worker started...")
    while True:
        try:
            number, lang, counter = appQueue.get(block=True)
            speak(number, lang, counter, status_callback=push_status_ws)
            appQueue.task_done()
        except Exception as e:
            logger.error(f"Error in Receive Number TTS worker: {e}")

def start_worker():
    if not hasattr(start_worker, "started"):
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        start_worker.started = True
        logger.info("Receive Number Worker thread launched once")

def add_to_queue(number, lang, counter):
    cleaned_number = normalize_number(number)
    logger.info(f"Adding number {cleaned_number} with language {lang} and counter {counter} to queue")
    appQueue.put((cleaned_number, lang, counter))
    logger.info(f"Queue size is now {appQueue.qsize()}")

def speak(number, lang, counter, status_callback=None):
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
                "counter": str(counter)
            }
        })
        status_callback({
            "type": "reading_start",
            "number": cleaned_number
        })

    try:
        if lang == "english":
            speak_english(tokens)
            speak_text(f"Please proceed to counter {int(counter):02d} for document reception.", "en")
        else:
            # --- 🇻🇳 Vietnamese ---
            time.sleep(time_sleep)
            # First read the introduction
            speak_text("Xin mời quý khách mang số", "vi")
            time.sleep(time_sleep)
            # Read number parts
            for token in tokens:
                vi_pronunciation = convert_to_vietnamese_pronunciation(token.lstrip('0') or '0')
                speak_text(vi_pronunciation, "vi")
                time.sleep(time_sleep)
            
            # Then read the instruction sentence
            vi_sentence = f"đến quầy số {counter} nộp hồ sơ"
            speak_text(vi_sentence, "vi")
            time.sleep(time_sleep)

            # --- 🇯🇵 Japanese ---
            time.sleep(time_sleep)
            # First read the introduction
            speak_text("番号", "ja")
            time.sleep(time_sleep)
            # Read number parts
            for token in tokens:
                ja_pronunciation = convert_to_japanese_pronunciation(token.lstrip('0') or '0')
                speak_text(ja_pronunciation, "ja")
                time.sleep(time_sleep)
            
            # Then read the instruction sentence
            ja_sentence = f"{counter}番窓口まで書類提出にお越しください"
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
                logger.info(f"sending reading_end for {cleaned_number}")
                handle_reading_end(cleaned_number)
            except Exception as e:
                logger.error(f"Error updating DB in TTS thread: {e}")

def speak_text(text, lang):
    """Convert text to speech and play it"""
    tmp_file = None
    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
            tmp_file_path = tmp_file.name
            tts.save(tmp_file_path)
            
        # Load and play the audio file
        pygame.mixer.music.load(tmp_file_path)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            time.sleep(0.1)
            
        # Ensure pygame has completely released the file
        pygame.mixer.music.unload()
        time.sleep(0.2)  # Give system time to release file handle
            
        # Clean up the temporary file
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
                    break
            except Exception as cleanup_error:
                if attempt == max_attempts - 1:  # Last attempt
                    logger.warning(f"Could not delete temp file {tmp_file_path} after {max_attempts} attempts: {cleanup_error}")
                else:
                    time.sleep(0.5)  # Wait before retry
            
    except Exception as e:
        logger.error(f"Error in TTS: {e}")
        # Try to clean up even if there was an error
        if tmp_file and hasattr(tmp_file, 'name') and os.path.exists(tmp_file.name):
            try:
                pygame.mixer.music.unload()
                time.sleep(0.2)
                os.unlink(tmp_file.name)
            except Exception as cleanup_error:
                logger.warning(f"Could not cleanup temp file after error: {cleanup_error}")

def speak_english(tokens):
    # First speak "Number"
    speak_text("Number", "en")
    time.sleep(time_sleep)
    
    # Then speak each token
    for token in tokens:
        pronunciation = convert_to_english_pronunciation(token)
        speak_text(pronunciation, "en")
        time.sleep(time_sleep)

def convert_to_english_pronunciation(input_str):
    """Convert number to English pronunciation"""
    if not input_str.isdigit():
        return input_str
    
    number = int(input_str.lstrip('0') or '0')
    digit_names = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
    
    if number < 10:
        return digit_names[number]
    elif number < 100:
        tens = number // 10
        ones = number % 10
        tens_names = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
        if tens == 1:
            teen_names = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
            return teen_names[ones]
        else:
            if ones == 0:
                return tens_names[tens]
            else:
                return f"{tens_names[tens]} {digit_names[ones]}"
    else:
        return ' '.join(digit_names[int(d)] for d in str(number))

def convert_to_japanese_pronunciation(input_str):
    """Convert number to Japanese pronunciation"""
    if not input_str.isdigit():
        return input_str
    
    number = int(input_str.lstrip('0') or '0')
    digit_names = ["ゼロ", "イチ", "ニ", "サン", "ヨン", "ゴ", "ロク", "ナナ", "ハチ", "キュウ"]
    
    if number < 10:
        return digit_names[number]
    elif number < 100:
        tens = number // 10
        ones = number % 10
        result = ""
        if tens > 0:
            if tens == 1:
                result += "ジュウ"
            else:
                result += digit_names[tens] + "ジュウ"
        if ones > 0:
            result += digit_names[ones]
        return result
    else:
        return ' '.join(digit_names[int(d)] for d in str(number))

def convert_to_vietnamese_pronunciation(input_str):
    """Convert number to Vietnamese pronunciation"""
    if not input_str.isdigit():
        return input_str
    
    number = int(input_str.lstrip('0') or '0')
    digit_names = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
    
    if number < 10:
        return digit_names[number]
    elif number < 100:
        tens = number // 10
        ones = number % 10
        result = ""
        if tens > 0:
            if tens == 1:
                result += "mười"
            else:
                result += digit_names[tens] + " mười"
        if ones > 0:
            if tens > 1 and ones == 1:
                result += " một"
            elif tens > 0 and ones == 5:
                result += " lăm"
            else:
                result += " " + digit_names[ones]
        return result.strip()
    else:
        return ' '.join(digit_names[int(d)] for d in str(number))
