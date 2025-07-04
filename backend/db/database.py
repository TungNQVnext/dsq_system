from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABSE_URL = "sqlite:///../dsq.db"

engine = create_engine(
    DATABSE_URL, connect_args={"check_same_thread": False}
)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
SessionLocal = sessionmaker(autocommit=False,autoflush=False, bind=engine)
Base = declarative_base()