import argparse
from html import escape
from math import cos, radians, sin
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models.writing import WritingQuestion


CHART_DIR = (
    Path(__file__).resolve().parents[2]
    / "frontend" / "public" / "images" / "writing" / "pie"
)

# Each entry: filename, title, what the percentages represent,
# category labels, and percentage shares for 2015 and 2025.
QUESTIONS = [
    (
        "household-budget", "How households spent their money",
        "how households in a town divided their spending",
        ["Housing", "Food", "Transport", "Leisure", "Other"],
        [30, 25, 20, 10, 15], [36, 20, 16, 15, 13],
    ),
    (
        "electricity-sources", "Sources of electricity",
        "the sources of electricity generated in a region",
        ["Coal", "Gas", "Wind", "Solar", "Hydro"],
        [42, 30, 8, 5, 15], [18, 26, 22, 19, 15],
    ),
    (
        "library-loans", "What library members borrowed",
        "the distribution of loans by item type at a public library",
        ["Fiction", "Non-fiction", "Children’s books", "E-books", "Other"],
        [35, 28, 22, 5, 10], [28, 22, 20, 23, 7],
    ),
    (
        "visitor-origins", "Where museum visitors came from",
        "where visitors to a city museum lived",
        ["Local area", "Other parts of the region", "Rest of the country", "Overseas"],
        [46, 24, 20, 10], [34, 22, 26, 18],
    ),
    (
        "university-travel", "How students travelled to university",
        "students’ main ways of travelling to a university",
        ["Bus", "Car", "Train", "Bicycle", "Walking"],
        [34, 30, 16, 8, 12], [31, 19, 22, 16, 12],
    ),
    (
        "household-waste", "Materials in household waste",
        "the composition by weight of household waste collected in a city",
        ["Food waste", "Paper", "Plastic", "Glass and metal", "Other"],
        [35, 24, 17, 14, 10], [39, 16, 22, 10, 13],
    ),
    (
        "sports-funding", "How a sports centre used its budget",
        "how a sports centre divided its annual budget",
        ["Staff", "Maintenance", "Equipment", "Programmes", "Other"],
        [38, 26, 15, 12, 9], [40, 18, 12, 22, 8],
    ),
    (
        "holiday-stays", "Accommodation chosen by visitors",
        "the main types of accommodation chosen by visitors to a coastal town",
        ["Hotels", "Guesthouses", "Holiday rentals", "Campsites", "Other"],
        [42, 24, 12, 15, 7], [32, 17, 30, 13, 8],
    ),
    (
        "park-visits", "Main reasons for visiting a park",
        "the main reasons people gave for visiting a city park",
        ["Exercise", "Relaxation", "Family outings", "Events", "Other"],
        [25, 36, 24, 8, 7], [34, 28, 19, 14, 5],
    ),
    (
        "clothing-sales", "Where a clothing retailer made its sales",
        "the share of a clothing retailer’s revenue from each sales channel",
        ["Shops", "Website", "Mobile app", "Other retailers"],
        [65, 18, 5, 12], [39, 25, 28, 8],
    ),
]

COLOURS = ("#12385e", "#23639b", "#418cbe", "#75b4de", "#b5daef")


def normalise(value):
    return " ".join(value.split()).casefold()


def make_chart(title, labels, first, second):
    def text(x, y, value, size=15, anchor="start"):
        return (
            f'<text x="{x}" y="{y}" font-size="{size}" '
            f'text-anchor="{anchor}">{escape(str(value))}</text>'
        )

    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 480">',
        f"<title>{escape(title)}</title>",
        '<rect width="760" height="480" fill="#fff"/>',
        '<g font-family="Arial, sans-serif" fill="#143454">',
        text(380, 32, title, 23, "middle"),
        text(380, 57, "Percentage share (%)", 15, "middle"),
    ]

    radius = 90
    cy = 185

    for cx, year, values in ((210, 2015, first), (550, 2025, second)):
        svg.append(text(cx, 82, year, 16, "middle"))
        start = -90

        for value, colour in zip(values, COLOURS):
            end = start + 360 * value / 100
            x1 = cx + radius * cos(radians(start))
            y1 = cy + radius * sin(radians(start))
            x2 = cx + radius * cos(radians(end))
            y2 = cy + radius * sin(radians(end))
            large_arc = int(value > 50)

            svg.append(
                f'<path d="M {cx} {cy} L {x1:.2f} {y1:.2f} '
                f'A {radius} {radius} 0 {large_arc} 1 {x2:.2f} {y2:.2f} Z" '
                f'fill="{colour}" stroke="#fff" stroke-width="2"/>'
            )
            start = end

    svg.append(text(540, 304, "2015", 15, "end"))
    svg.append(text(650, 304, "2025", 15, "end"))

    for index, label in enumerate(labels):
        y = 329 + index * 25
        svg.append(
            f'<rect x="85" y="{y - 13}" width="15" height="15" '
            f'fill="{COLOURS[index]}"/>'
        )
        svg.append(text(110, y, label))
        svg.append(text(540, y, f"{first[index]}%", anchor="end"))
        svg.append(text(650, y, f"{second[index]}%", anchor="end"))

    svg.append(text(380, 463, "Band Buddy practice · Fictional data", 12, "middle"))
    svg.append("</g></svg>")
    return "\n".join(svg)


def import_questions(apply=False):
    with SessionLocal() as db:
        existing = db.scalars(
            select(WritingQuestion).where(
                WritingQuestion.category == "pie",
                WritingQuestion.task == "task1",
                WritingQuestion.test_type == "academic",
            )
        ).all()

        published = sum(row.status == "published" for row in existing)
        seen = {normalise(row.title) for row in existing}
        remaining = max(0, 10 - published)
        planned = []

        for item in QUESTIONS:
            if len(planned) >= remaining:
                break

            title_key = normalise(item[1])
            if title_key not in seen:
                planned.append(item)
                seen.add(title_key)

        print(f"Published Pie chart questions now: {published}")
        print(f"Questions to add: {len(planned)}")

        for _, title, _, labels, first, second in planned:
            if not (
                2 <= len(labels) <= len(COLOURS)
                and len(labels) == len(first) == len(second)
                and sum(first) == sum(second) == 100
                and all(value > 0 for value in first + second)
            ):
                raise ValueError(f"Invalid pie chart data: {title}")

            print(f"  - {title}")

        if not apply:
            print("Preview only. No changes were made.")
            return

        if planned:
            CHART_DIR.mkdir(parents=True, exist_ok=True)

        for slug, title, description, labels, first, second in planned:
            filename = f"{slug}.svg"
            (CHART_DIR / filename).write_text(
                make_chart(title, labels, first, second),
                encoding="utf-8",
            )

            db.add(
                WritingQuestion(
                    category="pie",
                    task="task1",
                    test_type="academic",
                    title=title,
                    prompt=(
                        f"The pie charts show {description} in 2015 and 2025. "
                        "Summarise the information by selecting and reporting "
                        "the main features, and make comparisons where relevant. "
                        "Write at least 150 words."
                    ),
                    points=None,
                    visual_url=f"/images/writing/pie/{filename}",
                    status="published",
                    source_type="original",
                )
            )

        db.commit()
        print(f"Published Pie chart total: {published + len(planned)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    import_questions(apply=args.apply)