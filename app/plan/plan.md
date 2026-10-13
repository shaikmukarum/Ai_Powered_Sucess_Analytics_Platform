# Supabase Reconnection and Reliable Sign-Out

Reconnect the student success workspace to the existing Supabase project using the newly supplied pooler connection.
Make live authentication the normal experience for confirmed users, retain an honest outage fallback, and give every user an obvious way to sign out.

## Who it's for

- Admins who need institution-wide access backed by persisted Supabase records.
- Faculty who need secure access limited to their assigned department.
- Demo reviewers who need dependable access even if Supabase is temporarily unavailable.

## Core features and experience

- Replace the rejected database credential with the new transaction-pooler connection and reconnect to the existing project without resetting or replacing current records.
- Use Supabase email/password login for confirmed Admin and Faculty identities.
- Continue enforcing Admin access across all departments and Faculty access only within the assigned department.
- Use the mock experience only when Supabase is unavailable, with a visible “mock fallback” label so it is never mistaken for live data.
- Add a standalone **Sign out** row directly below **Help Center** in the left navigation.
- Keep the existing **Sign out** control inside the user identity card as a second exit point.
- Make both sign-out controls perform the same complete logout: end the Supabase session, clear the server session, clear locally cached account data, and return to the login page.
- Preserve the existing Dashboard, Students, Student 360, and Risk Signals experiences while the connection changes.

## User flow

1. A confirmed user opens the login page and signs in with Supabase email and password.
2. The workspace resolves the user’s role and department before showing protected pages.
3. Live Supabase data is shown and labeled as live.
4. If Supabase is temporarily unreachable, approved demo credentials enter the clearly labeled mock fallback instead of showing a blank or broken workspace.
5. The user can sign out either below Help Center or from the user identity card.
6. Signing out removes all account-specific state and returns the user to the login page; protected routes cannot be reopened without signing in again.

## UI/UX feel

- Keep the current premium dark command-center appearance and compact left navigation.
- Place the standalone Sign out row immediately beneath Help Center with the same spacing and interaction style, using a restrained rose hover treatment to signal a session-ending action.
- Keep the identity-card Sign out action visually secondary but fully accessible.
- Continue showing a concise live/fallback status indicator in the shell.
- Provide clear progress and failure feedback during login and logout without interrupting the rest of the page.

## Implementation phases

### Phase 1 — MVP built now

- Reconnect the existing Supabase database with the new transaction-pooler credential.
- Confirm the current schema and records remain available without destructive resets.
- Restore live login and session refresh for confirmed Supabase users.
- Keep outage-only mock fallback for approved demo credentials, with explicit labeling.
- Add both requested Sign out controls and unify their logout behavior.
- Preserve role-based route and department access across all current pages.

### Phase 2 — Session administration

- Add an Admin view of active users, role assignments, departments, and recent sign-in activity.
- Add account recovery and clearer expired-session guidance.
- Add an audit trail for sign-in, sign-out, and role changes.

### Phase 3 — Institutional identity

- Add college single sign-on, optional multi-factor authentication, and configurable session-duration policies.
- Add managed onboarding and offboarding for Faculty accounts.
- Allow institutions to disable mock fallback in production environments.

## Assumptions

- The supplied project URL and anon key remain unchanged; only the database pooler credential is being replaced.
- The new URI is the intended transaction-pooler connection on port 6543, and the `%40` sequence is the encoded `@` character in the password.
- Existing Supabase tables and student/risk records must be preserved; no table reset or destructive migration is acceptable.
- Supabase email confirmation remains enabled. Demo identities use live login only after they are confirmed through Supabase; confirmation is not bypassed in application code.
- Admin and Faculty role mappings already agreed for the workspace remain unchanged.
- Mock fallback is read-only and activates only for approved demo credentials when live authentication or data access is unavailable.
- Both Sign out controls remain visible on desktop; on mobile they are available inside the opened sidebar.