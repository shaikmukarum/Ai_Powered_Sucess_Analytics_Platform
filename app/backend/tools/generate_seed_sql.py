"""Generate Supabase SQL for a full college dataset.

    python tools/generate_seed_sql.py          (run from the backend/ folder)

Writes ../supabase_seed/*.sql :
  01_add_section_column.sql   adds students.section
  02_logins_and_profiles.sql  principal + faculty logins and their access profiles
  03..07_students_<DEPT>.sql  60 students x 3 sections for each department

Scores, risk, segment, trend, history and feedback come from lib/scoring.py, so seeded
students are calculated exactly like students added through the app. Edit the settings
below and re-run to change the data (output is deterministic).
"""

import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib import scoring  # noqa: E402

OUT = Path(__file__).resolve().parent.parent.parent / "supabase_seed"

# ---- settings -------------------------------------------------------------------
DEPARTMENTS = ["CSE", "ECE", "MECH", "CIVIL", "IT"]
SECTIONS = ["A", "B", "C"]
STUDENTS_PER_SECTION = 60
SEMESTER_BY_DEPT = {"CSE": 6, "ECE": 4, "MECH": 2, "CIVIL": 8, "IT": 5}  # all sections of a dept share a semester
FACULTY_PER_DEPT = 3
EMAIL_DOMAIN = "campus.edu"
FACULTY_PASSWORD = "Faculty@123"
PRINCIPAL_EMAIL = f"principal@{EMAIL_DOMAIN}"
PRINCIPAL_PASSWORD = "Principal@123"
# ----------------------------------------------------------------------------------

FIRST = ["Aarav", "Aanya", "Aditya", "Anika", "Arjun", "Avni", "Dev", "Diya", "Ishaan", "Ira", "Kabir", "Kiara", "Krish", "Meera", "Nikhil", "Nisha", "Rohan", "Riya", "Saanvi", "Samarth", "Shreya", "Tanay", "Tara", "Ved", "Vikram", "Yash", "Zoya", "Aditi", "Karan", "Maya", "Rahul", "Priya", "Sneha", "Amit", "Pooja", "Harsh", "Neha", "Siddharth", "Ananya", "Varun", "Isha", "Manish", "Divya", "Rajat", "Kavya", "Tushar", "Lakshmi", "Venkat", "Sai", "Harini", "Charan", "Bhavana", "Teja", "Sravani", "Pranav", "Mounika", "Akhil", "Swathi", "Naveen", "Keerthi", "Imran", "Fatima", "Farhan", "Ayesha", "Gurpreet", "Simran", "Jaspreet", "Manpreet", "Joseph", "Maria", "Daniel", "Grace"]
LAST = ["Mehta", "Shah", "Iyer", "Patel", "Rao", "Nair", "Kapoor", "Bose", "Malhotra", "Joshi", "Desai", "Kulkarni", "Menon", "Bhat", "Saxena", "Chopra", "Sethi", "Pillai", "Ghosh", "Singh", "Reddy", "Naidu", "Sharma", "Verma", "Gupta", "Yadav", "Khan", "Sheikh", "Das", "Mukherjee", "Banerjee", "Chowdhury", "Jain", "Agarwal", "Mishra", "Pandey", "Thakur", "Chauhan", "Kumar", "Varma", "Prasad", "Murthy", "Shetty", "Hegde", "Dsouza", "Fernandes", "Gill", "Sandhu"]


def q(text: str) -> str:
    return "'" + str(text).replace("'", "''") + "'"


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def build_student(dept: str, section: str, number: int, serial: int) -> dict:
    rng = random.Random(f"{dept}-{section}-{number}")
    sem = SEMESTER_BY_DEPT[dept]
    first, last = rng.choice(FIRST), rng.choice(LAST)
    name = f"{first} {last}"
    ability = rng.gauss(0, 1)
    cgpa = round(clamp(7.1 + ability * 1.0 + rng.gauss(0, 0.35), 4.8, 9.9), 1)
    attendance = round(clamp(85 + ability * 7 + rng.gauss(0, 6), 38, 99))
    lms = round(clamp(66 + ability * 10 + rng.gauss(0, 12), 20, 99))
    skills = round(clamp(62 + ability * 11 + rng.gauss(0, 14), 20, 99))
    placement = round(clamp(58 + ability * 10 + (8 if sem >= 6 else 0) + rng.gauss(0, 13), 15, 99))
    engagement = round(clamp(64 + ability * 9 + rng.gauss(0, 13), 20, 99))
    if rng.random() < 0.08:  # ~8% genuinely struggling students so High-risk cases exist in the data
        cgpa = round(rng.uniform(4.8, 5.4), 1)
        attendance = rng.randint(38, 48)
        lms, skills, placement, engagement = (rng.randint(18, 45) for _ in range(4))
    backlogs = max(0, round((7.5 - cgpa) * 1.2 + rng.gauss(0, 0.6))) if cgpa < 7.5 else 0
    if attendance < 65:
        backlogs += 1
    derived = scoring.evaluate(cgpa, attendance, lms, skills, placement, engagement)
    score = derived["success_score"]

    history = []
    for s in range(1, sem + 1):
        gap = sem - s
        if gap == 0:
            history.append({"semester": s, "cgpa": cgpa, "attendance": attendance, "score": score})
        else:
            history.append({
                "semester": s,
                "cgpa": round(clamp(cgpa - gap * rng.uniform(0.04, 0.2) + rng.gauss(0, 0.12), 4.5, 9.9), 1),
                "attendance": round(clamp(attendance - gap * rng.uniform(0.3, 1.8) + rng.gauss(0, 2.5), 40, 99)),
                "score": round(clamp(score - gap * rng.uniform(0.6, 2.6) + rng.gauss(0, 2), 20, 99)),
            })
    subjects = [{"name": n, "score": round(clamp(score + rng.uniform(-10, 10), 42, 99))} for n in scoring.DEFAULT_SUBJECTS]
    faculty_fb, student_fb = scoring.default_feedback(attendance, score)
    return {
        "id": f"stu-{dept.lower()}{section.lower()}{number:02d}",
        "name": name,
        "roll_no": f"24{dept}{section}{number:02d}",
        "email": f"{first.lower()}.{last.lower()}{serial}@{EMAIL_DOMAIN}",
        "department": dept, "section": section, "semester": sem,
        "initials": scoring.initials_for(name),
        "cgpa": cgpa, "attendance": attendance, "lms": lms, "skills": skills, "placement": placement,
        "engagement": engagement, "backlogs": backlogs,
        "success_score": score, "academic_risk": derived["academic_risk"], "placement_risk": derived["placement_risk"],
        "segment": derived["segment"], "trend": scoring.real_trend(history, sem, score, None),
        "history": history, "subjects": subjects, "faculty_feedback": faculty_fb, "student_feedback": student_fb,
        "_academic_score": derived["academic_risk_score"], "_placement_score": derived["placement_risk_score"],
    }


COLUMNS = ["id", "name", "roll_no", "email", "department", "section", "semester", "initials", "cgpa", "attendance", "lms", "skills", "placement", "engagement", "backlogs", "success_score", "academic_risk", "placement_risk", "segment", "trend", "history", "subjects", "faculty_feedback", "student_feedback"]
TEXT = {"id", "name", "roll_no", "email", "department", "section", "initials", "academic_risk", "placement_risk", "segment", "trend", "faculty_feedback", "student_feedback"}


def row_sql(s: dict) -> str:
    cells = []
    for col in COLUMNS:
        v = s[col]
        if col in TEXT:
            cells.append(q(v))
        elif col in ("history", "subjects"):
            cells.append(q(json.dumps(v, ensure_ascii=False)) + "::jsonb")
        else:
            cells.append(str(v))
    return "(" + ", ".join(cells) + ")"


def assessments_sql(students: list[dict]) -> str:
    rows = []
    for s in students:
        rows.append(f"({q('ra-' + s['id'] + '-a')}, {q(s['id'])}, 'academic', {q(s['academic_risk'])}, {round(s['_academic_score'], 1)}, '[\"attendance\", \"cgpa\"]'::jsonb)")
        rows.append(f"({q('ra-' + s['id'] + '-p')}, {q(s['id'])}, 'placement', {q(s['placement_risk'])}, {round(s['_placement_score'], 1)}, '[\"skills\", \"placement\", \"engagement\"]'::jsonb)")
    return "INSERT INTO risk_assessments (id, student_id, assessment_type, risk_level, risk_score, factors) VALUES\n" + ",\n".join(rows) + "\nON CONFLICT (id) DO NOTHING;\n"


def users_sql() -> tuple[str, list[tuple[str, str, str, str]]]:
    accounts = [(PRINCIPAL_EMAIL, "Principal", "All departments", PRINCIPAL_PASSWORD)]
    for dept in DEPARTMENTS:
        for n in range(1, FACULTY_PER_DEPT + 1):
            accounts.append((f"{dept.lower()}.faculty{n}@{EMAIL_DOMAIN}", "Faculty", dept, FACULTY_PASSWORD))
    values = ",\n    ".join(f"({q(e)}, {q(r)}, {q(d)}, {q(p)})" for e, r, d, p in accounts)
    sql = f"""-- Creates the principal and faculty logins (already email-confirmed) and their access profiles.
-- Safe to run again: existing users are kept, their role/department are refreshed.
create extension if not exists pgcrypto;

do $$
declare
  r record;
  uid uuid;
begin
  for r in select * from (values
    {values}
  ) as t(email, role, dept, pw)
  loop
    select id into uid from auth.users where email = r.email;
    if uid is null then
      uid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token
      ) values (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', r.email,
        crypt(r.pw, gen_salt('bf')), now(),
        '{{"provider":"email","providers":["email"]}}'::jsonb, '{{}}'::jsonb, now(), now(),
        '', '', '', '', '', '', '', ''
      );
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), uid, uid::text,
              jsonb_build_object('sub', uid::text, 'email', r.email, 'email_verified', true),
              'email', now(), now(), now());
    end if;

    insert into public.user_profiles (id, user_id, email, role, department)
    values (gen_random_uuid()::text, uid::text, r.email, r.role, r.dept)
    on conflict (user_id) do update set role = excluded.role, department = excluded.department, email = excluded.email;
  end loop;
end $$;

select email, role, department from public.user_profiles order by role, department, email;
"""
    return sql, accounts


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.sql"):
        old.unlink()
    (OUT / "01_add_section_column.sql").write_text("ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(8) NOT NULL DEFAULT 'A';\nCREATE INDEX IF NOT EXISTS ix_students_section ON students (section);\n")
    sql, accounts = users_sql()
    (OUT / "02_logins_and_profiles.sql").write_text(sql)

    serial = 0
    total = 0
    for i, dept in enumerate(DEPARTMENTS):
        students = []
        for section in SECTIONS:
            for number in range(1, STUDENTS_PER_SECTION + 1):
                serial += 1
                students.append(build_student(dept, section, number, serial))
        body = f"-- {dept}: {len(students)} students ({len(SECTIONS)} sections x {STUDENTS_PER_SECTION}), semester {SEMESTER_BY_DEPT[dept]}. Safe to run again.\n"
        body += f"INSERT INTO students ({', '.join(COLUMNS)}) VALUES\n" + ",\n".join(row_sql(s) for s in students) + "\nON CONFLICT (roll_no) DO NOTHING;\n\n" + assessments_sql(students)
        (OUT / f"{i + 3:02d}_students_{dept}.sql").write_text(body)
        total += len(students)

    lines = ["# Logins created by 02_logins_and_profiles.sql", "", "| Role | Email | Password | Access |", "|---|---|---|---|"]
    for email, role, dept, pw in accounts:
        lines.append(f"| {role} | {email} | {pw} | {'all departments' if role == 'Principal' else dept + ' students only'} |")
    lines += ["", "Change these passwords after the first login (Supabase -> Authentication -> Users)."]
    (OUT / "LOGINS.md").write_text("\n".join(lines) + "\n")
    print(f"{total} students, {len(accounts)} logins -> {OUT}")


if __name__ == "__main__":
    main()
