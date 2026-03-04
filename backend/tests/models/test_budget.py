from backend.core.models.budget import Budget

def test_budget_to_dict():
    budget = Budget(user_id="user123", category="Food", limit_amount=500)
    # id is assigned by database, so it won't be in the object unless we set it manually if possible
    d = budget.to_dict()
    assert d["user_id"] == "user123"
    assert d["category"] == "Food"
    assert d["limit_amount"] == 500

def test_budget_to_dict_exclude_id():
    budget = Budget(user_id="user123", category="Food", limit_amount=500)
    d = budget.to_dict()
    assert "id" not in d
    assert d["category"] == "Food"
