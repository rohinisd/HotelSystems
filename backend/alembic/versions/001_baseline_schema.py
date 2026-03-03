"""Baseline schema from db/init.sql.

Creates all tables, indexes, and the exclusion constraint for the SFMS database.
"""

from alembic import op

revision = "f1d5f2fac109"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE EXTENSION IF NOT EXISTS btree_gist;
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS facility (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            owner_name VARCHAR(255),
            owner_email VARCHAR(255),
            owner_phone VARCHAR(20),
            subscription_plan VARCHAR(50) DEFAULT 'free',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS branch (
            id SERIAL PRIMARY KEY,
            facility_id INTEGER NOT NULL REFERENCES facility(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(100),
            pincode VARCHAR(10),
            phone VARCHAR(20),
            opening_time TIME DEFAULT '06:00',
            closing_time TIME DEFAULT '23:00',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS court (
            id SERIAL PRIMARY KEY,
            branch_id INTEGER NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
            facility_id INTEGER NOT NULL REFERENCES facility(id),
            name VARCHAR(100) NOT NULL,
            sport VARCHAR(50) NOT NULL,
            surface_type VARCHAR(50),
            hourly_rate NUMERIC(10, 2) NOT NULL,
            peak_hour_rate NUMERIC(10, 2),
            slot_duration_minutes INTEGER DEFAULT 60,
            is_indoor BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            facility_id INTEGER REFERENCES facility(id),
            email VARCHAR(255) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            role VARCHAR(50) NOT NULL DEFAULT 'player',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS booking (
            id SERIAL PRIMARY KEY,
            facility_id INTEGER NOT NULL REFERENCES facility(id),
            court_id INTEGER NOT NULL REFERENCES court(id),
            player_id INTEGER REFERENCES users(id),
            date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            status VARCHAR(20) DEFAULT 'confirmed',
            booking_type VARCHAR(20) DEFAULT 'online',
            player_name VARCHAR(255),
            player_phone VARCHAR(20),
            amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
            notes TEXT,
            created_by INTEGER REFERENCES users(id),
            cancelled_by INTEGER REFERENCES users(id),
            cancelled_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS payment (
            id SERIAL PRIMARY KEY,
            facility_id INTEGER NOT NULL REFERENCES facility(id),
            booking_id INTEGER NOT NULL REFERENCES booking(id),
            amount NUMERIC(10, 2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'INR',
            status VARCHAR(20) DEFAULT 'pending',
            method VARCHAR(20),
            razorpay_order_id VARCHAR(100),
            razorpay_payment_id VARCHAR(100),
            razorpay_signature VARCHAR(255),
            paid_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS pricing_rule (
            id SERIAL PRIMARY KEY,
            court_id INTEGER NOT NULL REFERENCES court(id),
            facility_id INTEGER NOT NULL REFERENCES facility(id),
            day_of_week INTEGER,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            rate NUMERIC(10, 2) NOT NULL,
            label VARCHAR(50),
            is_active BOOLEAN DEFAULT TRUE
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_booking_facility_date ON booking(facility_id, date);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_booking_court_date ON booking(court_id, date);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_booking_player ON booking(player_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_court_branch ON court(branch_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_court_facility ON court(facility_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_payment_booking ON payment(booking_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_facility ON users(facility_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_pricing_court ON pricing_rule(court_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_branch_facility ON branch(facility_id);")
    op.execute("""
        ALTER TABLE booking ADD CONSTRAINT uq_no_overlap
            EXCLUDE USING gist (
                court_id WITH =,
                date WITH =,
                tsrange(
                    (date + start_time)::timestamp,
                    (date + end_time)::timestamp
                ) WITH &&
            ) WHERE (status != 'cancelled');
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE booking DROP CONSTRAINT IF EXISTS uq_no_overlap;")
    op.execute("DROP TABLE IF EXISTS pricing_rule;")
    op.execute("DROP TABLE IF EXISTS payment;")
    op.execute("DROP TABLE IF EXISTS booking;")
    op.execute("DROP TABLE IF EXISTS court;")
    op.execute("DROP TABLE IF EXISTS branch;")
    op.execute("DROP TABLE IF EXISTS users;")
    op.execute("DROP TABLE IF EXISTS facility;")
