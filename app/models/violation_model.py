from sqlalchemy import Column, Integer, String, DateTime
from app.database.db import Base

class Violation(Base):
    __tablename__ = "violations"
    __table_args__ = {"extend_existing": True}  # Allow modifying an existing table
    
    id = Column(Integer, primary_key=True, index=True)
    id_detect = Column(Integer,  nullable=True)
    license_plate = Column(String, nullable=True)
    timestamp = Column(DateTime, nullable=True)
    image_path = Column(String, nullable=True)