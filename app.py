from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime
from dotenv import load_dotenv
from core.services import MoneyService
from core.supabase_storage import SupabaseStorage

load_dotenv()

app = Flask(__name__)

# --- STORAGE INITIALIZATION ---
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY or 'your_supabase' in SUPABASE_URL:
    raise RuntimeError("Supabase credentials not found. Please configure .env with SUPABASE_URL and SUPABASE_KEY.")

print("🌐 Initializing Supabase Storage")
storage = SupabaseStorage(SUPABASE_URL, SUPABASE_KEY)
service = MoneyService(storage)

# --- ONE-TIME DATA SYNC ---
def sync_local_data():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(BASE_DIR, 'data')
    expense_path = os.path.join(data_dir, 'expenses.json')
    budget_path = os.path.join(data_dir, 'budget.json')

    # Quick check if there's anything to sync
    if not os.path.exists(expense_path) and not os.path.exists(budget_path):
        return

    print("🔄 Local data detected. Starting one-time sync to Supabase...")
    
    try:
        # Sync Expenses
        if os.path.exists(expense_path):
            with open(expense_path, 'r', encoding='utf-8') as f:
                expenses = json.load(f)
            for exp in expenses:
                service.add_expense(
                    amount=exp['amount'],
                    category=exp['category'],
                    note=exp.get('note', ''),
                    date=exp['date']
                )
            os.rename(expense_path, expense_path + '.migrated')
            print(f"✅ Synced {len(expenses)} expenses.")

        # Sync Budget
        if os.path.exists(budget_path):
            with open(budget_path, 'r', encoding='utf-8') as f:
                budget = json.load(f)
            service.update_budget(budget)
            os.rename(budget_path, budget_path + '.migrated')
            print(f"✅ Synced budget categories.")
            
    except Exception as e:
        print(f"⚠️ Sync failed: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    try:
        res = storage.client.auth.sign_up({"email": email, "password": password})
        user_data = {"id": res.user.id, "email": res.user.email} if res.user else None
        return jsonify({"status": "success", "user": user_data})
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Signup error:\n{error_details}")
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    try:
        res = storage.client.auth.sign_in_with_password({"email": email, "password": password})
        # Note: In a real app we might set a secure cookie here, 
        # but for SPA we'll return the session so the frontend can store it.
        session_data = None
        if res.session:
            session_data = {
                "access_token": res.session.access_token,
                "refresh_token": res.session.refresh_token,
            }
        user_data = {"id": res.user.id, "email": res.user.email} if res.user else None
        return jsonify({"status": "success", "session": session_data, "user": user_data})
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 401

@app.route('/api/auth/session', methods=['GET', 'DELETE'])
def session_handler():
    if request.method == 'GET':
        try:
            res = storage.client.auth.get_user()
            if res.user:
                user_data = {"id": res.user.id, "email": res.user.email}
                return jsonify({"status": "authenticated", "user": user_data})
        except:
            pass
        return jsonify({"status": "unauthenticated"}), 401
    
    elif request.method == 'DELETE':
        try:
            storage.client.auth.sign_out()
            return jsonify({"status": "success", "message": "Logged out"})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
    
    return jsonify({"status": "error", "message": "Method not allowed"}), 405

@app.route('/api/list')
def get_expenses():
    month = request.args.get('month')
    return jsonify(service.get_expenses(month))

@app.route('/api/budget')
def get_budget():
    return jsonify(service.get_budget())

@app.route('/api/expense/delete')
def delete_expense():
    expense_id = request.args.get('id', type=int)
    if expense_id is not None and service.delete_expense(expense_id):
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Expense not found"}), 404

@app.route('/api/add', methods=['POST'])
def add_expense():
    data = request.json
    try:
        item = service.add_expense(
            amount=int(data.get('amount', 0)),
            category=data.get('category', 'Khác'),
            note=data.get('note', ''),
            date=data.get('date')
        )
        return jsonify({"status": "success", "data": item})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/expense/update', methods=['POST'])
def update_expense():
    data = request.json
    expense_id = int(data.get('id', 0))
    if service.update_expense(expense_id, data):
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Expense not found"}), 404

@app.route('/api/budget/update', methods=['POST'])
def update_budget():
    data = request.json
    service.update_budget(data)
    return jsonify({"status": "success"})

@app.route('/api/budget/delete', methods=['POST'])
def delete_budget_category():
    data = request.json
    category = data.get('category')
    if category:
        service.delete_budget_category(category)
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Category required"}), 400

if __name__ == '__main__':
    # Run sync before starting
    try:
        storage.ensure_profile()
        sync_local_data()
    except Exception as e:
        print(f"⚠️ Startup sync failed: {e}")
        
    app.run(host='0.0.0.0', port=5000, debug=True)
