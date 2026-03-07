import sqlite3
from typing import List, Dict, Any, Optional
from .models.expense import Expense
from .models.budget import Budget

class SQLiteStorage:
    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._init_db()
        self._user_id = "test-user"

    def _init_db(self):
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                amount REAL,
                category TEXT,
                note TEXT,
                date TEXT,
                is_recurring INTEGER DEFAULT 0,
                recurrence_interval TEXT,
                last_recurrence_date TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS budget (
                user_id TEXT,
                category TEXT,
                limit_amount REAL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, category)
            )
        """)
        self._conn.commit()

    def set_user_id(self, user_id: str):
        self._user_id = user_id

    def get_expenses(self, month: Optional[str] = None) -> List[Dict]:
        query = "SELECT * FROM expenses WHERE user_id = ?"
        params = [self._user_id]
        if month:
            query += " AND date LIKE ?"
            params.append(f"{month}%")
        
        self._conn.row_factory = sqlite3.Row
        rows = self._conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]

    def add_expense(self, amount: float, category: str, note: str, date: str, is_recurring: bool = False, recurrence_interval: Optional[str] = None) -> Dict:
        query = "INSERT INTO expenses (user_id, amount, category, note, date, is_recurring, recurrence_interval, last_recurrence_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        last_recurrence_date = date[:10] if is_recurring else None
        cursor = self._conn.execute(query, (self._user_id, amount, category, note, date, 1 if is_recurring else 0, recurrence_interval, last_recurrence_date))
        new_id = cursor.lastrowid
        self._conn.commit()
        return {
            "id": new_id,
            "amount": amount,
            "category": category,
            "note": note,
            "date": date,
            "user_id": self._user_id,
            "is_recurring": is_recurring,
            "recurrence_interval": recurrence_interval,
            "last_recurrence_date": last_recurrence_date
        }

    def update_expense(self, expense_id: int, updates: Dict) -> bool:
        keys = [k for k in updates.keys() if k not in ['id', 'user_id', 'created_at']]
        if not keys: return True
        
        set_clause = ", ".join([f"{k} = ?" for k in keys])
        query = f"UPDATE expenses SET {set_clause} WHERE id = ? AND user_id = ?"
        params = [updates[k] for k in keys] + [expense_id, self._user_id]
        
        cursor = self._conn.execute(query, params)
        self._conn.commit()
        return cursor.rowcount > 0

    def delete_expense(self, expense_id: int) -> bool:
        cursor = self._conn.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", (expense_id, self._user_id))
        self._conn.commit()
        return cursor.rowcount > 0

    def get_budget(self) -> Dict:
        self._conn.row_factory = sqlite3.Row
        rows = self._conn.execute("SELECT category, limit_amount FROM budget WHERE user_id = ?", (self._user_id,)).fetchall()
        return {row['category']: row['limit_amount'] for row in rows}

    def update_budget(self, new_budget: Dict):
        for category, limit in new_budget.items():
            self._conn.execute("""
                INSERT INTO budget (user_id, category, limit_amount) 
                VALUES (?, ?, ?)
                ON CONFLICT(user_id, category) DO UPDATE SET limit_amount = excluded.limit_amount
            """, (self._user_id, category, limit))
        self._conn.commit()

    def delete_budget_category(self, category: str):
        self._conn.execute("DELETE FROM budget WHERE user_id = ? AND category = ?", (self._user_id, category))
        self._conn.commit()

    def __del__(self):
        if hasattr(self, '_conn'):
            self._conn.close()
