"""
Call Number model
"""
from sqlalchemy import Column, Integer, String, DateTime
import datetime

from ..config.database import Base


class CallNumber(Base):
    """Call number database model"""
    __tablename__ = "call_number"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, index=True)
    prefix = Column(String, index=True)
    status = Column(String, nullable=False, index=True)
    counter = Column(String, nullable=True, index=True)
    service_type = Column(String, nullable=True, index=True)
    created_date = Column(DateTime, default=datetime.datetime.now, index=True)
    updated_date = Column(DateTime, default=datetime.datetime.now, index=True)
