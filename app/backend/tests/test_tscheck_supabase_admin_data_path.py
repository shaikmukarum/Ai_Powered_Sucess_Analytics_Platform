"""Criterion: Supabase-backed Admin data path.

With a valid server session for admin@demo.com, /api/risk-signals must return
source=supabase with all 300 signals, and /api/students/stu-001 must resolve to the
seeded Aarav Mehta profile.
"""

import os

import httpx

API_URL = f"{os.environ.get('BACKEND_URL', 'http://localhost:8001')}/api"


def test_admin_risk_signals_supabase_source(admin_session_cookie):
    with httpx.Client(base_url=API_URL, cookies={"success_copilot_session": admin_session_cookie}, timeout=30.0) as client:
        resp = client.get("/risk-signals")
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["source"] == "supabase"
        assert len(body["signals"]) == 300


def test_admin_student_lookup_aarav_mehta(admin_session_cookie):
    with httpx.Client(base_url=API_URL, cookies={"success_copilot_session": admin_session_cookie}, timeout=30.0) as client:
        resp = client.get("/students/stu-001")
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["name"] == "Aarav Mehta"
        assert body["department"] == "CSE"
