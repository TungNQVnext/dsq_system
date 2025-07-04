import re
import datetime
import logging
from db.database import SessionLocal
from models.record import Record

logger = logging.getLogger(__name__)

def handle_reading_end(number_str: str):
    numbers = re.findall(r"\d+", number_str)
    logger.info(f" handle_reading_end: numbers = {numbers}")
    if not numbers:
        logger.warning(" No valid numbers extracted in handle_reading_end")
        return

    db = SessionLocal()
    try:
        for num in numbers:
            try:
                record_number = int(num.lstrip("0") or "0")
                logger.info(f" Updating record_number: {record_number}")
            except ValueError:
                logger.warning(f" Skipped invalid number: {num}")
                continue
            record = db.query(Record).filter(Record.record_number == record_number).first()
            if not record:
                logger.warning(f" No record found for: {record_number}")
                continue
            if record.status != "waiting_to_receive":
                logger.info(f" Changing status of record_number {record_number} to 'waiting_to_receive'")
                record.status = "waiting_to_receive"
                record.updated_at = datetime.datetime.utcnow()
        db.commit()
        logger.info("💾 DB update committed.")
    except Exception as e:
        logger.error(f" Error in handle_reading_end: {e}")
    finally:
        db.close()
