import argparse
from html import escape
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models.writing import WritingQuestion


CATEGORY = "table"
TARGET = 10
IMAGE_DIR = (
    Path(__file__).resolve().parents[2]
    / "frontend" / "public" / "images" / "writing" / CATEGORY
)

# Each item: filename, title, unit, row heading, columns, and data rows.
QUESTIONS = [
    (
        "bus-journeys", "Annual bus journeys", "Journeys per year (thousands)",
        "Town", ["2012", "2018", "2024"],
        [("Brookfield", 320, 405, 480), ("Eastmere", 510, 495, 460),
         ("Westford", 285, 330, 390), ("Hilltown", 190, 280, 350)],
    ),
    (
        "library-membership", "Public library membership", "Registered members",
        "Library", ["2010", "2015", "2020"],
        [("Central", 4200, 4650, 5100), ("Riverside", 2100, 2500, 2300),
         ("Northgate", 1800, 2250, 2900), ("Oak Park", 1600, 1450, 1700)],
    ),
    (
        "household-water", "Daily household water use", "Litres per household per day",
        "Region", ["2005", "2015", "2025"],
        [("North", 310, 280, 245), ("South", 240, 255, 230),
         ("East", 275, 260, 220), ("West", 295, 270, 260)],
    ),
    (
        "museum-attendance", "Museum attendance by season", "Visitors in 2023 (thousands)",
        "Museum", ["Spring", "Summer", "Autumn", "Winter"],
        [("History", 42, 68, 49, 25), ("Science", 54, 72, 58, 46),
         ("Maritime", 28, 61, 32, 16), ("Art", 48, 53, 55, 37)],
    ),
    (
        "course-enrolment", "Adult education enrolments", "Students enrolled",
        "Course", ["2014", "2019", "2024"],
        [("Languages", 150, 190, 180), ("Digital skills", 80, 175, 310),
         ("Photography", 95, 125, 145), ("Accounting", 170, 155, 130)],
    ),
    (
        "travel-costs", "Monthly commuting costs", "Average cost per person in 2025 ($)",
        "City", ["Bus", "Train", "Car"],
        [("Northport", 48, 72, 165), ("Lakeview", 55, 60, 140),
         ("Riverton", 42, 67, 155), ("Greendale", 50, 80, 175)],
    ),
    (
        "recycling", "Household recycling rates", "Share of household waste recycled (%)",
        "District", ["2008", "2016", "2022"],
        [("North", 18, 31, 46), ("South", 22, 37, 41),
         ("East", 12, 30, 49), ("West", 29, 39, 43)],
    ),
    (
        "market-sales", "Weekend market sales", "Sales in 2024 (thousands of dollars)",
        "Market", ["January", "April", "July", "October"],
        [("Town Square", 24, 31, 39, 34), ("Riverside", 18, 24, 35, 40),
         ("Harbour", 29, 33, 52, 37), ("Station Road", 27, 26, 29, 32)],
    ),
    (
        "home-internet", "Households with internet access", "Share of households (%)",
        "Area", ["2009", "2017", "2025"],
        [("City centre", 59, 81, 95), ("Suburbs", 47, 75, 92),
         ("Small towns", 36, 62, 88), ("Rural areas", 20, 47, 79)],
    ),
    (
        "electricity-output", "Electricity generation by source",
        "Annual electricity output (gigawatt-hours)",
        "Source", ["2011", "2016", "2023"],
        [("Coal", 460, 380, 190), ("Gas", 210, 245, 280),
         ("Wind", 60, 140, 250), ("Solar", 15, 65, 180)],
    ),
]


def make_table(title, unit, row_heading, columns, rows):
    def label(x, y, value, colour="#143454", size=17, anchor="start"):
        return (
            f'<text x="{x}" y="{y}" fill="{colour}" font-size="{size}" '
            f'text-anchor="{anchor}">{escape(str(value))}</text>'
        )

    left = 30
    table_width = 700
    first_col = 210
    cell_width = (table_width - first_col) / len(columns)
    height = 170 + 42 * len(rows)

    def column_centre(index):
        return left + first_col + cell_width * (index + 0.5)

    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 {height}">',
        f'<title>{escape(title)}</title>',
        f'<rect width="760" height="{height}" fill="#ffffff"/>',
        '<g font-family="Arial, sans-serif">',
        label(left, 37, title, size=25),
        label(left, 65, unit, size=15),
        '<rect x="30" y="90" width="700" height="42" rx="6" fill="#174774"/>',
        label(left + 14, 117, row_heading, "#ffffff"),
    ]

    for i, column in enumerate(columns):
        svg.append(label(column_centre(i), 117, column, "#ffffff", anchor="middle"))

    for i, (name, *values) in enumerate(rows):
        y = 132 + i * 42
        background = "#e6f2fc" if i % 2 == 0 else "#f5f9fd"
        svg.append(
            f'<rect x="{left}" y="{y}" width="{table_width}" height="42" '
            f'fill="{background}" stroke="#ccdfef"/>'
        )
        svg.append(label(left + 14, y + 27, name))

        for j, value in enumerate(values):
            svg.append(label(column_centre(j), y + 27, f"{value:,}", anchor="middle"))

    svg.extend([
        label(left, height - 15, "Band Buddy practice · Fictional data", size=13),
        "</g></svg>",
    ])
    return "\n".join(svg)


def title_key(title):
    return " ".join(title.split()).casefold()


def run(apply=False):
    with SessionLocal() as db:
        existing = db.scalars(
            select(WritingQuestion).where(
                WritingQuestion.category == CATEGORY,
                WritingQuestion.task == "task1",
                WritingQuestion.test_type == "academic",
            )
        ).all()

        published = sum(row.status == "published" for row in existing)
        seen = {title_key(row.title) for row in existing}
        planned = []

        for item in QUESTIONS:
            if published + len(planned) >= TARGET:
                break

            key = title_key(item[1])
            if key not in seen:
                planned.append(item)
                seen.add(key)

        print(f"Published Table questions now: {published}")
        print(f"Questions to add: {len(planned)}")
        for _, title, *_ in planned:
            print(f"  - {title}")

        if not apply:
            print("Preview only. No changes were made.")
            return

        if planned:
            IMAGE_DIR.mkdir(parents=True, exist_ok=True)

        for slug, title, unit, row_heading, columns, rows in planned:
            filename = f"{slug}.svg"
            (IMAGE_DIR / filename).write_text(
                make_table(title, unit, row_heading, columns, rows),
                encoding="utf-8",
            )

            db.add(WritingQuestion(
                category=CATEGORY,
                task="task1",
                test_type="academic",
                title=title,
                prompt=(
                    "The table gives information about the topic shown. "
                    "Summarise the information by selecting and reporting the "
                    "main features, and make comparisons where relevant. "
                    "Write at least 150 words."
                ),
                points=None,
                visual_url=f"/images/writing/{CATEGORY}/{filename}",
                status="published",
                source_type="original",
            ))

        db.commit()
        print(f"Published Table total: {published + len(planned)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    run(apply=args.apply)