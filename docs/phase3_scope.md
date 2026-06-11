Phase 3 – Segmentation Engine

Endpoint:
POST /segments/preview

Filters:
- city
- recent_signup_days
- lifetime_spend_greater_than
- dormant_days
- minimum_order_count
- recent_product_purchase

Requirements:
- AND logic
- audience_count
- customer_ids
- explanation (list[str])
- PostgreSQL JSON querying
- Efficient SQLAlchemy aggregations

Do NOT:
- Authentication
- Saved segments
- Segment CRUD
- AI
- Model changes
- Migration changes