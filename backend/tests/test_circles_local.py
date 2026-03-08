import unittest
import os
import json
import shutil
from core.auth_service import AuthService
from core.circle_service import CircleService

class TestCirclesLocal(unittest.TestCase):
    def setUp(self):
        # Use a temporary directory for test data
        self.test_dir = "backend/data_test"
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
        os.makedirs(self.test_dir)
        
        self.auth_file = os.path.join(self.test_dir, "users.json")
        self.circle_file = os.path.join(self.test_dir, "circles.json")
        
        self.auth = AuthService(data_file=self.auth_file)
        self.circles = CircleService(data_file=self.circle_file)

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_auth_flow(self):
        # Register
        user = self.auth.register("test@example.com", "password123")
        self.assertIsNotNone(user)
        self.assertEqual(user["email"], "test@example.com")
        
        # Login success
        login_res = self.auth.login("test@example.com", "password123")
        self.assertEqual(login_res["id"], user["id"])
        
        # Login failure
        self.assertIsNone(self.auth.login("test@example.com", "wrong"))
        self.assertIsNone(self.auth.login("other@example.com", "password123"))

    def test_circle_flow(self):
        user_a = self.auth.register("alice@example.com", "p")
        user_b = self.auth.register("bob@example.com", "p")
        
        # Create circle
        circle = self.circles.create_circle(user_a["id"], "My Family")
        self.assertEqual(circle["name"], "My Family")
        self.assertEqual(circle["owner_id"], user_a["id"])
        
        # Invite Bob
        success = self.circles.invite_member(circle["id"], "bob@example.com", share_transactions=True, share_budget=False)
        self.assertTrue(success)
        
        # Bob accepts
        self.circles.respond_to_invite(circle["id"], "bob@example.com", "accept")
        
        # Check Bob's shared view
        shared = self.circles.get_shared_with_me("bob@example.com")
        self.assertEqual(len(shared), 1)
        self.assertEqual(shared[0]["circle_name"], "My Family")
        self.assertTrue(shared[0]["permissions"]["share_transactions"])
        self.assertFalse(shared[0]["permissions"]["share_budget"])

if __name__ == "__main__":
    unittest.main()
