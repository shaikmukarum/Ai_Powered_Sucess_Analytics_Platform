"""add student success records without destructive resets"""

from alembic import op

revision = "0001_student_success"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS user_profiles (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(128) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'Faculty',
      department VARCHAR(32) NOT NULL DEFAULT 'CSE',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_profiles_user_id ON user_profiles (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_profiles_email ON user_profiles (email)")
    op.execute("""
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      roll_no VARCHAR(64) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL,
      department VARCHAR(32) NOT NULL,
      semester INTEGER NOT NULL,
      initials VARCHAR(8) NOT NULL,
      cgpa DOUBLE PRECISION NOT NULL,
      attendance INTEGER NOT NULL,
      lms INTEGER NOT NULL,
      skills INTEGER NOT NULL,
      placement INTEGER NOT NULL,
      engagement INTEGER NOT NULL,
      backlogs INTEGER NOT NULL,
      success_score INTEGER NOT NULL,
      academic_risk VARCHAR(16) NOT NULL,
      placement_risk VARCHAR(16) NOT NULL,
      segment VARCHAR(64) NOT NULL,
      trend VARCHAR(16) NOT NULL,
      history JSONB NOT NULL,
      subjects JSONB NOT NULL,
      faculty_feedback TEXT NOT NULL,
      student_feedback TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_students_department ON students (department)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_students_semester ON students (semester)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_students_success_score ON students (success_score)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_students_academic_risk ON students (academic_risk)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_students_placement_risk ON students (placement_risk)")
    op.execute("""
    CREATE TABLE IF NOT EXISTS risk_assessments (
      id VARCHAR(36) PRIMARY KEY,
      student_id VARCHAR(64) NOT NULL,
      assessment_type VARCHAR(32) NOT NULL,
      risk_level VARCHAR(16) NOT NULL,
      risk_score DOUBLE PRECISION NOT NULL,
      factors JSONB NOT NULL,
      assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_risk_assessments_student_id ON risk_assessments (student_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_risk_assessments_type ON risk_assessments (assessment_type)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS risk_assessments")
    op.execute("DROP TABLE IF EXISTS students")
    op.execute("DROP TABLE IF EXISTS user_profiles")