# Setup (Supabase only - no mock mode)

## First time
1. backend/.env and frontend/.env already hold the Supabase URL, anon key and DATABASE_URL.
2. Supabase -> SQL Editor: run supabase_schema.sql (creates the tables).
3. Open /api/health - it must show {"status":"ok","database":"connected","tablesReady":true}.

## Full college data (900 students + principal + 15 faculty logins)
Run these files from the supabase_seed/ folder in Supabase -> SQL Editor, in this order
(New query -> paste -> Run). Every file is safe to run twice.

  01_add_section_column.sql      adds the "section" column
  02_logins_and_profiles.sql     principal + faculty logins (see LOGINS.md for emails/passwords)
  03_students_CSE.sql ... 07_students_IT.sql   180 students each (3 sections x 60)

Optional clean slate first (deletes ALL students, e.g. the 12 sample ones):
  truncate students, risk_assessments;

Change the numbers (sections, students per section, faculty count, semesters, domain, passwords):
  edit backend/tools/generate_seed_sql.py, then run:  cd backend && python tools/generate_seed_sql.py

## Roles
- Principal  : sees and can edit every department.
- Admin      : emails in backend/.env -> ADMIN_EMAILS (same access as principal).
- Faculty    : only the students of their own department (all 3 sections).
