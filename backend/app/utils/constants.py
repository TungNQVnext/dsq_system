"""
Application constants
"""

# User roles
class UserRoles:
    ADMIN = "admin"
    STAFF = "staff"
    
    @classmethod
    def all(cls):
        return [cls.ADMIN, cls.STAFF]


# Call number prefixes
class CallNumberPrefixes:
    VIETNAM = "V"
    OTHER = "N"
    
    @classmethod
    def all(cls):
        return [cls.VIETNAM, cls.OTHER]


# Call number statuses
class CallNumberStatuses:
    READY = "ready"
    CALLED = "called"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    
    @classmethod
    def all(cls):
        return [cls.READY, cls.CALLED, cls.COMPLETED, cls.CANCELLED]


# Service types mapping
SERVICE_TYPE_MAP = {
    'visa': 'VISA',
    'passport': 'Hộ chiếu',
    'birth': 'Khai sinh',
    'marriage': 'Kết hôn', 
    'license': 'Bằng lái xe',
    'others': 'Các thủ tục khác',
    'authentication': 'CHỨNG THỰC', 
    'notarization': 'CÔNG CHỨNG',
    'civil_status': 'TÌNH TRẠNG DÂN SỰ',
    'other': 'DỊCH VỤ KHÁC'
}

# Date and time formatting
DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
MONTH_NAMES = ['thg 1', 'thg 2', 'thg 3', 'thg 4', 'thg 5', 'thg 6',
               'thg 7', 'thg 8', 'thg 9', 'thg 10', 'thg 11', 'thg 12']
