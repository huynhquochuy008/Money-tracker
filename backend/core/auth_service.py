import json
import os
import uuid
import hashlib
from typing import Optional, Dict, List

class AuthService:
    def __init__(self, data_file: str = "backend/data/users.json"):
        self.data_file = data_file
        self.users = self._load_users()

    def _load_users(self) -> List[Dict]:
        if not os.path.exists(self.data_file):
            return []
        try:
            with open(self.data_file, 'r') as f:
                return json.load(f)
        except:
            return []

    def _save_users(self):
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        with open(self.data_file, 'w') as f:
            json.dump(self.users, f, indent=4)

    def register(self, email: str, password: str) -> Optional[Dict]:
        # Check if user already exists
        if any(u['email'] == email for u in self.users):
            raise ValueError("User already exists")
        
        user_id = str(uuid.uuid4())
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        user = {
            "id": user_id,
            "email": email,
            "password_hash": password_hash,
            "created_at": str(uuid.uuid1()) # Using as a timestamp mock
        }
        self.users.append(user)
        self._save_users()
        return {"id": user_id, "email": email}

    def login(self, email: str, password: str) -> Optional[Dict]:
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        for u in self.users:
            if u['email'] == email and u['password_hash'] == password_hash:
                return {"id": u['id'], "email": u['email']}
        return None

    def recover_by_id(self, user_id: str, new_email: str, new_password: str) -> bool:
        password_hash = hashlib.sha256(new_password.encode()).hexdigest()
        
        # 1. Update existing
        for u in self.users:
            if u['id'] == user_id:
                u['email'] = new_email
                u['password_hash'] = password_hash
                self._save_users()
                return True
        
        # 2. Allow "adopting" the ID if it's not in users.json yet
        # (This helps users moving from No-Auth/Demo mode to their first account)
        new_user = {
            "id": user_id,
            "email": new_email,
            "password_hash": password_hash,
            "created_at": str(uuid.uuid1())
        }
        self.users.append(new_user)
        self._save_users()
        return True
