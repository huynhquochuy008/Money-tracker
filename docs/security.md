# Security Overview: Money Pro 🛡️

Password security is a top priority for Money Pro. Here is how we handle user credentials and session security.

## 1. Password Hashing & Storage
We do **not** store passwords in our own database. Instead, we use **Supabase Auth** (built on GoTrue), which follows industry-standard security practices:
- **Hashing**: Passwords are never stored in plain text. Supabase uses `bcrypt` to hash passwords before storing them.
- **Salting**: A unique "salt" is added to each password before hashing to protect against rainbow table attacks.
- **No Direct Access**: The application backend (`app.py`) only receives the password to pass it to the Supabase client; it is never saved to logs or local files.

## 2. Data in Transit (Encryption)
All communication between the user's browser, the Flask backend, and Supabase is encrypted using **HTTPS / TLS**:
- **Tunnel Security**: `localtunnel` provides an `https://` endpoint, ensuring that data (including login credentials) cannot be intercepted during transmission.
- **API Security**: Communication with the Supabase API is strictly over encrypted channels.

## 3. Session Management
- **JWT (JSON Web Tokens)**: Supabase uses JWTs for secure, stateless authentication.
- **Secure Sessions**: When a user logs in, a secure session is established. The backend verifies the user's identity for every request.
- **Automatic Scoping**: All database queries are dynamically scoped to the authenticated `user_id`, preventing users from accessing each other's data.

## 4. Best Practices for Users
To keep your account secure, we recommend:
- Using a strong, unique password.
- Enabling **Multi-Factor Authentication (MFA)** if you manage your Supabase project directly.
- Always logging out when using a shared or public computer.
