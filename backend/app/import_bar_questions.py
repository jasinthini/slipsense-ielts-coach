import argparse
import json
from html import escape
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models.writing import WritingQuestion


DATA_FILE = Path(__file__).with_name("bar_questions.json")
CHART_DIR = (
    Path(__file__).resolve().parents[2]
    / "frontend" / "public" / "images" / "writing" / "bar"
)
TARGET_COUNT = 10


def normalise(value):
    return " ".join(value.split()).casefold()


def make_chart(item):
    navy = "#164878"
    blue = "#78b9ee"
    bottom = 345
    plot_height = 220

    def text(x, y, value, size=14, anchor="start"):
        return (
            f'<text x="{x}" y="{y}" font-size="{size}" '
            f'text-anchor="{anchor}">{escape(str(value))}</text>'
        )

    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 420" '
        'width="760" height="420" role="img">',
        f'<title>{escape(item["title"])}</title>',
        '<rect width="760" height="420" fill="#ffffff"/>',
        '<g font-family="Arial, sans-serif" fill="#143454">',
        text(38, 35, item["title"], 23),
        text(38, 63, item["unit"], 15),
    ]

    for x, series, colour in (
        (38, item["first"], navy),
        (144, item["second"], blue),
    ):
        svg.append(f'<rect x="{x}" y="82" width="17" height="17" fill="{colour}"/>')
        svg.append(text(x + 25, 96, series["year"]))

    for value in range(0, 101, 20):
        y = bottom - value * plot_height / 100
        svg.append(
            f'<line x1="60" y1="{y}" x2="724" y2="{y}" '
            'stroke="#cddcea"/>'
        )
        svg.append(text(51, y + 5, value, anchor="end"))

    for index, label in enumerate(item["labels"]):
        centre = 126 + index * 132
        svg.append(text(centre, 373, label, 14, "middle"))

        for shift, series, colour in (
            (-37, item["first"], navy),
            (4, item["second"], blue),
        ):
            value = series["values"][index]
            height = value * plot_height / 100
            x = centre + shift
            y = bottom - height
            svg.append(
                f'<rect x="{x}" y="{y}" width="33" '
                f'height="{height}" fill="{colour}"/>'
            )
            svg.append(text(x + 16.5, y - 6, value, 13, "middle"))

    svg.append(text(38, 405, "Band Buddy practice · Fictional data", 12))
    svg.append("</g></svg>")
    return "\n".join(svg)


def import_questions(apply=False):
    items = json.loads(DATA_FILE.read_text(encoding="utf-8-sig"))

    with SessionLocal() as db:
        existing = db.scalars(
            select(WritingQuestion).where(
                WritingQuestion.category == "bar",
                WritingQuestion.task == "task1",
                WritingQuestion.test_type == "academic",
            )
        ).all()

        published_count = sum(row.status == "published" for row in existing)
        seen_titles = {normalise(row.title) for row in existing}
        remaining = max(0, TARGET_COUNT - published_count)
        planned = []

        for item in items:
            if len(planned) >= remaining:
                break

            title = normalise(item["title"])
            if title in seen_titles:
                continue

            planned.append(item)
            seen_titles.add(title)

        print(f"Published Bar chart questions now: {published_count}")
        print(f"Questions to add: {len(planned)}")

        for item in planned:
            print(f"  - {item['title']}")

        if not apply:
            print("Preview only. No changes were made.")
            return

        if planned:
            CHART_DIR.mkdir(parents=True, exist_ok=True)

        for item in planned:
            filename = f'{item["slug"]}.svg'
            (CHART_DIR / filename).write_text(make_chart(item), encoding="utf-8")

            db.add(
                WritingQuestion(
                    category="bar",
                    task="task1",
                    test_type="academic",
                    title=item["title"],
                    prompt=(
                        "The bar chart shows the figures for five categories "
                        f'in {item["first"]["year"]} and {item["second"]["year"]}. '
                        "Summarise the information by selecting and reporting "
                        "the main features, and make comparisons where relevant. "
                        "Write at least 150 words."
                    ),
                    points=None,
                    visual_url=f"/images/writing/bar/{filename}",
                    status="published",
                    source_type="original",
                )
            )

        db.commit()
        print(f"Questions added: {len(planned)}")
        print(f"Published Bar chart total: {published_count + len(planned)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    import_questions(apply=args.apply)