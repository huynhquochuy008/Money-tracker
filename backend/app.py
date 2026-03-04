"""
backend/app.py - Flask REST API entry point for MoneyPro.

Serves all /api/* endpoints. Frontend (React/Vite) runs separately.
"""
import os
import json
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from core.services import MoneyService
from core.supabase_storage import SupabaseStorage

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
load_dotenv()

app = Flask(__name__)

# Allow the Vite dev server (5173) and production origin in CORS.
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
     supports_credentials=True)

# ---------------------------------------------------------------------------
# Storage / Service initialisation
# ---------------------------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or "your_supabase" in SUPABASE_URL:
    raise RuntimeError(
        "Supabase credentials not found. "
        "Please configure .env with SUPABASE_URL and SUPABASE_KEY."
    )

print("🌐 Initialising Supabase Storage")
storage = SupabaseStorage(SUPABASE_URL, SUPABASE_KEY)
service = MoneyService(storage)


# ---------------------------------------------------------------------------
# One-time local-data migration helper
# ---------------------------------------------------------------------------
def sync_local_data():
    """Sync any leftover JSON files to Supabase (runs once on startup)."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    expense_path = os.path.join(data_dir, "expenses.json")
    budget_path = os.path.join(data_dir, "budget.json")

    if not os.path.exists(expense_path) and not os.path.exists(budget_path):
        return

    print("🔄 Local data detected — starting one-time sync to Supabase …")

    try:
        if os.path.exists(expense_path):
            with open(expense_path, "r", encoding="utf-8") as f:
                expenses = json.load(f)
            for exp in expenses:
                service.add_expense(
                    amount=exp["amount"],
                    category=exp["category"],
                    note=exp.get("note", ""),
                    date=exp["date"],
                )
            os.rename(expense_path, expense_path + ".migrated")
            print(f"✅ Synced {len(expenses)} expenses.")

        if os.path.exists(budget_path):
            with open(budget_path, "r", encoding="utf-8") as f:
                budget = json.load(f)
            service.update_budget(budget)
            os.rename(budget_path, budget_path + ".migrated")
            print("✅ Synced budget categories.")

    except Exception as exc:
        print(f"⚠️  Sync failed: {exc}")


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
# @app.route("/api/auth/signup", methods=["POST"])
# def signup():
#     """Register a new user with email + password."""
#     data = request.json or {}
#     email = data.get("email")
#     password = data.get("password")
#     try:
#         res = storage.client.auth.sign_up({"email": email, "password": password})
#         
#         # Ensure profile exists immediately
#         storage.ensure_profile()
#         
#         user_data = None
#         if res.user:
#             user_data = {
#                 "id": res.user.id,
#                 "email": res.user.email,
#                 "created_at": res.user.created_at,
#             }
#         return jsonify({
#             "status": "success",
#             "user": user_data,
#         })
#     except Exception as exc:
#         import traceback
#         print(f"❌ Signup error:\n{traceback.format_exc()}")
#         return jsonify({"status": "error", "message": str(exc)}), 400


# @app.route("/api/auth/login", methods=["POST"])
# def login():
#     """Authenticate a user with email + password, return session."""
#     data = request.json or {}
#     email = data.get("email")
#     password = data.get("password")
#     try:
#         res = storage.client.auth.sign_in_with_password(
#             {"email": email, "password": password}
#         )
#         
#         # Ensure profile exists immediately
#         storage.ensure_profile()
#         
#         session_data = None
#         if res.session:
#             session_data = {
#                 "access_token": res.session.access_token,
#                 "refresh_token": res.session.refresh_token,
#                 "expires_in": res.session.expires_in,
#                 "token_type": res.session.token_type,
#                 "user": {
#                     "id": res.session.user.id,
#                     "email": res.session.user.email,
#                 }
#             }
#         return jsonify({
#             "status": "success",
#             "session": session_data,
#         })
#     except Exception as exc:
#         print(f"❌ Login error: {exc}")
#         return jsonify({"status": "error", "message": str(exc)}), 401


@app.route("/api/auth/session", methods=["GET", "DELETE"])
def session_handler():
    """Hardcoded to always return authenticated status for No-Auth mode."""
    if request.method == "GET":
        return jsonify({
            "status": "authenticated",
            "user": {
                "id": os.getenv("SUPABASE_USER_ID"),
                "email": "demo@moneypro.ai",
            },
        })

    if request.method == "DELETE":
        return jsonify({"status": "success", "message": "Logged out (mock)"})

    return jsonify({"status": "error", "message": "Method not allowed"}), 405


# ---------------------------------------------------------------------------
# Expense routes
# ---------------------------------------------------------------------------
@app.route("/api/list")
def get_expenses():
    """Return all expenses, optionally filtered by month (YYYY-MM)."""
    month = request.args.get("month")
    return jsonify(service.get_expenses(month))


@app.route("/api/summary")
def get_summary():
    """Return aggregated spending for day, week, month, year."""
    return jsonify(service.get_summary())


@app.route("/api/add", methods=["POST"])
def add_expense():
    """Add a new expense record."""
    data = request.json or {}
    try:
        item = service.add_expense(
            amount=int(data.get("amount", 0)),
            category=data.get("category", "Khác"),
            note=data.get("note", ""),
            date=data.get("date"),
        )
        return jsonify({"status": "success", "data": item})
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400


@app.route("/api/expense/update", methods=["POST"])
def update_expense():
    """Update an existing expense by id."""
    data = request.json or {}
    expense_id = int(data.get("id", 0))
    if service.update_expense(expense_id, data):
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Expense not found"}), 404


@app.route("/api/expense/delete")
def delete_expense():
    """Delete an expense by id (query param)."""
    expense_id = request.args.get("id", type=int)
    if expense_id is not None and service.delete_expense(expense_id):
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Expense not found"}), 404


# ---------------------------------------------------------------------------
# Budget routes
# ---------------------------------------------------------------------------
@app.route("/api/budget")
def get_budget():
    """Return the current user's budget config."""
    return jsonify(service.get_budget())


@app.route("/api/budget/update", methods=["POST"])
def update_budget():
    """Upsert one or more budget categories."""
    data = request.json or {}
    service.update_budget(data)
    return jsonify({"status": "success"})


@app.route("/api/budget/delete", methods=["POST"])
def delete_budget_category():
    """Delete a budget category by name."""
    data = request.json or {}
    category = data.get("category")
    if category:
        service.delete_budget_category(category)
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Category required"}), 400


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    try:
        storage.ensure_profile()
        sync_local_data()
    except Exception as exc:
        print(f"⚠️  Startup error: {exc}")

    app.run(host="0.0.0.0", port=5001, debug=True)
