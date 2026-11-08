import argparse

from sqlalchemy import select

from app.database import SessionLocal
from app.import_pie_questions import CHART_DIR, QUESTIONS, make_chart
from app.models.writing import WritingQuestion


YEARS = {
    "household-budget": (2005, 2020),
    "electricity-sources": (2010, 2024),
    "library-loans": (2012, 2022),
    "visitor-origins": (2014, 2019),
    "university-travel": (2008, 2023),
    "household-waste": (2000, 2018),
    "sports-funding": (2016, 2021),
    "holiday-stays": (2006, 2016),
    "park-visits": (2018, 2024),
    "clothing-sales": (2011, 2025),
}


def update_years(apply=False):
    with SessionLocal() as db:
        rows = db.scalars(
            select(WritingQuestion).where(
                WritingQuestion.category == "pie",
                WritingQuestion.task == "task1",
                WritingQuestion.test_type == "academic",
                WritingQuestion.status == "published",
            )
        ).all()
        by_title = {row.title: row for row in rows}
        planned = []

        for slug, title, description, labels, first, second in QUESTIONS:
            question = by_title.get(title)
            filename = f"{slug}.svg"
            expected_url = f"/images/writing/pie/{filename}"

            if question is None or question.visual_url != expected_url:
                print(f"Skipped: {title} — matching imported question not found")
                continue

            first_year, second_year = YEARS[slug]
            chart = make_chart(title, labels, first, second)
            chart = chart.replace(">2015</text>", f">{first_year}</text>")
            chart = chart.replace(">2025</text>", f">{second_year}</text>")

            prompt = (
                f"The pie charts show {description} in "
                f"{first_year} and {second_year}. "
                "Summarise the information by selecting and reporting "
                "the main features, and make comparisons where relevant. "
                "Write at least 150 words."
            )

            planned.append((question, CHART_DIR / filename, chart, prompt))
            print(f"{title}: {first_year} / {second_year}")

        print(f"Pie chart questions matched: {len(planned)}")

        if not apply:
            print("Preview only. No changes were made.")
            return

        if len(planned) != len(QUESTIONS):
            raise SystemExit("Update stopped: not all imported questions matched.")

        CHART_DIR.mkdir(parents=True, exist_ok=True)

        for question, path, chart, prompt in planned:
            path.write_text(chart, encoding="utf-8")
            question.prompt = prompt

        db.commit()
        print(f"Updated {len(planned)} pie chart questions and images.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    update_years(apply=args.apply)