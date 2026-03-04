"""Add booking_source column, tournament tables, and indexes.

Revision ID: c7e2f4a89b31
Revises: b5d8f3a42e16
"""

from alembic import op
import sqlalchemy as sa

revision = "c7e2f4a89b31"
down_revision = "b5d8f3a42e16"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Booking source for aggregator tracking ---
    op.add_column("booking", sa.Column("booking_source", sa.String(50), server_default="turfstack", nullable=False))

    # --- Tournament tables ---
    op.execute("""
        CREATE TABLE tournament (
            id SERIAL PRIMARY KEY,
            facility_id INT NOT NULL REFERENCES facility(id),
            name VARCHAR(200) NOT NULL,
            sport VARCHAR(50) NOT NULL,
            format VARCHAR(30) NOT NULL DEFAULT 'single_elimination',
            status VARCHAR(20) NOT NULL DEFAULT 'draft',
            start_date DATE NOT NULL,
            end_date DATE,
            registration_deadline DATE,
            max_teams INT,
            entry_fee NUMERIC(10,2) DEFAULT 0,
            prize_pool TEXT,
            rules TEXT,
            description TEXT,
            contact_phone VARCHAR(20),
            is_public BOOLEAN DEFAULT TRUE,
            created_by INT REFERENCES users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE tournament_team (
            id SERIAL PRIMARY KEY,
            tournament_id INT NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
            team_name VARCHAR(100) NOT NULL,
            player1_name VARCHAR(100) NOT NULL,
            player1_phone VARCHAR(20),
            player1_email VARCHAR(255),
            player2_name VARCHAR(100),
            player2_phone VARCHAR(20),
            seed INT,
            group_name VARCHAR(10),
            status VARCHAR(20) DEFAULT 'registered',
            registered_at TIMESTAMPTZ DEFAULT NOW(),
            registered_by INT REFERENCES users(id),
            UNIQUE(tournament_id, team_name)
        )
    """)

    op.execute("""
        CREATE TABLE tournament_match (
            id SERIAL PRIMARY KEY,
            tournament_id INT NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
            round INT NOT NULL,
            match_number INT NOT NULL,
            group_name VARCHAR(10),
            court_id INT REFERENCES court(id),
            scheduled_time TIMESTAMPTZ,
            team1_id INT REFERENCES tournament_team(id),
            team2_id INT REFERENCES tournament_team(id),
            score_team1 VARCHAR(50),
            score_team2 VARCHAR(50),
            winner_id INT REFERENCES tournament_team(id),
            status VARCHAR(20) DEFAULT 'scheduled',
            notes TEXT,
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(tournament_id, round, match_number)
        )
    """)

    op.create_index("idx_tournament_facility", "tournament", ["facility_id"])
    op.create_index("idx_tournament_status", "tournament", ["status"])
    op.create_index("idx_team_tournament", "tournament_team", ["tournament_id"])
    op.create_index("idx_match_tournament", "tournament_match", ["tournament_id"])
    op.create_index("idx_booking_source", "booking", ["booking_source"])


def downgrade() -> None:
    op.drop_index("idx_booking_source", table_name="booking")
    op.drop_index("idx_match_tournament", table_name="tournament_match")
    op.drop_index("idx_team_tournament", table_name="tournament_team")
    op.drop_index("idx_tournament_status", table_name="tournament")
    op.drop_index("idx_tournament_facility", table_name="tournament")
    op.execute("DROP TABLE IF EXISTS tournament_match")
    op.execute("DROP TABLE IF EXISTS tournament_team")
    op.execute("DROP TABLE IF EXISTS tournament")
    op.drop_column("booking", "booking_source")
