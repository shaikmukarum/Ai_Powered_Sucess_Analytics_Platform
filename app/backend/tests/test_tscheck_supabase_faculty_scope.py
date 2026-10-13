"""Criterion: Supabase-backed Faculty scope.

With a valid server session for faculty@demo.com, /api/risk-signals must return exactly
60 CSE-only signals; an unauthenticated request must return 401.
"""

import os

import httpx

API_URL = f"{os.environ.get('BACKEND_URL', 'http://localhost:8001')}/api"


def test_faculty_risk_signals_scoped_to_cse(faculty_session_cookie):
    with httpx.Client(base_url=API_URL, cookies={"success_copilot_session": faculty_session_cookie}, timeout=30.0) as client:
        resp = client.get("/risk-signals")
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["source"] == "supabase"
        signals = body["signals"]
        assert len(signals) == 60
        assert {s["department"] for s in signals} == {"CSE"}


def test_risk_signals_requires_authentication():
    with httpx.Client(base_url=API_URL, timeout=30.0) as client:
        resp = client.get("/risk-signals")
        assert resp.status_code == 401, resp.text
