from datetime import datetime, timedelta, date as dt_date
from dateutil.relativedelta import relativedelta
from typing import List, Dict, Any, Optional

def add_months(sourcedate, months):
    return sourcedate + relativedelta(months=months)

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
        self.process_recurring_expenses()
        return self.storage.get_expenses(month)

    def add_expense(self, amount: int, category: str, note: str, date: str, is_recurring: bool = False, recurrence_interval: Optional[str] = None) -> Dict:
        date_str = date or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return self.storage.add_expense(amount, category, note, date_str, is_recurring, recurrence_interval)

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

    # --- SUMMARY OPS ---
    def get_summary(self) -> Dict[str, int]:
        """
        Calculate summary totals for day, week, month, and year.
        Periods are calculated relative to the local time.
        """
        now = datetime.now()
        today_str = now.strftime("%Y-%m-%d")
        month_str = now.strftime("%Y-%m")
        year_str = now.strftime("%Y")

        # Start of the week (Monday)
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week_str = start_of_week.strftime("%Y-%m-%d")

        # Fetch all expenses for the current year to calculate all totals
        all_expenses = self.storage.get_expenses(year_str)

        summary = {
            "day": 0,
            "week": 0,
            "month": 0,
            "year": 0
        }

        for exp in all_expenses:
            amount = exp.get("amount", 0)
            date_str = exp.get("date", "")
            
            # Year total (already filtered by storage)
            summary["year"] += amount
            
            # Month total
            if date_str.startswith(month_str):
                summary["month"] += amount
            
            # Day total
            if date_str.startswith(today_str):
                summary["day"] += amount
                
            # Week total
            if date_str >= start_of_week_str:
                summary["week"] += amount

        return summary

    def process_recurring_expenses(self):
        """
        Check all recurring expenses and generate new instances if the interval has passed.
        This is called on every 'get_expenses' to ensure data is up to date.
        """
        all_expenses = self.storage.get_expenses()
        recurring_templates = [e for e in all_expenses if e.get('is_recurring')]
        now = datetime.now()

        for template in recurring_templates:
            last_date_str = template.get('last_recurrence_date')
            if not last_date_str:
                continue
            
            last_date = datetime.strptime(last_date_str, "%Y-%m-%d")
            interval = template.get('recurrence_interval')
            
            next_date = None
            if interval == 'daily':
                next_date = last_date + timedelta(days=1)
            elif interval == 'weekly':
                next_date = last_date + timedelta(weeks=1)
            elif interval == 'monthly':
                next_date = add_months(last_date, 1)

            while next_date and next_date <= now:
                # Create a new expense instance
                print(f"🔄 Generating recurring expense: {template['category']} for {next_date.strftime('%Y-%m-%d')}")
                self.storage.add_expense(
                    amount=template['amount'],
                    category=template['category'],
                    note=template.get('note', ''),
                    date=next_date.strftime("%Y-%m-%d %H:%M:%S"),
                    is_recurring=False # New instances are NOT templates themselves
                )
                
                # Update the template's last_recurrence_date
                last_date = next_date
                template['last_recurrence_date'] = last_date.strftime("%Y-%m-%d")
                self.storage.update_expense(template['id'], {'last_recurrence_date': template['last_recurrence_date']})
                
                # Calculate next date
                if interval == 'daily':
                    next_date = last_date + timedelta(days=1)
                elif interval == 'weekly':
                    next_date = last_date + timedelta(weeks=1)
                elif interval == 'monthly':
                    next_date = add_months(last_date, 1)
