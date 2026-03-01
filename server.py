import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
from core.services import MoneyService

# --- CONFIG ---
BASE_DIR = '/home/huyquochuynh009/.openclaw/workspace/money-tracker'
EXPENSE_PATH = os.path.join(BASE_DIR, 'expenses.json')
BUDGET_PATH = os.path.join(BASE_DIR, 'budget.json')
# Fen có thể đổi password ở đây
APP_PASSWORD = "123" 

service = MoneyService(EXPENSE_PATH, BUDGET_PATH)

class MoneyTrackerHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        if path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            with open(os.path.join(BASE_DIR, 'templates/index.html'), 'r') as f:
                self.wfile.write(f.read().encode('utf-8'))
        
        elif path == '/api/list':
            self._send_json(service.get_expenses())
            
        elif path == '/api/budget':
            self._send_json(service.get_budget())

        elif path == '/api/expense/delete':
            expense_id = int(params.get('id', [0])[0])
            if service.delete_expense(expense_id):
                self._send_json({"status": "success"})
            else:
                self._send_json({"status": "error"}, 404)

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        data = json.loads(self.rfile.read(content_length).decode('utf-8'))
        path = self.path

        if path == '/api/add':
            item = service.add_expense(
                amount=int(data.get('amount', 0)),
                category=data.get('category', 'Khác'),
                note=data.get('note', ''),
                date=data.get('date')
            )
            self._send_json({"status": "success", "data": item})

        elif path == '/api/expense/update':
            expense_id = int(data.get('id', 0))
            if service.update_expense(expense_id, data):
                self._send_json({"status": "success"})
            else:
                self._send_json({"status": "error"}, 404)

        elif path == '/api/budget/update':
            service.update_budget(data)
            self._send_json({"status": "success"})

        elif path == '/api/budget/delete':
            service.delete_budget_category(data.get('category'))
            self._send_json({"status": "success"})

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 5000), MoneyTrackerHandler)
    print("🚀 Clean Server started at port 5000")
    server.serve_forever()
