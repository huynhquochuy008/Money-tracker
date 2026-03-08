import json
import os
import uuid
from typing import Optional, Dict, List

class CircleService:
    def __init__(self, data_file: str = "backend/data/circles.json"):
        self.data_file = data_file
        self.circles = self._load_circles()

    def _load_circles(self) -> List[Dict]:
        if not os.path.exists(self.data_file):
            return []
        try:
            with open(self.data_file, 'r') as f:
                return json.load(f)
        except:
            return []

    def _save_circles(self):
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        with open(self.data_file, 'w') as f:
            json.dump(self.circles, f, indent=4)

    def create_circle(self, owner_id: str, name: str) -> Dict:
        circle_id = str(uuid.uuid4())
        circle = {
            "id": circle_id,
            "owner_id": owner_id,
            "name": name,
            "members": []
        }
        self.circles.append(circle)
        self._save_circles()
        return circle

    def invite_member(self, circle_id: str, member_email: str, share_transactions: bool = True, share_budget: bool = True) -> bool:
        # Note: In a real system, we'd lookup user_id by email. 
        # For now, we'll store the email and resolve it during view time.
        for c in self.circles:
            if c['id'] == circle_id:
                # Prevent self-invitation
                if c['owner_id'] == member_email:
                    print(f"⚠️ Self-invitation attempt: {member_email}")
                    return False

                # Check if already invited or a member
                if any(m['email'] == member_email for m in c['members']):
                    return False
                
                c['members'].append({
                    "email": member_email,
                    "status": "pending",  # New: Pending acceptance
                    "permissions": {
                        "share_transactions": share_transactions,
                        "share_budget": share_budget
                    }
                })
                self._save_circles()
                return True
        return False

    def respond_to_invite(self, circle_id: str, user_email: str, response: str) -> bool:
        """Accept or deny a pending invitation."""
        for c in self.circles:
            if c['id'] == circle_id:
                for i, m in enumerate(c['members']):
                    if m['email'] == user_email and m['status'] == "pending":
                        if response.lower() == "accept":
                            m['status'] = "accepted"
                        else:
                            # If denied, remove from member list
                            c['members'].pop(i)
                        
                        self._save_circles()
                        return True
        return False

    def get_pending_invites(self, user_email: str) -> List[Dict]:
        """Circles where the user has a pending invitation."""
        pending = []
        for c in self.circles:
            for m in c['members']:
                # If status is missing, we assume 'accepted' for legacy data
                if m.get('status') == "pending" and m['email'] == user_email:
                    pending.append({
                        "id": c['id'],
                        "name": c['name'],
                        "owner_id": c['owner_id']
                    })
        return pending

    def get_user_circles(self, user_id: str) -> List[Dict]:
        """Circles owned by the user."""
        return [c for c in self.circles if c['owner_id'] == user_id]

    def get_shared_with_me(self, user_email: str) -> List[Dict]:
        """Circles where the user is an accepted member (watcher)."""
        shared = []
        for c in self.circles:
            for m in c['members']:
                # Legacy members default to 'accepted'
                status = m.get('status', 'accepted')
                if m['email'] == user_email and status == "accepted":
                    shared.append({
                        "circle_id": c['id'],
                        "owner_id": c['owner_id'],
                        "circle_name": c['name'],
                        "permissions": m['permissions']
                    })
        return shared

    def update_permissions(self, circle_id: str, member_email: str, share_transactions: bool, share_budget: bool) -> bool:
        for c in self.circles:
            if c['id'] == circle_id:
                for m in c['members']:
                    if m['email'] == member_email:
                        m['permissions']['share_transactions'] = share_transactions
                        m['permissions']['share_budget'] = share_budget
                        self._save_circles()
                        return True
        return False
