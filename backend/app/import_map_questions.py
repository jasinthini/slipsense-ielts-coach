import argparse
from html import escape
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models.writing import WritingQuestion


MAP_DIR = (
    Path(__file__).resolve().parents[2]
    / "frontend" / "public" / "images" / "writing" / "map"
)

# Each map has six sites: northwest, north, northeast,
# southwest, south, southeast. Main Road runs between the rows.
QUESTIONS = [
    (
        "riverside-park", "Riverside Park", 2005, 2025,
        ["Woodland", "Grass field", "Pond", "Car park", "Picnic area", "Grass field"],
        ["Woodland", "Playground", "Pond", "Café", "Picnic area", "Skate park"],
    ),
    (
        "market-square", "Market Square", 1995, 2020,
        ["Market stalls", "Town hall", "Car park", "Shops", "Bus stop", "Bakery"],
        ["Covered market", "Town hall", "Public garden", "Shops", "Bus station", "Bakery"],
    ),
    (
        "seaview-campus", "Seaview College campus", 2010, 2024,
        ["Library", "Classrooms", "Open field", "Car park", "Canteen", "Workshop"],
        ["Library", "Classrooms", "Sports hall", "Bike parking", "Canteen", "Science labs"],
    ),
    (
        "station-district", "The district around Oakfield Station", 2000, 2022,
        ["Station", "Warehouse", "Car park", "Houses", "Empty land", "Shops"],
        ["Station", "Offices", "Bus interchange", "Houses", "Apartments", "Shops"],
    ),
    (
        "harbour", "Westport Harbour", 1985, 2015,
        ["Boat sheds", "Fish market", "Harbour office", "Car park", "Warehouse", "Open land"],
        ["Boat sheds", "Food hall", "Harbour office", "Car park", "Maritime museum", "Promenade"],
    ),
    (
        "school-grounds", "Greenfield School grounds", 2008, 2023,
        ["Classrooms", "Library", "School garden", "Car park", "Football pitch", "Playground"],
        ["Classrooms", "IT centre", "School garden", "Drop-off area", "Football pitch", "Sports hall"],
    ),
    (
        "community-centre", "The area around Brookside Community Centre", 2012, 2025,
        ["Community centre", "Empty plot", "Allotments", "Car park", "Hall", "Small garden"],
        ["Community centre", "Health clinic", "Allotments", "Car park", "Hall", "Outdoor gym"],
    ),
    (
        "holiday-village", "Pinewood Holiday Village", 1990, 2018,
        ["Pine forest", "Cabins", "Lake", "Reception", "Campsite", "Open land"],
        ["Pine forest", "Cabins", "Lake", "Reception", "Holiday lodges", "Indoor pool"],
    ),
    (
        "industrial-estate", "Northgate Industrial Estate", 1975, 2021,
        ["Textile factory", "Storage yard", "Warehouse", "Staff canteen", "Car park", "Empty land"],
        ["Business centre", "Storage yard", "Distribution hub", "Café", "Car park", "Solar farm"],
    ),
    (
        "village-centre", "Millbrook village centre", 2003, 2024,
        ["Post office", "Village green", "School", "Houses", "Orchard", "Village shop"],
        ["Post office", "Village green", "School", "Houses", "New housing", "Supermarket"],
    ),
]


def make_map(title, old_year, new_year, before, after):
    def text(x, y, value, size=15, anchor="middle"):
        return (
            f'<text x="{x}" y="{y}" font-size="{size}" '
            f'text-anchor="{anchor}">{escape(str(value))}</text>'
        )

    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 380">',
        f"<title>{escape(title)}</title>",
        '<rect width="840" height="380" fill="#fff"/>',
        '<g font-family="Arial, sans-serif" fill="#153858">',
        text(420, 32, title, 24),
    ]

    for left, year, sites in ((20, old_year, before), (440, new_year, after)):
        svg.append(text(left + 190, 66, year, 20))
        svg.append(text(left + 352, 66, "↑ N", 15))
        svg.append(
            f'<rect x="{left}" y="80" width="380" height="250" rx="8" '
            'fill="#f4f8fc" stroke="#9bb8d1"/>'
        )
        svg.append(
            f'<rect x="{left}" y="187" width="380" height="36" fill="#d7e5f0"/>'
        )
        svg.append(text(left + 190, 210, "Main Road", 14))

        for i, label in enumerate(sites):
            x = left + 10 + (i % 3) * 121
            y = 95 if i < 3 else 237
            svg.append(
                f'<rect x="{x}" y="{y}" width="117" height="78" rx="6" '
                'fill="#d9ebfa" stroke="#8aaecb"/>'
            )

            # Wrap long labels so they fit inside their site.
            lines = []
            for word in label.split():
                if lines and len(lines[-1] + " " + word) <= 15:
                    lines[-1] += " " + word
                else:
                    lines.append(word)

            first_y = y + 44 - (len(lines) - 1) * 8
            for j, line in enumerate(lines):
                svg.append(text(x + 58.5, first_y + j * 16, line, 12))

    svg.append(text(420, 360, "Band Buddy practice · Fictional maps · Not to scale", 13))
    svg.append("</g></svg>")
    return "\n".join(svg)


def run(apply=False):
    with SessionLocal() as db:
        existing = db.scalars(
            select(WritingQuestion).where(
                WritingQuestion.category == "map",
                WritingQuestion.task == "task1",
                WritingQuestion.test_type == "academic",
            )
        ).all()

        published = sum(row.status == "published" for row in existing)
        seen = {row.title.strip().casefold() for row in existing}
        planned = [
            item for item in QUESTIONS
            if item[1].strip().casefold() not in seen
        ][:max(0, 10 - published)]

        print(f"Published Maps questions now: {published}")
        print(f"Questions to add: {len(planned)}")
        for _, title, *_ in planned:
            print(f"  - {title}")

        if not apply:
            print("Preview only. No changes were made.")
            return

        if planned:
            MAP_DIR.mkdir(parents=True, exist_ok=True)

        for slug, title, old_year, new_year, before, after in planned:
            filename = f"{slug}.svg"
            (MAP_DIR / filename).write_text(
                make_map(title, old_year, new_year, before, after),
                encoding="utf-8",
            )

            db.add(WritingQuestion(
                category="map",
                task="task1",
                test_type="academic",
                title=title,
                prompt=(
                    f"The maps show {title} in {old_year} and {new_year}. "
                    "Summarise the information by selecting and reporting "
                    "the main features, and make comparisons where relevant. "
                    "Write at least 150 words."
                ),
                points=None,
                visual_url=f"/images/writing/map/{filename}",
                status="published",
                source_type="original",
            ))

        db.commit()
        print(f"Published Maps total: {published + len(planned)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    run(apply=args.apply)