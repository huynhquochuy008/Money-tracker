# API Reference

This document provides a detailed overview of the MoneyPro REST API endpoints.

## Base URL
All requests are made to:
`http://localhost:5001/api`

---

## 🔐 Authentication
Note: The application currently operates in **No-Auth** mode. The following endpoints return mock data or perform session-less operations.

### GET /auth/session
Check the current session status.
- **Returns**: `200 OK`
- **Body**:
  ```json
  {
    "status": "authenticated",
    "user": {
      "id": "...",
      "email": "demo@moneypro.ai"
    }
  }
  ```

### DELETE /auth/session
Logout the current user (Mock).
- **Returns**: `200 OK`
- **Body**:
  ```json
  {
    "status": "success",
    "message": "Logged out (mock)"
  }
  ```

---

## 💸 Expenses

### GET /list
List all expenses for the current user.
- **Query Params**:
  - `month` (Optional): Filter by month in `YYYY-MM` format.
- **Returns**: `200 OK`
- **Body**: Array of expense objects.
  ```json
  [
    {
      "id": 1,
      "amount": 50000,
      "category": "Food",
      "date": "2024-03-01 12:00:00",
      "note": "Lunch"
    }
  ]
  ```

### POST /add
Create a new expense.
- **Body**:
  ```json
  {
    "amount": 50000,
    "category": "Food",
    "note": "Lunch",
    "date": "2024-03-01 12:00:00"
  }
  ```
- **Returns**: `200 OK`
- **Body**: `{ "status": "success", "data": { ... } }`

### POST /expense/update
Update an existing expense.
- **Body**: Must include `id` and any fields to update.
  ```json
  {
    "id": 1,
    "amount": 60000
  }
  ```
- **Returns**: `200 OK` on success, `404 Not Found` if the ID is invalid.

### GET /expense/delete
Delete an expense by ID.
- **Query Params**:
  - `id` (Required): The ID of the expense to delete.
- **Returns**: `200 OK` on success, `404 Not Found` if the ID is invalid.

---

## 📊 Budget

### GET /budget
Get the current budget configuration.
- **Returns**: `200 OK`
- **Body**: Category-to-limit mapping.
  ```json
  {
    "Food": 2000000,
    "Rent": 5000000
  }
  ```

### POST /budget/update
Upsert budget limits for one or more categories.
- **Body**:
  ```json
  {
    "Food": 2500000,
    "Transport": 500000
  }
  ```
- **Returns**: `200 OK`

### POST /budget/delete
Delete a budget category.
- **Body**:
  ```json
  {
    "category": "Food"
  }
  ```
- **Returns**: `200 OK` on success, `400 Bad Request` if category is missing.
