import argparse
import json
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models.writing import WritingQuestion


CATEGORY = "discussion"
TARGET_COUNT = 10
DATA_FILE = Path(__file__).with_name("discussion_questions.json")


def normalise(value):
    return " ".join(value.split()).casefold()


def import_questions(apply=False):
    items = json.loads(DATA_FILE.read_text(encoding="utf-8-sig"))

    with SessionLocal() as db:
        existing = db.scalars(
            select(WritingQuestion).where(
                WritingQuestion.category == CATEGORY,
                WritingQuestion.task == "task2",
            )
        ).all()

        published_count = sum(row.status == "published" for row in existing)
        seen_titles = {normalise(row.title) for row in existing}
        seen_prompts = {normalise(row.prompt) for row in existing}
        remaining = max(0, TARGET_COUNT - published_count)

        planned = []

        for item in items:
            if len(planned) >= remaining:
                break

            title = normalise(item["title"])
            prompt = normalise(item["prompt"])

            if title in seen_titles or prompt in seen_prompts:
                continue

            planned.append(item)
            seen_titles.add(title)
            seen_prompts.add(prompt)

        print(f"Published Discussion questions now: {published_count}")
        print(f"Questions to add: {len(planned)}")

        for item in planned:
            print(f"  - {item['title']}")

        if not apply:
            print("Preview only. No changes were made.")
            return

        db.add_all(
            [
                WritingQuestion(
                    category=CATEGORY,
                    task="task2",
                    test_type="both",
                    title=item["title"],
                    prompt=item["prompt"],
                    points=None,
                    status="published",
                    source_type="original",
                )
                for item in planned
            ]
        )
        db.commit()

        print(f"Questions added: {len(planned)}")
        print(f"Published Discussion total: {published_count + len(planned)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    import_questions(apply=args.apply)