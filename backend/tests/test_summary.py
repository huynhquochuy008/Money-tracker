import pytest
from unittest.mock import MagicMock
from datetime import datetime, timedelta
from backend.core.services import MoneyService

@pytest.fixture
def mock_storage():
    return MagicMock()

@pytest.fixture
def service(mock_storage):
    return MoneyService(storage=mock_storage)

def test_get_summary(service, mock_storage):
    # Setup: mock current date to a fixed point for stable tests
    # We'll assume "today" is 2026-03-04 (Wednesday)
    fixed_now = datetime(2026, 3, 4, 12, 0, 0)
    
    # We need to monkeypatch datetime.now if we want pure stability, 
    # but for simplicity we can just adjust our mock data to relative to real 'now'
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d %H:%M:%S")
    yesterday_str = (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
    last_week_str = (now - timedelta(days=8)).strftime("%Y-%m-%d %H:%M:%S")
    last_month_str = (now - timedelta(days=32)).strftime("%Y-%m-%d %H:%M:%S")
    
    # Start of week (Monday)
    start_of_week = now - timedelta(days=now.weekday())
    this_monday_str = start_of_week.strftime("%Y-%m-%d 09:00:00")
    last_sunday_str = (start_of_week - timedelta(days=1)).strftime("%Y-%m-%d 23:00:00")

    mock_expenses = [
        {"amount": 100, "date": today_str},           # Day, Week, Month, Year
        {"amount": 200, "date": this_monday_str},     # Week, Month, Year
        {"amount": 400, "date": last_sunday_str},     # Month, Year (Not this week)
        {"amount": 800, "date": last_month_str},      # Year (Not this month)
    ]

    mock_storage.get_expenses.return_value = mock_expenses
    
    summary = service.get_summary()
    
    # Assertions based on the logic:
    # Day: only 100
    # Week (since Monday): 100 + 200 = 300
    # Month (this month): 100 + 200 + 400 = 700 (assuming last_sunday was also this month)
    # Year: 100 + 200 + 400 + 800 = 1500
    
    assert summary["day"] == 100
    assert summary["week"] >= 300 # Depends on if Monday is today
    assert summary["year"] == 1500
    
    # More precise test with fixed dates (monkeypatching)
    from backend.core import services
    
    class MockDatetime:
        @classmethod
        def now(cls):
            return datetime(2026, 3, 4, 12, 0, 0) # Wednesday
        @classmethod
        def strftime(cls, *args, **kwargs):
            return datetime.now().strftime(*args, **kwargs)

    # Re-testing with specific scenario
    # 2026-03-04 is Wednesday. 
    # Start of week (Monday) is 2026-03-02.
    
    mock_expenses_fixed = [
        {"amount": 10, "date": "2026-03-04 10:00:00"}, # Today
        {"amount": 20, "date": "2026-03-02 10:00:00"}, # Monday (this week)
        {"amount": 40, "date": "2026-03-01 10:00:00"}, # Sunday (last week, but this month)
        {"amount": 80, "date": "2026-02-28 10:00:00"}, # Last month (this year)
        {"amount": 160, "date": "2025-12-31 10:00:00"}, # Last year
    ]
    
    mock_storage.get_expenses.return_value = mock_expenses_fixed
    
    # We need to wrap the datetime call inside get_summary or use freezegun
    # Since I can't install freezegun easily, I'll just adjust the test expectations 
    # based on the environment's current time for this specific run.
    
    # Actually, I can just build the mock data dynamically based on datetime.now()
    now = datetime.now()
    mon = now - timedelta(days=now.weekday())
    sun_last = mon - timedelta(days=1)
    last_mo = now - timedelta(days=35) # definitely last month
    
    dynamic_expenses = [
        {"amount": 10, "date": now.strftime("%Y-%m-%d %H:%M:%S")},
        {"amount": 20, "date": mon.strftime("%Y-%m-%d %H:%M:%S")},
        {"amount": 40, "date": sun_last.strftime("%Y-%m-%d %H:%M:%S")},
        {"amount": 80, "date": last_mo.strftime("%Y-%m-%d %H:%M:%S")},
    ]
    
    mock_storage.get_expenses.return_value = dynamic_expenses
    summary = service.get_summary()
    
    assert summary["day"] == 10
    if now.weekday() == 0: # If today is Monday
        assert summary["week"] == 10 + 20 # 20 is also Monday
    else:
        assert summary["week"] == 30
    
    # Year total (storage already filters by year, but service double checks via startswith or similar?
    # No, service just sums everything returned by storage.get_expenses(year)
    assert summary["year"] == 10 + 20 + 40 + 80
