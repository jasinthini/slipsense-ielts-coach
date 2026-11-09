import argparse
from html import escape
from pathlib import Path
from textwrap import wrap

from sqlalchemy import select

from app.database import SessionLocal
from app.models.writing import WritingQuestion


CATEGORY = "process"
TARGET = 10
IMAGE_DIR = (
    Path(__file__).resolve().parents[2]
    / "frontend" / "public" / "images" / "writing" / CATEGORY
)

# Each item contains a filename, title, prompt description and six stages.
QUESTIONS = [
    (
        "paper-recycling", "Paper recycling",
        "how used paper is recycled into new paper",
        ["Collect used paper", "Sort by paper type", "Mix with water to make pulp",
         "Remove ink from pulp", "Press and dry into sheets", "Roll finished paper"],
    ),
    (
        "honey-production", "Honey production",
        "how bees make honey",
        ["Bees collect nectar", "Bees carry nectar to the hive", "Bees transfer nectar between workers",
         "Nectar goes into cells", "Wing movement removes moisture", "Bees seal the cells with wax"],
    ),
    (
        "rainwater-collection", "Rainwater collection",
        "how a household collects rainwater for garden use",
        ["Rain falls onto the roof", "Gutters collect runoff", "A screen removes leaves",
         "A pipe carries water to the tank", "The tank stores the water", "An outdoor tap supplies the garden"],
    ),
    (
        "orange-juice", "Orange juice production",
        "how bottled orange juice is produced",
        ["Harvest ripe oranges", "Wash and sort the fruit", "Press the oranges",
         "Filter out seeds and excess pulp", "Heat the juice briefly", "Fill and seal bottles"],
    ),
    (
        "clay-bricks", "Manufacture of clay bricks",
        "how clay bricks are made",
        ["Dig clay from the ground", "Crush and screen the clay", "Mix clay with sand and water",
         "Shape the mixture in moulds", "Dry the shaped bricks", "Fire and cool the bricks"],
    ),
    (
        "bread-production", "Bread production",
        "how a bakery makes bread",
        ["Measure the ingredients", "Mix and knead the dough", "Leave the dough to rise",
         "Shape the loaves", "Bake the loaves", "Cool and package the bread"],
    ),
    (
        "olive-oil", "Olive oil production",
        "how olive oil is extracted and bottled",
        ["Pick ripe olives", "Wash the olives", "Crush olives into a paste",
         "Mix the paste slowly", "Separate oil from water and solids", "Filter and bottle the oil"],
    ),
    (
        "glass-recycling", "Glass bottle recycling",
        "how discarded glass bottles are made into new bottles",
        ["Collect used bottles", "Sort bottles by colour", "Wash and crush the glass",
         "Melt the crushed glass", "Shape new bottles in moulds", "Cool and inspect the bottles"],
    ),
    (
        "tea-processing", "Black tea processing",
        "how fresh tea leaves are processed into black tea",
        ["Pick fresh tea leaves", "Allow the leaves to wilt", "Roll the leaves",
         "Expose the leaves to air", "Dry the leaves with warm air", "Grade and pack the tea"],
    ),
    (
        "garden-compost", "Garden compost production",
        "how household organic waste is turned into garden compost",
        ["Collect plant and food scraps", "Chop large pieces", "Mix scraps with dry leaves",
         "Add water to keep the pile moist", "Turn the pile as it decomposes", "Sift the mature compost"],
    ),
]


def make_diagram(title, stages):
    positions = [
        (28, 80), (278, 80), (528, 80),
        (528, 240), (278, 240), (28, 240),
    ]
    arrows = [
        "M232 130 H268", "M482 130 H518",
        "M628 184 V230", "M524 290 H488", "M274 290 H238",
    ]

    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 390">',
        f"<title>{escape(title)}</title>",
        '<rect width="760" height="390" fill="#fff"/>',
        '<defs><marker id="arrow" markerWidth="8" markerHeight="8" '
        'refX="7" refY="4" orient="auto">'
        '<path d="M0 0 L8 4 L0 8 Z" fill="#27639b"/></marker></defs>',
        '<g font-family="Arial, sans-serif" fill="#143454" text-anchor="middle">',
        f'<text x="380" y="39" font-size="25">{escape(title)}</text>',
    ]

    for arrow in arrows:
        svg.append(
            f'<path d="{arrow}" fill="none" stroke="#27639b" '
            'stroke-width="3" marker-end="url(#arrow)"/>'
        )

    for number, ((x, y), stage) in enumerate(zip(positions, stages), start=1):
        svg.extend([
            f'<rect x="{x}" y="{y}" width="200" height="100" rx="12" '
            'fill="#e6f2fd" stroke="#93b8d7"/>',
            f'<text x="{x + 100}" y="{y + 27}" font-size="14" '
            f'font-weight="bold">Stage {number}</text>',
        ])

        for i, line in enumerate(wrap(stage, width=23)):
            svg.append(
                f'<text x="{x + 100}" y="{y + 50 + i * 17}" '
                f'font-size="14">{escape(line)}</text>'
            )

    svg.append('<text x="380" y="370" font-size="13">Band Buddy practice</text>')
    svg.append("</g></svg>")
    return "\n".join(svg)


def normalise(title):
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

        published = sum(question.status == "published" for question in existing)
        seen = {normalise(question.title) for question in existing}
        planned = []

        for item in QUESTIONS:
            if published + len(planned) >= TARGET:
                break

            key = normalise(item[1])
            if key not in seen:
                planned.append(item)
                seen.add(key)

        print(f"Published Process questions now: {published}")
        print(f"Questions to add: {len(planned)}")
        for _, title, _, _ in planned:
            print(f"  - {title}")

        if not apply:
            print("Preview only. No changes were made.")
            return

        if planned:
            IMAGE_DIR.mkdir(parents=True, exist_ok=True)

        for slug, title, description, stages in planned:
            filename = f"{slug}.svg"
            (IMAGE_DIR / filename).write_text(
                make_diagram(title, stages), encoding="utf-8"
            )

            db.add(WritingQuestion(
                category=CATEGORY,
                task="task1",
                test_type="academic",
                title=title,
                prompt=(
                    f"The diagram shows {description}. "
                    "Summarise the information by selecting and reporting "
                    "the main features. Write at least 150 words."
                ),
                points=None,
                visual_url=f"/images/writing/{CATEGORY}/{filename}",
                status="published",
                source_type="original",
            ))

        db.commit()
        print(f"Published Process total: {published + len(planned)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    run(apply=args.apply)