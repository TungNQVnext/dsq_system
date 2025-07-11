from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint
from db.database import Base
import datetime

class CallNumber(Base):
    __tablename__ = "call_number"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, index=True)
    prefix = Column(String, index=True)
    status = Column(String, nullable=False, index=True)
    created_date = Column(DateTime, default=datetime.datetime.now, index=True)
    updated_date = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now, index=True)
    
    # Thêm unique constraint cho number để tránh duplicate
    __table_args__ = (
        UniqueConstraint('number', name='unique_call_number'),
    )
