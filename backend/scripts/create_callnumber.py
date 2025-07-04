from db.database import Base, engine
from models import user, call_number

Base.metadata.create_all(bind=engine)
