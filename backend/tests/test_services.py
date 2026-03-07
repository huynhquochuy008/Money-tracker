import pytest
from unittest.mock import MagicMock
from backend.core.services import MoneyService

@pytest.fixture
def mock_storage():
    return MagicMock()

@pytest.fixture
def service(mock_storage):
    return MoneyService(storage=mock_storage)

@pytest.mark.parametrize("month, expected_data", [
    ("2024-03", [{"id": 1, "amount": 100}]),
    (None, [{"id": 1, "amount": 100}, {"id": 2, "amount": 200}]),
    ("2024-04", []),
])
def test_get_expenses_table(service, mock_storage, month, expected_data):
    mock_storage.get_expenses.return_value = expected_data
    result = service.get_expenses(month)
    assert result == expected_data
    # It's called twice now: once by process_recurring_expenses (no args) and once by get_expenses(month)
    mock_storage.get_expenses.assert_any_call(month)

@pytest.mark.parametrize("amount, category, note, date, expected_res", [
    (100, "Food", "Dinner", "2024-03-01", {"id": 1, "amount": 100}),
    (500, "Rent", "Monthly", None, {"id": 2, "amount": 500}),
])
def test_add_expense_table(service, mock_storage, amount, category, note, date, expected_res):
    mock_storage.add_expense.return_value = expected_res
    result = service.add_expense(amount, category, note, date)
    assert result == expected_res
    # We check that it was called; if date is None, service generates one
    args, kwargs = mock_storage.add_expense.call_args
    assert args[0] == amount
    assert args[1] == category
    assert args[2] == note

@pytest.mark.parametrize("expense_id, updates, storage_return, expected_bool", [
    (1, {"amount": 200}, True, True),
    (99, {"amount": 200}, False, False),
])
def test_update_expense_table(service, mock_storage, expense_id, updates, storage_return, expected_bool):
    mock_storage.update_expense.return_value = storage_return
    result = service.update_expense(expense_id, updates)
    assert result is expected_bool
    mock_storage.update_expense.assert_called_once_with(expense_id, updates)

@pytest.mark.parametrize("expense_id, storage_return, expected_bool", [
    (1, True, True),
    (99, False, False),
])
def test_delete_expense_table(service, mock_storage, expense_id, storage_return, expected_bool):
    mock_storage.delete_expense.return_value = storage_return
    result = service.delete_expense(expense_id)
    assert result is expected_bool
    mock_storage.delete_expense.assert_called_once_with(expense_id)

@pytest.mark.parametrize("budget_data", [
    ({"Food": 500, "Rent": 1000}),
    ({}),
])
def test_budget_ops_table(service, mock_storage, budget_data):
    # Test Get
    mock_storage.get_budget.return_value = budget_data
    assert service.get_budget() == budget_data
    
    # Test Update
    service.update_budget(budget_data)
    mock_storage.update_budget.assert_called_with(budget_data)

@pytest.mark.parametrize("category", ["Food", "Travel", "Utilities"])
def test_delete_budget_category_table(service, mock_storage, category):
    service.delete_budget_category(category)
    mock_storage.delete_budget_category.assert_called_once_with(category)

def test_process_recurring_expenses(service, mock_storage):
    # Setup: a recurring expense that should have triggered yesterday
    from datetime import datetime, timedelta
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    recurring_template = {
        "id": 1,
        "amount": 50,
        "category": "Coffee",
        "note": "Daily coffee",
        "date": yesterday + " 08:00:00",
        "is_recurring": True,
        "recurrence_interval": "daily",
        "last_recurrence_date": yesterday
    }
    
    mock_storage.get_expenses.return_value = [recurring_template]
    
    # Run
    service.process_recurring_expenses()
    
    # Assert
    # 1. It should have called add_expense for the new instance
    assert mock_storage.add_expense.called
    # 2. It should have updated the template's last_recurrence_date
    assert mock_storage.update_expense.called
    args, kwargs = mock_storage.update_expense.call_args
    assert args[0] == 1
    assert args[1]['last_recurrence_date'] == datetime.now().strftime("%Y-%m-%d")
