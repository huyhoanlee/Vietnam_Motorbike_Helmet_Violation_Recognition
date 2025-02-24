from sqlalchemy import Column, Integer, String, DateTime
from src.database.db import Base

class Violation(Base):
    __tablename__ = "violations"
    id = Column(Integer, primary_key=True, index=True)
    id_detect = Column(Integer,  nullable=True)
    license_plate = Column(String, nullable=True)
    timestamp = Column(DateTime, nullable=True)
    image_path = Column(String, nullable=True)