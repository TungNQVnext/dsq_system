from sqlalchemy import Column, String
from db.database import Base
from authentication.utils import verify_password

class User(Base):
    __tablename__ = "user"

    username = Column(String, primary_key=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)

    def verify_password(self, password: str) -> bool:
        return verify_password(password, self.password_hash)