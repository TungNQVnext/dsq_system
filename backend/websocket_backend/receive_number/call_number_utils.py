import logging
import datetime
import re
from sqlalchemy.orm import Session
from db.database import SessionLocal
from models.call_number import CallNumber

logger = logging.getLogger(__name__)

def handle_reading_end(number_str: str):
    """Handle post-TTS cleanup for call numbers"""
    numbers = re.findall(r"\d+", number_str)
    logger.info(f"handle_reading_end: numbers = {numbers}")
    if not numbers:
        logger.warning("No valid numbers extracted in handle_reading_end")
        return

    db = SessionLocal()
    try:
        for num in numbers:
            try:
                # Extract the base number from call number (e.g., V001 -> 1)
                call_number_id = int(num.lstrip("0") or "0")
                logger.info(f"Updating call_number_id: {call_number_id}")
            except ValueError:
                logger.warning(f"Skipped invalid number: {num}")
                continue
            
            # Find call number by the actual call number string, not ID
            call_number = db.query(CallNumber).filter(
                CallNumber.number.like(f"%{num}")
            ).first()
            
            if not call_number:
                logger.warning(f"No call number found for: {num}")
                continue
                
            if call_number.status != "serving":
                logger.info(f"Changing status of call number {call_number.number} to 'serving'")
                call_number.status = "serving"
                
        db.commit()
        logger.info("DB update committed for call numbers.")
    except Exception as e:
        logger.error(f"Error in handle_reading_end: {e}")
    finally:
        db.close()
