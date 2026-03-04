from backend.core.models.expense import Expense

def test_expense_to_dict():
    expense = Expense(amount=100, category="Food", note="Dinner", date="2024-03-01", user_id="user123", id=1)
    d = expense.to_dict()
    assert d["amount"] == 100
    assert d["category"] == "Food"
    assert d["note"] == "Dinner"
    assert d["date"] == "2024-03-01"
    assert d["user_id"] == "user123"
    assert d["id"] == 1

def test_expense_to_dict_exclude_id():
    expense = Expense(amount=100, category="Food", note="Dinner", date="2024-03-01", user_id="user123", id=1)
    d = expense.to_dict(exclude_id=True)
    assert "id" not in d
    assert d["amount"] == 100
