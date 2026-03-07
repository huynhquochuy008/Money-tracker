import pytest
import os
from unittest.mock import patch
from backend.core.supabase_storage import SupabaseStorage

@pytest.fixture
def mock_client():
    with patch('backend.core.supabase_storage.create_client') as mock:
        yield mock

@pytest.fixture
def storage(mock_client):
    return SupabaseStorage("url", "key")

@pytest.mark.parametrize("env_id, expected", [
    ("user-1", "user-1"),
    ("uuid-abc", "uuid-abc"),
])
def test_get_user_id_from_env_table(storage, env_id, expected):
    storage.client.auth.get_user.side_effect = Exception("No auth")
    with patch.dict(os.environ, {"SUPABASE_USER_ID": env_id}):
        assert storage.get_user_id() == expected

@pytest.mark.parametrize("month, mock_data", [
    ("2024-03", [{"id": 1, "note": "March"}]),
    (None, [{"id": 1}, {"id": 2}]),
])
def test_get_expenses_table(storage, month, mock_data):
    storage.client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = mock_data
    # If month is provided, the mock 'like' needs to be handled if used
    if month:
        storage.client.table.return_value.select.return_value.eq.return_value.like.return_value.execute.return_value.data = mock_data

    with patch.dict(os.environ, {"SUPABASE_USER_ID": "test-user"}):
        res = storage.get_expenses(month)
        assert res == mock_data

@pytest.mark.parametrize("id_to_del, mock_res, expected", [
    (1, [{"id": 1}], True),
    (99, [], False),
])
def test_delete_expense_table(storage, id_to_del, mock_res, expected):
    storage.client.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value.data = mock_res
    with patch.dict(os.environ, {"SUPABASE_USER_ID": "test-user"}):
        assert storage.delete_expense(id_to_del) == expected

def test_add_expense_fallback(storage):
    # Setup: First call to insert should raise PGRST204 error
    # Second call (the fallback) should succeed
    mock_table = storage.client.table.return_value
    mock_table.insert.side_effect = [
        Exception("PGRST204: Could not find the 'is_recurring' column"),
        pytest.importorskip("unittest.mock").MagicMock(execute=lambda: pytest.importorskip("unittest.mock").MagicMock(data=[{"id": 1, "amount": 100}]))
    ]
    
    with patch.dict(os.environ, {"SUPABASE_USER_ID": "test-user"}):
        res = storage.add_expense(100, "Food", "Dinner", "2024-03-01", is_recurring=True, recurrence_interval="monthly")
        assert res["amount"] == 100
        # Check that insert was called twice
        assert mock_table.insert.call_count == 2
        # Check that the second call didn't include recurring fields
        args, kwargs = mock_table.insert.call_args
        assert "is_recurring" not in args[0]
        assert "recurrence_interval" not in args[0]
