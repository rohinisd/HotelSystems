"""Add indexes on payment table for faster lookups.

Revision ID: b5d8f3a42e16
Revises: a3c7e9b21d04
"""

from alembic import op

revision = "b5d8f3a42e16"
down_revision = "a3c7e9b21d04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("idx_payment_razorpay_order_id", "payment", ["razorpay_order_id"], unique=False)
    op.create_index("idx_payment_status", "payment", ["status"], unique=False)
    op.create_index("idx_payment_booking_id", "payment", ["booking_id"], unique=False)
    op.create_index("idx_booking_status", "booking", ["status"], unique=False)
    op.create_index("idx_booking_date_facility", "booking", ["facility_id", "date"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_booking_date_facility", table_name="booking")
    op.drop_index("idx_booking_status", table_name="booking")
    op.drop_index("idx_payment_booking_id", table_name="payment")
    op.drop_index("idx_payment_status", table_name="payment")
    op.drop_index("idx_payment_razorpay_order_id", table_name="payment")
