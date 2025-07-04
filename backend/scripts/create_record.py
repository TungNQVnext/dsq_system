from sqlalchemy.orm import Session
from datetime import datetime,timezone
from models.record import Record
from db.database import SessionLocal,engine
from models.record import Base

now = datetime.now()
Base.metadata.create_all(bind=engine)
# Kết nối DB
db: Session = SessionLocal()

# Danh sách dữ liệu mẫu
sample_records = [
    {
        "record_number": 1,
        "full_name": "Nguyễn Văn A",
        "service_type": "passport",
        "status": "chờ xử lý",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 2,
        "full_name": "Trần Thị B",
        "service_type": "visa",
        "status": "đã xử lý",
        "nationality": "ja",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 3,
        "full_name": "Lê Văn C",
        "service_type": "notarization",
        "status": "hoàn thành",
        "nationality": "en",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 4,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 5,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 6,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 7,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 8,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 9,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 10,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 11,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 12,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 13,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 14,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 15,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
    {
        "record_number": 16,
        "full_name": "Phạm Thị D",
        "service_type": "passport",
        "status": "chờ nhận",
        "nationality": "vn",
        "created_by": "admin",
        "updated_by": "admin",
    },
]

for r in sample_records:
    record = Record(
        record_number=r["record_number"],
        full_name=r["full_name"],
        service_type=r["service_type"],
        status=r["status"],
        nationality=r["nationality"],
        created_by=r["created_by"],
        updated_by=r["updated_by"],
        created_at=now,
        updated_at=now,
    )
    db.add(record)

db.commit()
print("✅ Đã tạo xong dữ liệu mẫu.")
