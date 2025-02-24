from src.database.db import SessionLocal, engine, Base
# from src.models.violation_model import Violation

# Tạo tất cả các bảng được định nghĩa trong Base
def create_tables():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    create_tables()
    print("Tables created successfully!")