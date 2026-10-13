# AI Student Success Copilot — Living Spec

## Current MVP
- Supabase-connected student success dashboard for college Admins and Faculty, with a clearly labeled read-only mock fallback.
- Dark cosmic UI with light-purple luminescence, glass cards, Recharts analytics, Motion transitions, and responsive/collapsible navigation.
- Login uses Supabase email/password when accounts exist, exchanges the Supabase token for an HttpOnly app session, and retains one-click local demo fallback. Admin sees all five departments; Faculty sees CSE only.
- Supabase PostgreSQL is migrated additively and seeded with 300 student profiles plus 600 academic/placement risk assessments. Matching deterministic mock data provides fallback continuity.

## Key flows
1. `/login` → choose Admin or Faculty demo → enter command center.
2. `/` → dashboard KPI cards, semester trends, risk distribution, department comparison, risk heatmap, alerts, and priority queue.
3. `/students` → search/filter by department, risk, and segment → click a row.
4. `/students/:studentId` → Student 360 hero, score ring, trajectory, academic and signal cards; Explainability, Recommendations, and Interventions tabs.
5. `/risk` → switch academic/placement risk, filter by department and level, inspect trend/distribution/heatmap, and open a ranked student profile.

## Data model
`Student` is a typed local model containing identity, department/semester, CGPA, attendance, LMS, skills, placement, engagement, backlogs, computed success score, academic/placement risks, segment, semester history, subjects, and feedback.

## Integration status
- Supabase Auth and PostgreSQL are connected. Privileged database credentials remain backend-only; the browser receives only the project URL and anon key.
- If Supabase Auth or data reads are unavailable, known demo credentials continue in visibly labeled mock fallback mode.
- Copilot responses and recommendation generation are deterministic rule-based UI flows, not an LLM integration.

## Roles
- Admin: `admin@demo.com`, all departments.
- Faculty: `faculty@demo.com`, CSE scope.