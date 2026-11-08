import argparse
import json
from html import escape
from math import ceil
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models.writing import WritingQuestion


DATA_FILE = Path(__file__).with_name("line_questions.json")
GRAPH_DIR = (
    Path(__file__).resolve().parents[2]
    / "frontend" / "public" / "images" / "writing" / "line"
)
TARGET_COUNT = 10


def make_graph(item):
    years = item["years"]
    series = item["series"]
    peak = max(max(values) for values in series.values())
    unit = 10 ** (len(str(peak)) - 1)
    step = max(1, ceil(peak / (5 * unit)) * unit)
    if "%" in item["unit"]:
        step = 20
    top = step * 5
    left, right, baseline, height = 70, 710, 340, 220

    def x(index):
        return left + index * (right - left) / (len(years) - 1)

    def y(value):
        return baseline - height * value / top

    def text(px, py, value, size=14, anchor="start"):
        return (
            f'<text x="{px}" y="{py}" font-size="{size}" '
            f'text-anchor="{anchor}">{escape(str(value))}</text>'
        )

    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 410" '
        'width="760" height="410">',
        f'<title>{escape(item["title"])}</title>',
        '<rect width="760" height="410" fill="#ffffff"/>',
        '<g font-family="Arial, sans-serif" fill="#143454">',
        text(34, 34, item["title"], 23),
        text(34, 59, item["unit"], 15),
    ]

    for value in range(0, top + 1, step):
        py = y(value)
        svg.append(
            f'<line x1="{left}" y1="{py}" x2="{right}" y2="{py}" '
            'stroke="#cfdfec"/>'
        )
        svg.append(text(left - 9, py + 5, value, anchor="end"))

    for i, label in enumerate(years):
        svg.append(text(x(i), baseline + 24, label, anchor="middle"))

    colours = ("#164878", "#3384bc")

    for i, (name, values) in enumerate(series.items()):
        colour = colours[i]
        dash = ' stroke-dasharray="8 5"' if i else ""
        legend_x = 38 + i * 210
        svg.append(
            f'<line x1="{legend_x}" y1="86" x2="{legend_x + 30}" y2="86" '
            f'stroke="{colour}" stroke-width="3"{dash}/>'
        )
        svg.append(text(legend_x + 40, 91, name))
        points = " ".join(f"{x(j):.1f},{y(v):.1f}" for j, v in enumerate(values))
        svg.append(
            f'<polyline points="{points}" fill="none" stroke="{colour}" '
            f'stroke-width="3"{dash}/>'
        )

        for j, value in enumerate(values):
            svg.append(f'<circle cx="{x(j)}" cy="{y(value)}" r="4" fill="{colour}"/>')

    svg.append(text(34, 394, "Band Buddy practice · Fictional data", 12))
    svg.append("</g></svg>")
    return "\n".join(svg)


def normalise(value):
    return " ".join(value.split()).casefold()


def import_questions(apply=False):
    items = json.loads(DATA_FILE.read_text(encoding="utf-8-sig"))

    with SessionLocal() as db:
        existing = db.scalars(
            select(WritingQuestion).where(
                WritingQuestion.category == "line",
                WritingQuestion.task == "task1",
                WritingQuestion.test_type == "academic",
            )
        ).all()

        published = sum(row.status == "published" for row in existing)
        remaining = max(0, TARGET_COUNT - published)
        seen = {normalise(row.title) for row in existing}
        planned = []

        for item in items:
            if len(planned) >= remaining:
                break

            title = normalise(item["title"])
            if title not in seen:
                planned.append(item)
                seen.add(title)

        print(f"Published Line graph questions now: {published}")
        print(f"Questions to add: {len(planned)}")
        for item in planned:
            print(f"  - {item['title']}")

        if not apply:
            print("Preview only. No changes were made.")
            return

        if planned:
            GRAPH_DIR.mkdir(parents=True, exist_ok=True)

        for item in planned:
            filename = f'{item["slug"]}.svg'
            (GRAPH_DIR / filename).write_text(make_graph(item), encoding="utf-8")

            db.add(
                WritingQuestion(
                    category="line",
                    task="task1",
                    test_type="academic",
                    title=item["title"],
                    prompt=(
                        "The line graph shows how the figures for two groups "
                        "changed over the period shown. Summarise the information "
                        "by selecting and reporting the main features, and make "
                        "comparisons where relevant. Write at least 150 words."
                    ),
                    points=None,
                    visual_url=f"/images/writing/line/{filename}",
                    status="published",
                    source_type="original",
                )
            )

        db.commit()
        print(f"Published Line graph total: {published + len(planned)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    import_questions(apply=args.apply)