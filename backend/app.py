"""
backend/app.py - Flask REST API entry point for MoneyPro.

Serves all /api/* endpoints. Frontend (React/Vite) runs separately.
"""
import os
import json
import csv
import io
from datetime import datetime

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv

from core.services import MoneyService
from core.supabase_storage import SupabaseStorage
from core.sqlite_storage import SQLiteStorage
from core.auth_service import AuthService
from core.circle_service import CircleService
from core.sync_service import SyncService

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
load_dotenv()

app = Flask(__name__)

# Allow the Vite dev server (5173/5174) and production origin in CORS.
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
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

print("💾 Initialising Local SQLite Storage")
# Use absolute paths to avoid confusion with CWD
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "data", "moneypro.db")
storage = SQLiteStorage(db_path)
service = MoneyService(storage)

# Local Services for Auth and Circles
users_json = os.path.join(BASE_DIR, "data", "users.json")
circles_json = os.path.join(BASE_DIR, "data", "circles.json")
auth_service = AuthService(data_file=users_json)
circle_service = CircleService(data_file=circles_json)
sync_service = SyncService(SUPABASE_URL, SUPABASE_KEY, storage)

# In-memory "session" for testing (resets on restart)
# In a real app, use Flask-Session or JWT
_current_user = None


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


# Note: The original Supabase signup code was commented out. 
# We are currently using a local AuthService for testing/demo purposes.
# If migrating back to fully Supabase, replace register/login with Supabase client calls.


@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")
    try:
        user = auth_service.register(email, password)
        return jsonify({"status": "success", "user": user})
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400


@app.route("/api/auth/login", methods=["POST"])
def login():
    global _current_user
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")
    user = auth_service.login(email, password)
    if user:
        _current_user = user
        storage.set_user_id(user["id"])
        return jsonify({"status": "success", "user": user})
    return jsonify({"status": "error", "message": "Invalid email or password"}), 401


@app.route("/api/auth/recover", methods=["POST"])
def recover_account():
    data = request.json or {}
    user_id = data.get("user_id")
    new_email = data.get("email")
    new_password = data.get("password")
    
    if not user_id or not new_email or not new_password:
        return jsonify({"status": "error", "message": "Missing required fields"}), 400
        
    try:
        if auth_service.recover_by_id(user_id, new_email, new_password):
            return jsonify({"status": "success", "message": "Account recovered successfully"})
        return jsonify({"status": "error", "message": "Recovery failed"}), 400
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400


@app.route("/api/auth/session", methods=["GET", "DELETE"])
def session_handler():
    global _current_user
    if request.method == "GET":
        if _current_user:
            storage.set_user_id(_current_user["id"])
            return jsonify({
                "status": "authenticated",
                "user": _current_user
            })
        
        # Fallback to legacy env user if nothing set
        legacy_id = os.getenv("SUPABASE_USER_ID")
        if legacy_id:
             return jsonify({
                "status": "authenticated",
                "user": {
                    "id": legacy_id,
                    "email": "demo@moneypro.ai",
                },
            })

        return jsonify({"status": "unauthenticated"}), 401

    if request.method == "DELETE":
        _current_user = None
        return jsonify({"status": "success", "message": "Logged out"})

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
# Export routes
# ---------------------------------------------------------------------------
@app.route("/api/export", methods=["GET"])
def export_expenses():
    """Export all expenses for the current user as a CSV file download."""
    month = request.args.get("month")
    expenses = service.get_expenses(month)

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["id", "date", "category", "amount", "note", "is_recurring"],
        extrasaction="ignore"
    )
    writer.writeheader()
    for exp in expenses:
        writer.writerow(exp)

    filename = f"moneypro_{month or 'all'}_{datetime.now().strftime('%Y%m%d')}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ---------------------------------------------------------------------------
# Circle / Group Tracking routes
# ---------------------------------------------------------------------------

@app.route("/api/circles/mine", methods=["GET", "POST"])
def manage_my_circles():
    if not _current_user:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    if request.method == "POST":
        data = request.json or {}
        name = data.get("name", "New Circle")
        circle = circle_service.create_circle(_current_user["id"], name)
        return jsonify({"status": "success", "circle": circle})
    else:
        # GET
        storage.set_user_id(_current_user["id"])
        return jsonify(circle_service.get_user_circles(_current_user["id"]))


@app.route("/api/circles/invite", methods=["POST"])
def invite_to_circle():
    if not _current_user:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    data = request.json or {}
    circle_id = data.get("circle_id")
    email = data.get("email")
    share_tx = data.get("share_transactions", True)
    share_bg = data.get("share_budget", True)
    
    # Verify ownership
    circles = circle_service.get_user_circles(_current_user["id"])
    if not any(c["id"] == circle_id for c in circles):
        return jsonify({"status": "error", "message": "Forbidden"}), 403
    
    # Prevent self-invitation
    if email.lower() == _current_user["email"].lower():
        return jsonify({"status": "error", "message": "You cannot invite yourself to your own circle."}), 400

    if circle_service.invite_member(circle_id, email, share_tx, share_bg):
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Already invited or circle not found"}), 400


@app.route("/api/circles/pending")
def get_pending_invites():
    if not _current_user:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    return jsonify(circle_service.get_pending_invites(_current_user["email"]))


@app.route("/api/circles/respond", methods=["POST"])
def respond_to_invite():
    if not _current_user:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    data = request.json or {}
    circle_id = data.get("circle_id")
    response = data.get("response") # "accept" or "deny"
    
    if not circle_id or not response:
        return jsonify({"status": "error", "message": "Missing fields"}), 400
        
    if circle_service.respond_to_invite(circle_id, _current_user["email"], response):
        # If accepted, we might want to sync data for that circle's owner? 
        # For now just success.
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Failed to respond to invite"}), 400


@app.route("/api/sync/supabase", methods=["POST"])
def sync_data():
    if not _current_user:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    # We use the _current_user['id'] which we reconstructed via Recovery
    if sync_service.sync_from_supabase(_current_user["id"]):
        return jsonify({"status": "success", "message": "Data synced from cloud"})
    return jsonify({"status": "error", "message": "Sync failed"}), 500


# Redundant route removed (consolidated into /api/circles/mine above)


@app.route("/api/circles/shared-with-me")
def get_shared_circles():
    if not _current_user:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    return jsonify(circle_service.get_shared_with_me(_current_user["email"]))


@app.route("/api/watch/summary")
def watch_summary():
    """Get someone else's summary if they shared it with you."""
    if not _current_user:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    target_user_id = request.args.get("user_id")
    
    # Permission check
    shared = circle_service.get_shared_with_me(_current_user["email"])
    permit = next((s for s in shared if s["owner_id"] == target_user_id), None)
    
    if not permit or not permit["permissions"]["share_budget"]:
        return jsonify({"status": "error", "message": "Access denied"}), 403
    
    return jsonify(service.get_summary(user_id=target_user_id))


@app.route("/api/watch/expenses")
def watch_expenses():
    """Get someone else's expenses if they shared it with you."""
    if not _current_user:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    target_user_id = request.args.get("user_id")
    month = request.args.get("month")
    
    # Permission check
    shared = circle_service.get_shared_with_me(_current_user["email"])
    permit = next((s for s in shared if s["owner_id"] == target_user_id), None)
    
    if not permit or not permit["permissions"]["share_transactions"]:
        return jsonify({"status": "error", "message": "Access denied"}), 403
    
    return jsonify(service.get_expenses(month=month, user_id=target_user_id))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Ensure profile and local sync only for supabase mode or legacy
    # For SQLite, it's handled by __init__
    if isinstance(storage, SupabaseStorage):
        try:
            storage.ensure_profile()
            sync_local_data()
        except Exception as exc:
            print(f"⚠️  Startup error: {exc}")

    app.run(host="0.0.0.0", port=5001, debug=True)
