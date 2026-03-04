/**
 * moneyApi.js — Centralised API client for MoneyPro.
 * All fetch calls live here so components stay clean.
 */

const BASE = '/api';

/** Generic JSON POST helper */
async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

/** Generic JSON GET helper */
async function get(path) {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
    }
    return res.json();
}

// ── Auth ─────────────────────────────────────────────────
export const authApi = {
    /** Check current session. Throws if unauthenticated. */
    session: () => get('/auth/session'),

    /** Login with email + password */
    login: (email, password) => post('/auth/login', { email, password }),

    /** Register with email + password */
    signup: (email, password) => post('/auth/signup', { email, password }),

    /** Logout */
    logout: async () => {
        const res = await fetch(`${BASE}/auth/session`, { method: 'DELETE' });
        return res.json();
    },
};

// ── Expenses ─────────────────────────────────────────────
export const expenseApi = {
    /** Fetch all expenses, optionally filtered by month (YYYY-MM) */
    list: (month) => get(`/list${month ? `?month=${month}` : ''}`),

    /** Fetch summary totals (day, week, month, year) */
    getSummary: () => get('/summary'),

    /** Add a new expense */
    add: (amount, category, note, date) =>
        post('/add', { amount, category, note, date }),

    /** Update an existing expense */
    update: (id, amount, category, note, date) =>
        post('/expense/update', { id, amount, category, note, date }),

    /** Delete an expense by id */
    delete: (id) => get(`/expense/delete?id=${id}`),
};

// ── Budget ───────────────────────────────────────────────
export const budgetApi = {
    /** Fetch budget config { category: limit } */
    get: () => get('/budget'),

    /** Upsert budget categories */
    update: (budgetObj) => post('/budget/update', budgetObj),

    /** Delete a single budget category */
    deleteCategory: (category) => post('/budget/delete', { category }),
};
