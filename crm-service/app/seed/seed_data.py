from __future__ import annotations

import random
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from faker import Faker
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.customer import Customer
from app.models.order import Order

SEED_VALUE = 42
CUSTOMER_COUNT = 1000
ORDER_COUNT = 5000
BATCH_SIZE = 500

fake = Faker("en_IN")
Faker.seed(SEED_VALUE)
random.seed(SEED_VALUE)

INDIAN_CITIES = [
    "Bengaluru",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "Chennai",
    "Pune",
    "Kolkata",
    "Ahmedabad",
    "Jaipur",
    "Surat",
    "Lucknow",
    "Kochi",
    "Indore",
    "Chandigarh",
    "Coimbatore",
]

PRODUCT_CATALOG = {
    "Coffee": [
        "Espresso",
        "Latte",
        "Cappuccino",
        "Cold Brew",
        "Mocha",
        "Americano",
        "Coffee Beans",
    ],
    "Fashion": [
        "T-Shirt",
        "Jeans",
        "Sneakers",
        "Hoodie",
        "Dress",
        "Jacket",
        "Handbag",
    ],
    "Beauty": [
        "Lipstick",
        "Serum",
        "Moisturizer",
        "Sunscreen",
        "Face Wash",
        "Perfume",
        "Shampoo",
    ],
}

PERSONA_DISTRIBUTION = [
    ("dormant", 0.20),
    ("recent_buyer", 0.30),
    ("high_value", 0.10),
    ("repeat_buyer", 0.20),
    ("casual_shopper", 0.20),
]

ORDER_SELECTION_WEIGHTS = {
    "dormant": 0.06,
    "recent_buyer": 0.24,
    "high_value": 0.30,
    "repeat_buyer": 0.28,
    "casual_shopper": 0.12,
}

ORDER_AMOUNT_RANGES = {
    "dormant": (Decimal("200.00"), Decimal("3500.00")),
    "recent_buyer": (Decimal("500.00"), Decimal("7000.00")),
    "high_value": (Decimal("4000.00"), Decimal("10000.00")),
    "repeat_buyer": (Decimal("700.00"), Decimal("8500.00")),
    "casual_shopper": (Decimal("200.00"), Decimal("2500.00")),
}


def random_signup_date() -> date:
    today = date.today()
    return fake.date_between(start_date=today - timedelta(days=730), end_date=today)


def random_indian_phone_number() -> str:
    first_digit = random.choice(["6", "7", "8", "9"])
    remaining_digits = "".join(str(random.randint(0, 9)) for _ in range(9))
    return f"+91{first_digit}{remaining_digits}"


def build_personas() -> list[str]:
    personas: list[str] = []
    for persona, percentage in PERSONA_DISTRIBUTION:
        personas.extend([persona] * int(CUSTOMER_COUNT * percentage))

    while len(personas) < CUSTOMER_COUNT:
        personas.append("casual_shopper")

    random.shuffle(personas)
    return personas


def unique_email(first_name: str, last_name: str, index: int) -> str:
    clean_first = first_name.lower().replace(" ", ".")
    clean_last = last_name.lower().replace(" ", ".")
    return f"{clean_first}.{clean_last}.{index}@sonariq.example"


def create_customers(db: Session) -> list[tuple[Any, str]]:
    customer_refs: list[tuple[Any, str]] = []
    personas = build_personas()

    for index, persona in enumerate(personas, start=1):
        first_name = fake.first_name()
        last_name = fake.last_name()
        customer = Customer(
            first_name=first_name,
            last_name=last_name,
            email=unique_email(first_name, last_name, index),
            phone=random_indian_phone_number(),
            city=random.choice(INDIAN_CITIES),
            signup_date=random_signup_date(),
        )
        db.add(customer)

        if index % BATCH_SIZE == 0:
            db.flush()
            db.commit()

        db.flush()
        customer_refs.append((customer.id, persona))

    db.commit()
    return customer_refs


def weighted_customer_pool(customer_refs: list[tuple[Any, str]]) -> list[tuple[Any, str]]:
    return sorted(
        customer_refs,
        key=lambda item: ORDER_SELECTION_WEIGHTS[item[1]] * random.random(),
        reverse=True,
    )


def random_order_datetime(persona: str) -> datetime:
    now = datetime.now(timezone.utc)

    if persona == "dormant":
        return fake.date_time_between(
            start_date=now - timedelta(days=730),
            end_date=now - timedelta(days=180),
            tzinfo=timezone.utc,
        )

    if persona == "recent_buyer":
        return fake.date_time_between(
            start_date=now - timedelta(days=90),
            end_date=now,
            tzinfo=timezone.utc,
        )

    if persona == "high_value":
        return fake.date_time_between(
            start_date=now - timedelta(days=365),
            end_date=now,
            tzinfo=timezone.utc,
        )

    if persona == "repeat_buyer":
        return fake.date_time_between(
            start_date=now - timedelta(days=730),
            end_date=now,
            tzinfo=timezone.utc,
        )

    return fake.date_time_between(
        start_date=now - timedelta(days=730),
        end_date=now - timedelta(days=14),
        tzinfo=timezone.utc,
    )


def random_amount(persona: str) -> Decimal:
    minimum, maximum = ORDER_AMOUNT_RANGES[persona]
    amount = random.uniform(float(minimum), float(maximum))
    return Decimal(str(round(amount, 2)))


def split_amount(total_amount: Decimal, item_count: int) -> list[Decimal]:
    if item_count == 1:
        return [total_amount.quantize(Decimal("0.01"))]

    weights = [Decimal(str(random.uniform(0.5, 1.5))) for _ in range(item_count)]
    total_weight = sum(weights)
    amounts = [(total_amount * weight / total_weight).quantize(Decimal("0.01")) for weight in weights]
    rounding_delta = total_amount.quantize(Decimal("0.01")) - sum(amounts)
    amounts[-1] += rounding_delta
    return amounts


def random_items(total_amount: Decimal) -> tuple[str, list[dict[str, Any]]]:
    category = random.choice(list(PRODUCT_CATALOG.keys()))
    products = random.sample(PRODUCT_CATALOG[category], k=random.randint(1, 4))
    line_amounts = split_amount(total_amount, len(products))
    items: list[dict[str, Any]] = []

    for product_name, line_amount in zip(products, line_amounts, strict=True):
        quantity = random.randint(1, 3)
        unit_price = (line_amount / quantity).quantize(Decimal("0.01"))
        items.append(
            {
                "sku": fake.bothify(text="SON-????-####").upper(),
                "category": category,
                "name": product_name,
                "quantity": quantity,
                "unit_price": float(unit_price),
            }
        )

    return category, items


def create_orders(db: Session, customer_refs: list[tuple[Any, str]]) -> tuple[Counter[str], Counter[str]]:
    persona_counts: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()
    pool = weighted_customer_pool(customer_refs)
    pool_index = 0

    for order_index in range(1, ORDER_COUNT + 1):
        if pool_index >= len(pool):
            pool = weighted_customer_pool(customer_refs)
            pool_index = 0

        customer_id, persona = pool[pool_index]
        pool_index += 1

        total_amount = random_amount(persona)
        category, items = random_items(total_amount)
        order = Order(
            customer_id=customer_id,
            order_date=random_order_datetime(persona),
            total_amount=total_amount,
            items_json={"category": category, "items": items},
        )
        db.add(order)
        persona_counts[persona] += 1
        category_counts[category] += 1

        if order_index % BATCH_SIZE == 0:
            db.commit()

    db.commit()
    return persona_counts, category_counts


def print_summary(
    customer_refs: list[tuple[Any, str]],
    order_counts: Counter[str],
    category_counts: Counter[str],
) -> None:
    customer_counts = Counter(persona for _, persona in customer_refs)

    print("Seed completed for SonarIQ")
    print(f"Customers created: {len(customer_refs)}")
    print(f"Orders created: {sum(order_counts.values())}")
    print("Customer personas:")
    for persona, count in sorted(customer_counts.items()):
        print(f"  {persona}: {count}")
    print("Orders by persona:")
    for persona, count in sorted(order_counts.items()):
        print(f"  {persona}: {count}")
    print("Orders by category:")
    for category, count in sorted(category_counts.items()):
        print(f"  {category}: {count}")


def main() -> None:
    db = SessionLocal()
    try:
        customer_refs = create_customers(db)
        order_counts, category_counts = create_orders(db, customer_refs)
        print_summary(customer_refs, order_counts, category_counts)
    finally:
        db.close()


if __name__ == "__main__":
    main()
