import os
from supabase import create_client, Client
from typing import List, Dict, Any, Optional
from .models import Expense, Budget

class SupabaseStorage:
    def __init__(self, url: str, key: str):
        self.client: Client = create_client(url, key)
        self._user_id: Optional[str] = None

    def set_user_id(self, user_id: str):
        self._user_id = user_id

    def get_user_id(self) -> str:
        if self._user_id:
            return self._user_id

        # Priority 1: Check for USER_ID in environment (Legacy/Fallback)
        # This is fastest and avoids ANY initial network call in No-Auth mode
        env_user_id = os.getenv('SUPABASE_USER_ID')
        if env_user_id:
            self._user_id = env_user_id
            return env_user_id

        # Priority 2: Check for active Supabase Auth session
        try:
            res = self.client.auth.get_user()
            if res.user:
                self._user_id = res.user.id
                return res.user.id
        except:
            pass
            
        # Priority 3: Try to list users (requires admin/service-role)
        try:
            res = self.client.auth.admin.list_users()
            if res.users:
                self._user_id = res.users[0].id
                return self._user_id
        except:
            pass

        # Priority 4: Try to get a user ID from existing profiles
        try:
            res = self.client.table('profiles').select('id').limit(1).execute()
            if res.data:
                self._user_id = res.data[0]['id']
                return self._user_id
        except:
            pass

        raise RuntimeError("User ID not found and could not be discovered. Please log in or set SUPABASE_USER_ID.")

    def ensure_profile(self):
        user_id = self.get_user_id()
        try:
            # Check if profile exists
            res = self.client.table('profiles').select('id').eq('id', user_id).execute()
            if not res.data:
                # Get email from auth if possible
                email = None
                if not os.getenv('SUPABASE_USER_ID'): # Only try if not using fallback
                    try:
                        user_res = self.client.auth.admin.get_user_by_id(user_id)
                        email = user_res.user.email
                    except:
                        pass
                
                print(f"👤 Creating missing profile for {user_id}...")
                self.client.table('profiles').insert({
                    'id': user_id,
                    'email': email or 'demo@moneypro.ai',
                    'full_name': 'New User'
                }).execute()
        except Exception as e:
            print(f"⚠️ Error ensuring profile: {e}")
            # Don't re-raise if it's just a connection blip during startup
            # but for debug we print it.

    def get_expenses(self, month: Optional[str] = None) -> List[Dict]:
        user_id = self.get_user_id()
        query = self.client.table('expenses').select('*').eq('user_id', user_id)
        if month:
            query = query.like('date', f'{month}%')
        
        result = query.execute()
        return result.data

    def add_expense(self, amount: int, category: str, note: str, date: str) -> Dict:
        user_id = self.get_user_id()
        expense = Expense(
            amount=amount,
            category=category,
            note=note,
            date=date,
            user_id=user_id
        )
        result = self.client.table('expenses').insert(expense.to_dict(exclude_id=True)).execute()
        return result.data[0] if result.data else {}

    def update_expense(self, expense_id: int, updates: Dict) -> bool:
        user_id = self.get_user_id()
        data_to_update = {k: v for k, v in updates.items() if k not in ['id', 'user_id', 'created_at']}
        
        result = self.client.table('expenses').update(data_to_update).eq('id', expense_id).eq('user_id', user_id).execute()
        return len(result.data) > 0

    def delete_expense(self, expense_id: int) -> bool:
        user_id = self.get_user_id()
        result = self.client.table('expenses').delete().eq('id', expense_id).eq('user_id', user_id).execute()
        return len(result.data) > 0

    # --- BUDGET ---
    def get_budget(self) -> Dict:
        user_id = self.get_user_id()
        result = self.client.table('budget').select('*').eq('user_id', user_id).execute()
        return {item['category']: item['limit_amount'] for item in result.data}

    def update_budget(self, new_budget: Dict):
        user_id = self.get_user_id()
        if not new_budget:
            return

        # Bulk upsert to avoid multiple network calls and potential disconnects
        budget_items = []
        for category, limit in new_budget.items():
            budget = Budget(user_id=user_id, category=category, limit_amount=limit)
            budget_items.append(budget.to_dict())
            
        if budget_items:
            self.client.table('budget').upsert(budget_items).execute()

    def delete_budget_category(self, category: str):
        user_id = self.get_user_id()
        self.client.table('budget').delete().eq('user_id', user_id).eq('category', category).execute()
