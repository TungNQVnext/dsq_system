"""
User model
"""
from sqlalchemy import Column, String

from ..config.database import Base
from ..core.security import verify_password


class User(Base):
    """User database model"""
    __tablename__ = "user"

    username = Column(String, primary_key=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)

    def verify_password(self, password: str) -> bool:
        """Verify user password"""
        return verify_password(password, self.password_hash)
