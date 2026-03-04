# Troubleshooting Guide: Money Pro 🛠️

This guide covers common error messages you might encounter while using or developing the Money Pro application and how to resolve them.

## 1. Authentication Errors (Supabase Auth)

### 📧 Email Rate Limit Exceeded
**Message**: `Email rate limit exceeded`
- **What it means**: You have attempted to send too many authentication emails (Signup, Password Reset, etc.) to the same address or from the same IP in a short period.
- **Why it happens**: Supabase has built-in security to prevent spam. On the free tier, the limit is often **3 emails per hour**.
- **Solution**: Wait for about an hour before trying to sign up or reset your password again. If you are developing, you can disable "Confirm Email" in your Supabase Project Settings under **Authentication > Providers > Email**.

### ❌ Invalid Login Credentials
**Message**: `Invalid login credentials`
- **What it means**: The email or password provided is incorrect, or the user does not exist.
- **Solution**: Double-check your email and password. Ensure you have successfully registered first.

### ⏳ Email Not Confirmed
**Message**: `Email not confirmed`
- **What it means**: You registered, but you haven't clicked the link in the confirmation email sent to you.
- **Solution**: Check your inbox (and spam folder) for a confirmation email from Supabase. Alternatively, disable the "Confirm Email" requirement in your Supabase dashboard.

---

## 2. Database & Data Errors

### 🚫 Table Not Found (PGRST204 / PGRST205)
**Message**: `relation "profiles" does not exist` or `relation "expenses" does not exist`
- **What it means**: The required tables have not been created in your Supabase database.
- **Solution**: Go to your Supabase SQL Editor and run the contents of the [init.sql](file:///home/huyquochuynh009/Money-tracker/init.sql) file.

### 🔒 Row Level Security (RLS) Violation
**Message**: `new row violates row-level security policy`
- **What it means**: You are trying to add or modify data that you don't have permission to access.
- **Solution**: Ensure you are logged in. Check that the RLS policies in your Supabase dashboard (Authentication > Policies) allow the current user to perform the action. The [init.sql](file:///home/huyquochuynh009/Money-tracker/init.sql) includes the standard policies for this app.

---

## 3. Tunnel & Connectivity Errors

### 🔑 Tunnel Password Prompt
**Issue**: The website asks for a "Tunnel Password" or "IP Address".
- **Solution**: This is a security feature of `localtunnel`. You need to provide the **Public IP** of the server running the app.
- **How to find it**: Run `curl ifconfig.me` in the terminal to get the required IP.

### 🌐 502 Bad Gateway / Connection Refused
**What it means**: The tunnel is open, but the local Flask server is not running or crashed.
- **Solution**: Check the terminal where you ran `app.py`. If it's stopped, restart it using:
  ```bash
  fuser -k 5000/tcp || true && ./venv/bin/python3 app.py
  ```

---

## 4. Technical / API Errors

### 🚩 405 Method Not Allowed
**What it means**: A request was sent to a URL that doesn't support that specific action (e.g., trying to use `POST` on a `GET` only route).
- **Solution**: This is usually a developer error. Check the `app.py` routes and ensure the frontend `fetch` call is using the correct method.
