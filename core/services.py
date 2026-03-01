from datetime import datetime
from typing import List, Dict, Any, Optional
from core.storage import JSONStorage

class MoneyService:
    def __init__(self, expense_path: str, budget_path: str):
        self.expense_db = JSONStorage(expense_path)
        self.budget_db = JSONStorage(budget_path)

    # --- EXPENSE OPS ---
    def get_expenses(self, month: Optional[str] = None) -> List[Dict]:
        data = self.expense_db.read()
        if month:
            return [e for e in data if e['date'].startswith(month)]
        return data

    def add_expense(self, amount: int, category: str, note: str, date: str) -> Dict:
        expenses = self.expense_db.read()
        new_item = {
            'id': int(datetime.now().timestamp() * 1000),
            'amount': amount,
            'category': category,
            'note': note,
            'date': date or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        expenses.append(new_item)
        self.expense_db.write(expenses)
        return new_item

    def update_expense(self, expense_id: int, updates: Dict) -> bool:
        expenses = self.expense_db.read()
        for e in expenses:
            if e['id'] == expense_id:
                e.update(updates)
                self.expense_db.write(expenses)
                return True
        return False

    def delete_expense(self, expense_id: int) -> bool:
        expenses = self.expense_db.read()
        filtered = [e for e in expenses if e['id'] != expense_id]
        if len(filtered) != len(expenses):
            self.expense_db.write(filtered)
            return True
        return False

    # --- BUDGET OPS ---
    def get_budget(self) -> Dict:
        return self.budget_db.read()

    def update_budget(self, new_budget: Dict):
        self.budget_db.write(new_budget)

    def delete_budget_category(self, category: str):
        budget = self.get_budget()
        if category in budget:
            del budget[category]
            self.update_budget(budget)
