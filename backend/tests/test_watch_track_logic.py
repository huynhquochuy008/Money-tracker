import unittest
import os
import shutil
import json
from core.auth_service import AuthService
from core.circle_service import CircleService
from core.sqlite_storage import SQLiteStorage
from core.services import MoneyService

class TestWatchTrackLogic(unittest.TestCase):
    def setUp(self):
        self.test_dir = "backend/data_test_logic"
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
        os.makedirs(self.test_dir)
        
        self.auth_file = os.path.join(self.test_dir, "users.json")
        self.circle_file = os.path.join(self.test_dir, "circles.json")
        self.db_file = os.path.join(self.test_dir, "money.db")
        
        self.auth = AuthService(data_file=self.auth_file)
        self.circles = CircleService(data_file=self.circle_file)
        self.storage = SQLiteStorage(db_path=self.db_file)
        self.money = MoneyService(storage=self.storage)

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_isolation_and_sharing(self):
        # 1. Setup Users
        alice = self.auth.register("alice@test.com", "p")
        bob = self.auth.register("bob@test.com", "p")
        
        # 2. Alice adds data
        self.storage.set_user_id(alice["id"])
        self.money.add_expense(100, "Food", "Dinner", "2026-03-01")
        self.money.update_budget({"Food": 500})
        
        # 3. Bob tries to see Alice's data (Isolated)
        self.storage.set_user_id(bob["id"])
        bob_expenses = self.money.get_expenses()
        self.assertEqual(len(bob_expenses), 0, "Bob should not see Alice's expenses by default")
        
        # 4. Alice invites Bob to watch (Transactions Only)
        circle = self.circles.create_circle(alice["id"], "Alice's Life")
        self.circles.invite_member(circle["id"], "bob@test.com", share_transactions=True, share_budget=False)
        self.circles.respond_to_invite(circle["id"], "bob@test.com", "accept")
        
        # 5. Check Bob's perspective
        shared = self.circles.get_shared_with_me("bob@test.com")
        permit = shared[0]
        self.assertEqual(permit["owner_id"], alice["id"])
        
        # Verify Bob can see transactions via MoneyService with explicit user_id
        alice_tx_for_bob = self.money.get_expenses(user_id=alice["id"])
        self.assertEqual(len(alice_tx_for_bob), 1)
        self.assertEqual(alice_tx_for_bob[0]["amount"], 100)
        
        # Verify Bob's own expenses are still empty
        self.assertEqual(len(self.money.get_expenses()), 0)

    def test_permission_enforcement_mock(self):
        # This test mimics the app.py endpoint logic
        alice = self.auth.register("alice@p.com", "p")
        bob = self.auth.register("bob@p.com", "p")
        
        circle = self.circles.create_circle(alice["id"], "Watch Me")
        self.circles.invite_member(circle["id"], "bob@p.com", share_transactions=False, share_budget=True)
        self.circles.respond_to_invite(circle["id"], "bob@p.com", "accept")
        
        shared = self.circles.get_shared_with_me("bob@p.com")
        permit = next((s for s in shared if s["owner_id"] == alice["id"]), None)
        
        # Mocking the endpoint logic:
        # if not permit or not permit["permissions"]["share_transactions"]: abort(403)
        self.assertFalse(permit["permissions"]["share_transactions"])
        self.assertTrue(permit["permissions"]["share_budget"])

if __name__ == "__main__":
    unittest.main()
