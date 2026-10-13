"""add class section to students"""

from alembic import op

revision = "0002_student_sections"
down_revision = "0001_student_success"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(8) NOT NULL DEFAULT 'A'")
    op.execute("CREATE INDEX IF NOT EXISTS ix_students_section ON students (section)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_students_section")
    op.execute("ALTER TABLE students DROP COLUMN IF EXISTS section")
