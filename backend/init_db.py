from sqlalchemy import create_engine
from models import Base
import os

DATABASE_URL = "sqlite:///./agrimitra_v2.db"

def init_db():
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    print("Database initialized.")

if __name__ == "__main__":
    init_db()
