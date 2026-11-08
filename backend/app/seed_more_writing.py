from sqlalchemy import select

from app.database import SessionLocal
from app.models.writing import WritingQuestion


QUESTIONS = [
    {
        "category": "discussion",
        "task": "task2",
        "test_type": "both",
        "title": "Technology and communication",
        "prompt": (
            "Some people think that technology helps people build "
            "stronger relationships, while others believe it makes "
            "people feel more isolated. Discuss both views and "
            "give your own opinion."
        ),
        "points": None,
    },
    {
        "category": "discussion",
        "task": "task2",
        "test_type": "both",
        "title": "A shared responsibility",
        "prompt": (
            "Some people believe that governments should take the "
            "main responsibility for protecting the environment. "
            "Others think that individuals have an equally important "
            "role. Discuss both views and give your own opinion."
        ),
        "points": None,
    },
    {
        "category": "opinion",
        "task": "task2",
        "test_type": "both",
        "title": "Public spaces in cities",
        "prompt": (
            "Cities should spend more money on public parks and "
            "libraries than on building new shopping centres. "
            "To what extent do you agree or disagree?"
        ),
        "points": None,
    },
    {
        "category": "opinion",
        "task": "task2",
        "test_type": "both",
        "title": "Flexible working",
        "prompt": (
            "Allowing employees to choose their working hours "
            "benefits both workers and employers. "
            "To what extent do you agree or disagree?"
        ),
        "points": None,
    },
    {
        "category": "letters",
        "task": "task1",
        "test_type": "general",
        "title": "Help a friend settle in",
        "prompt": (
            "A friend is moving to your town to study. "
            "Write a letter to your friend."
        ),
        "points": [
            "Describe the town.",
            "Suggest a suitable place to live.",
            "Offer to help when your friend arrives.",
        ],
    },
    {
        "category": "letters",
        "task": "task1",
        "test_type": "general",
        "title": "Suggest library improvements",
        "prompt": (
            "You regularly use a local library and have some ideas "
            "for improving it. Write a letter to the library manager."
        ),
        "points": [
            "Explain how you use the library.",
            "Describe an improvement you would like.",
            "Explain how it would help library users.",
        ],
    },
]


def add_questions():
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

                db.add(
                    WritingQuestion(
                        **item,
                        status="published",
                        source_type="original",
                    )
                )
                added += 1

            db.commit()

        except Exception:
            db.rollback()
            raise

    print(f"New writing questions added: {added}")


if __name__ == "__main__":
    add_questions()