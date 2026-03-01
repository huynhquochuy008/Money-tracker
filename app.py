from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)
DB_PATH = '/home/huyquochuynh009/.openclaw/workspace/money-tracker/expenses.json'

def load_data():
    if not os.path.exists(DB_PATH) or os.stat(DB_PATH).st_size == 0:
        return []
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

@app.route('/')
def index():
    expenses = load_data()
    total = sum(item['amount'] for item in expenses)
    return render_template('index.html', expenses=expenses, total=total)

@app.route('/api/add', methods=['POST'])
def add_expense():
    data = request.json
    expenses = load_data()
    new_item = {
        'id': len(expenses) + 1,
        'date': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'amount': data.get('amount', 0),
        'category': data.get('category', 'Khác'),
        'note': data.get('note', '')
    }
    expenses.append(new_item)
    save_data(expenses)
    return jsonify({"status": "success", "data": new_item})

@app.route('/api/list')
def get_list():
    return jsonify(load_data())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
