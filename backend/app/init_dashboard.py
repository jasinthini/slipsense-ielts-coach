from app.database import get_db
from app.models.user import User
from app.models.learning import LearningProfile


def main():
    database = get_db()
    db = next(database)

    try:
        LearningProfile.__table__.create(
            bind=db.get_bind(),
            checkfirst=True,
        )
        print("Dashboard table is ready.")
    finally:
        database.close()


if __name__ == "__main__":
    main()