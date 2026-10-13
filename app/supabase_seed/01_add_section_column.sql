ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(8) NOT NULL DEFAULT 'A';
CREATE INDEX IF NOT EXISTS ix_students_section ON students (section);
