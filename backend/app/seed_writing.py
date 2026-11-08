from sqlalchemy import select

from app.database import SessionLocal
from app.models.writing import WritingQuestion


QUESTIONS = [
    {
        "category": "discussion",
        "task": "task2",
        "test_type": "both",
        "title": "Learning beyond the classroom",
        "prompt": (
            "Some people believe that practical skills should receive "
            "more attention than academic subjects at school. Others "
            "believe that academic subjects are more important. "
            "Discuss both views and give your own opinion."
        ),
        "points": None,
    },
    {
        "category": "opinion",
        "task": "task2",
        "test_type": "both",
        "title": "Life skills at school",
        "prompt": (
            "Schools should teach students how to manage money and "
            "solve everyday problems alongside academic subjects. "
            "To what extent do you agree or disagree?"
        ),
        "points": None,
    },
    {
        "category": "letters",
        "task": "task1",
        "test_type": "general",
        "title": "Ask about an English course",
        "prompt": (
            "You are interested in joining an English course at a "
            "local learning centre. Write a letter to the course "
            "coordinator."
        ),
        "points": [
            "Explain why you want to join the course.",
            "Describe the English skills you want to improve.",
            "Ask about the timetable and course fees.",
        ],
    },
]


def seed_questions():
    added = 0

    with SessionLocal() as db:
        try:
            for item in QUESTIONS:
                existing = db.scalar(
                    select(WritingQuestion).where(
                        WritingQuestion.category == item["category"],
                        WritingQuestion.title == item["title"],
                    )
                )

                if existing is not None:
                    continue

                question = WritingQuestion(
                    **item,
                    status="published",
                    source_type="original",
                )

                db.add(question)
                added += 1

            db.commit()

        except Exception:
            db.rollback()
            raise

    print(f"Writing questions added: {added}")


if __name__ == "__main__":
    seed_questions()