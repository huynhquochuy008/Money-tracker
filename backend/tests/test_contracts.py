import pytest
from backend.app import app
from backend.core.models.expense import Expense
from backend.core.models.budget import Budget
from backend.core.sqlite_storage import SQLiteStorage
from backend.core.services import MoneyService
from unittest.mock import patch
import json

@pytest.fixture
def client():
    # Create a clean SQLite storage for the app to use during tests
    test_storage = SQLiteStorage(":memory:")
    test_service = MoneyService(test_storage)
    
    # Pre-populate with some data so the list isn't empty
    test_service.add_expense(100, "Food", "Test", "2024-03-01")
    test_service.update_budget({"Food": 500})

    app.config['TESTING'] = True
    # Patch the service in the app module
    with patch('backend.app.service', test_service):
        with app.test_client() as client:
            yield client

def test_list_expenses_contract(client):
    """Ensure /api/list returns data that matches the Expense model."""
    response = client.get('/api/list')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Validate each item in the list against the Expense model
    for item in data:
        # We allow extra fields or missing IDs if necessary, 
        # but here we expect the model to be strict.
        Expense(**item)

def test_get_budget_contract(client):
    """Ensure /api/budget returns data that can be validated."""
    response = client.get('/api/budget')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Budget returns a Dict[category, amount], not a Budget model directly
    # but we can validate the values are numbers
    for category, amount in data.items():
        assert isinstance(amount, (int, float))
        assert len(category) > 0
