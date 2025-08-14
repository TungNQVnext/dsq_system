import logging

logger = logging.getLogger(__name__)

def handle_reading_end(number_str: str):
    """Handle post-TTS cleanup for call numbers"""
    # Removed auto-update logic that was causing unwanted status changes
    logger.info(f"handle_reading_end called for: {number_str}")
    logger.info("Auto-update logic disabled to prevent unwanted status changes")
    return
