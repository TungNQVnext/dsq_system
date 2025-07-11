from sqlalchemy import Column, Integer, String, Date
from db.database import Base
import datetime

class CallNumber(Base):
    __tablename__ = "call_number"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, index=True)
    prefix = Column(String, index=True)
    status = Column(String, nullable=False)
    created_date = Column(Date, default=datetime.date.today, index=True)
