import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime
from urllib.parse import parse_qs, urlparse

DB_PATH = '/home/huyquochuynh009/.openclaw/workspace/money-tracker/expenses.json'

def load_data():
    if not os.path.exists(DB_PATH) or os.stat(DB_PATH).st_size == 0:
        return []
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except:
            return []

def save_data(data):
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

class MoneyTrackerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            with open('/home/huyquochuynh009/.openclaw/workspace/money-tracker/templates/index.html', 'r') as f:
                html = f.read()
            self.wfile.write(html.encode('utf-8'))
            
        elif path == '/api/list':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(load_data()).encode('utf-8'))
            
        elif path == '/api/budget':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            budget_path = '/home/huyquochuynh009/.openclaw/workspace/money-tracker/budget.json'
            with open(budget_path, 'r', encoding='utf-8') as f:
                budget = json.load(f)
            self.wfile.write(json.dumps(budget).encode('utf-8'))

        elif path == '/api/expense/delete':
            params = parse_qs(parsed_path.query)
            expense_id = int(params.get('id', [0])[0])
            expenses = load_data()
            expenses = [e for e in expenses if e['id'] != expense_id]
            save_data(expenses)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path == '/api/add':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            expenses = load_data()
            date_str = data.get('date') or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            new_item = {
                'id': int(datetime.now().timestamp() * 1000), # Dùng timestamp làm ID để tránh trùng
                'date': date_str,
                'amount': int(data.get('amount', 0)),
                'category': data.get('category', 'Khác'),
                'note': data.get('note', '')
            }
            expenses.append(new_item)
            save_data(expenses)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            
        elif self.path == '/api/expense/update':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            expenses = load_data()
            for e in expenses:
                if e['id'] == int(data['id']):
                    e['amount'] = int(data['amount'])
                    e['category'] = data['category']
                    e['note'] = data['note']
                    e['date'] = data['date']
                    break
            save_data(expenses)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))

        elif self.path == '/api/budget/update':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            new_budget = json.loads(post_data.decode('utf-8'))
            budget_path = '/home/huyquochuynh009/.openclaw/workspace/money-tracker/budget.json'
            with open(budget_path, 'w', encoding='utf-8') as f:
                json.dump(new_budget, f, ensure_ascii=False, indent=4)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))

        elif self.path == '/api/budget/delete':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            cat_to_delete = json.loads(post_data.decode('utf-8')).get('category')
            budget_path = '/home/huyquochuynh009/.openclaw/workspace/money-tracker/budget.json'
            with open(budget_path, 'r', encoding='utf-8') as f:
                budget = json.load(f)
            if cat_to_delete in budget:
                del budget[cat_to_delete]
                with open(budget_path, 'w', encoding='utf-8') as f:
                    json.dump(budget, f, ensure_ascii=False, indent=4)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 5000), MoneyTrackerHandler)
    print("Server started at port 5000")
    server.serve_forever()
