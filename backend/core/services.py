from datetime import datetime
from typing import List, Dict, Any, Optional

class MoneyService:
    def __init__(self, storage: Any):
        """
        storage can be JSONStorage or SupabaseStorage
        It must implement:
        - get_expenses(month)
        - add_expense(amount, category, note, date)
        - update_expense(id, updates)
        - delete_expense(id)
        - get_budget()
        - update_budget(new_budget)
        - delete_budget_category(category)
        """
        self.storage = storage

    # --- EXPENSE OPS ---
    def get_expenses(self, month: Optional[str] = None) -> List[Dict]:
        return self.storage.get_expenses(month)

    def add_expense(self, amount: int, category: str, note: str, date: str) -> Dict:
        date_str = date or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return self.storage.add_expense(amount, category, note, date_str)

    def update_expense(self, expense_id: int, updates: Dict) -> bool:
        return self.storage.update_expense(expense_id, updates)

    def delete_expense(self, expense_id: int) -> bool:
        return self.storage.delete_expense(expense_id)

    # --- BUDGET OPS ---
    def get_budget(self) -> Dict:
        return self.storage.get_budget()

    def update_budget(self, new_budget: Dict):
        self.storage.update_budget(new_budget)

    def delete_budget_category(self, category: str):
        self.storage.delete_budget_category(category)
