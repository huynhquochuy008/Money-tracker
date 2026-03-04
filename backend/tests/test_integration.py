import pytest
from backend.core.services import MoneyService
from backend.core.sqlite_storage import SQLiteStorage

@pytest.fixture
def integration_service():
    storage = SQLiteStorage(":memory:")
    return MoneyService(storage=storage)

def test_expense_lifecycle_integration(integration_service):
    # 1. Add expense
    added = integration_service.add_expense(100, "Food", "Lunch", "2024-03-01")
    assert added["id"] is not None
    
    # 2. List expenses
    expenses = integration_service.get_expenses("2024-03")
    assert len(expenses) == 1
    assert expenses[0]["amount"] == 100
    
    # 3. Update expense
    integration_service.update_expense(added["id"], {"amount": 150})
    updated_list = integration_service.get_expenses("2024-03")
    assert updated_list[0]["amount"] == 150
    
    # 4. Delete expense
    integration_service.delete_expense(added["id"])
    assert len(integration_service.get_expenses("2024-03")) == 0

def test_budget_lifecycle_integration(integration_service):
    # 1. Update budget
    integration_service.update_budget({"Food": 500, "Rent": 1000})
    
    # 2. Get budget
    budget = integration_service.get_budget()
    assert budget["Food"] == 500
    assert budget["Rent"] == 1000
    
    # 3. Delete category
    integration_service.delete_budget_category("Food")
    final_budget = integration_service.get_budget()
    assert "Food" not in final_budget
    assert "Rent" in final_budget
