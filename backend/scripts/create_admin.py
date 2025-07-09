from db.database import SessionLocal
from models.user import User
from routes.login.ultis import hash_password

db = SessionLocal()

username = "admin1"
plain_password = "admin123"
role = "admin"

existing = db.query(User).filter(User.username == username).first()
if existing:
    print(f"User '{username}' already existed.")
else:
    user = User(
        username=username,
        password_hash=hash_password(plain_password),
        role=role
    )
    db.add(user)
    db.commit()

db.close()
