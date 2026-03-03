"""Add equipment table for sports equipment inventory management.

Revision ID: a3c7e9b21d04
Revises: f1d5f2fac109
"""

from alembic import op

revision = "a3c7e9b21d04"
down_revision = "f1d5f2fac109"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS equipment (
            id SERIAL PRIMARY KEY,
            facility_id INTEGER NOT NULL REFERENCES facility(id) ON DELETE CASCADE,
            branch_id INTEGER REFERENCES branch(id) ON DELETE SET NULL,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            brand VARCHAR(100),
            total_quantity INTEGER NOT NULL DEFAULT 1,
            available_quantity INTEGER NOT NULL DEFAULT 1,
            condition VARCHAR(50) DEFAULT 'good',
            rental_rate NUMERIC(10, 2),
            is_rentable BOOLEAN DEFAULT FALSE,
            notes TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_equipment_facility ON equipment(facility_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_equipment_branch ON equipment(branch_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(facility_id, category);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS equipment;")
