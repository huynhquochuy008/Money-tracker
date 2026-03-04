# Testing Documentation

This document outlines how to run the unit test suites for both the backend and frontend of the Money Tracker application, along with a description of the implemented test cases.

## 🐍 Backend Testing (Python/Pytest)

### How to Run
From the root directory of the project:
```bash
# Set PYTHONPATH so modules are discoverable
export PYTHONPATH=. 
./venv/bin/pytest backend/tests/
```

### Test Cases
The backend tests use `pytest` and `unittest.mock` with a **Table-Driven (Parametrized)** approach. This allows for testing multiple scenarios (success, failure, different inputs) cleanly within a single test function.

#### 1. Core Services (`backend/tests/test_services.py`)
- `test_get_expenses_table`: Parametrized with multiple months and expected result lists.
- `test_add_expense_table`: Validates expense creation with varying inputs (with/without dates).
- `test_update_expense_table`: Parametrized to test success and ID-not-found scenarios.
- `test_delete_expense_table`: Parametrized to verify correct deletion feedback.
- `test_budget_ops_table`: Tests budget configuration fetching and updates with different data shapes.
- `test_delete_budget_category_table`: Validates category removal across multiple specific categories.

#### 2. Supabase Storage (`backend/tests/test_supabase_storage.py`)
- `test_get_user_id_from_env_table`: Verifies fallback IDs across multiple environment configurations.
- `test_get_expenses_table`: Parametrized to ensure table queries are constructed correctly for both filtered and unfiltered requests.
- `test_delete_expense_table`: Parametrized to confirm correct filters are applied for successful and failed deletions.

#### 3. Models (`backend/tests/models/`)
- `test_expense_to_dict`: Ensures the `Expense` model (Pydantic) serializes correctly.
- `test_budget_to_dict`: Ensures the `Budget` model (Pydantic) handles data correctly.

#### 4. Contract Testing (`backend/tests/test_contracts.py`)
- **Pydantic Validation**: Ensures all API response payloads (from `app.py`) strictly match the expected data models.
- Helps detect "API Drift" early if backend changes its response structure.

#### 5. Integration Testing (`backend/tests/test_integration.py`)
- **Real Database (SQLite)**: Uses `SQLiteStorage` to run end-to-end tests through the `MoneyService` without any mocks.
- Verifies that data is actually persisted and retrieved correctly from a SQL environment.

---

## ⚛️ Frontend Testing (Vitest & MSW)

### How to Run
Navigate to the `frontend/` directory:
```bash
cd frontend
npm test
```

### Test Strategy
The frontend uses a modern testing stack focused on reliability and user behavior.

#### 1. API Mocking with MSW (`frontend/tests/mocks/`)
- **Mock Service Worker (MSW)**: Instead of manually mocking `fetch`, we use MSW to intercept network requests at the browser/node level.
- **Handlers**: `handlers.js` defines standard responses for all `/api/*` endpoints.
- **Benefits**: Tests the actual `moneyApi.js` logic and request construction against a "real" network mock.

#### 2. Component Testing (`frontend/tests/components/`)
- **React Testing Library**: Used to test UI components from a user's perspective.
- **Sidebar.test.jsx**: Verifies that navigation links are rendered, the brand is visible, and the active page is correctly highlighted.

#### 3. API Client Tests (`frontend/tests/moneyApi.test.js`)
- Verified `authApi`, `expenseApi`, and `budgetApi` using MSW handlers.

---

## 🛠 Setup Details
- **Backend**: Uses `pytest-mock` for dependency injection.
