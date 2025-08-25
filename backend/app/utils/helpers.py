"""
Helper functions and utilities
"""
import datetime
from typing import Optional, List

from .constants import DAY_NAMES, MONTH_NAMES, SERVICE_TYPE_MAP


def format_datetime_vietnamese(dt: datetime.datetime) -> tuple[str, str]:
    """Format datetime in Vietnamese format"""
    day_of_week = DAY_NAMES[dt.weekday() + 1] if dt.weekday() < 6 else DAY_NAMES[0]
    day = dt.day
    month = MONTH_NAMES[dt.month - 1]
    year = dt.year
    time_str = dt.strftime('%H:%M:%S')
    
    formatted_date = f"{day_of_week}, {day} {month}, {year}"
    timestamp = f"{time_str}"
    
    return formatted_date, timestamp


def format_service_type(service_type: Optional[str], prefix: str) -> str:
    """Format service type for display"""
    if not service_type:
        return 'VISA' if prefix == 'V' else 'GENERAL SERVICE'
    
    services = service_type.split(',')
    
    if len(services) == 1:
        return SERVICE_TYPE_MAP.get(services[0], 'VISA')
    else:
        # Việt Nam: Hiển thị tất cả dịch vụ đã chọn
        if prefix == 'V':
            service_names = [SERVICE_TYPE_MAP.get(service.strip(), service.strip()) for service in services]
            return ', '.join(service_names)
        else:
            return 'NHIỀU DỊCH VỤ'


def parse_services_list(service_type: Optional[str]) -> List[str]:
    """Parse service type string into list of services"""
    if not service_type:
        return []
    return service_type.split(',')


def get_nationality_text(prefix: str) -> str:
    """Get nationality text based on prefix"""
    return "Việt Nam" if prefix == "V" else "Quốc tịch khác"
