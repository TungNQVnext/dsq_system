"""
Record model
"""
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from ..config.database import Base


class Record(Base):
    """Record database model"""
    __tablename__ = "record"
    
    id = Column(Integer, primary_key=True, index=True)
    record_number = Column(Integer, nullable=False)
    full_name = Column(String, nullable=False)
    service_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    nationality = Column(String, nullable=False)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_by = Column(String, nullable=False)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
