import os
from supabase import create_client, Client
from typing import List, Dict, Any
from .sqlite_storage import SQLiteStorage

class SyncService:
    def __init__(self, supabase_url: str, supabase_key: str, sqlite_storage: SQLiteStorage):
        self.client: Client = create_client(supabase_url, supabase_key)
        self.sqlite_storage = sqlite_storage

    def sync_from_supabase(self, user_id: str) -> bool:
        """
        Sync all expenses and budgets from Supabase to the local SQLite database for a specific user.
        """
        try:
            print(f"🔄 Syncing data from Supabase for user: {user_id}")
            
            # 1. Fetch Expenses
            exp_res = self.client.table('expenses').select('*').eq('user_id', user_id).execute()
            expenses = exp_res.data
            
            # 2. Fetch Budget
            bud_res = self.client.table('budget').select('*').eq('user_id', user_id).execute()
            budgets = bud_res.data
            
            # 3. Clear existing local data for this user to avoid duplicates
            # Note: SQLiteStorage doesn't have a clear method, but we can do it via SQL
            self.sqlite_storage._conn.execute("DELETE FROM expenses WHERE user_id = ?", (user_id,))
            self.sqlite_storage._conn.execute("DELETE FROM budget WHERE user_id = ?", (user_id,))
            
            # 4. Insert Expenses
            for exp in expenses:
                query = """
                    INSERT INTO expenses (id, user_id, amount, category, note, date, is_recurring, recurrence_interval, last_recurrence_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                self.sqlite_storage._conn.execute(query, (
                    exp.get('id'),
                    exp.get('user_id'),
                    exp.get('amount'),
                    exp.get('category'),
                    exp.get('note'),
                    exp.get('date'),
                    1 if exp.get('is_recurring') else 0,
                    exp.get('recurrence_interval'),
                    exp.get('last_recurrence_date')
                ))
            
            # 5. Insert Budgets
            for bud in budgets:
                query = """
                    INSERT INTO budget (user_id, category, limit_amount)
                    VALUES (?, ?, ?)
                """
                self.sqlite_storage._conn.execute(query, (
                    bud.get('user_id'),
                    bud.get('category'),
                    bud.get('limit_amount')
                ))
            
            self.sqlite_storage._conn.commit()
            print(f"✅ Sync complete! Imported {len(expenses)} expenses and {len(budgets)} budget categories.")
            return True
        except Exception as e:
            print(f"❌ Sync failed: {e}")
            return False
