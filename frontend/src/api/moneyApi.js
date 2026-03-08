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
    signup: (email, password) => post('/auth/register', { email, password }),

    /** Logout */
    logout: async () => {
        const res = await fetch(`${BASE}/auth/session`, { method: 'DELETE' });
        return res.json();
    },

    /** Recover/Reset credentials by UID */
    recover: (userId, email, password) => post('/auth/recover', { user_id: userId, email, password }),

    /** Sync from Supabase to Local */
    syncFromCloud: () => post('/sync/supabase', {}),
};

// ── Circles ──────────────────────────────────────────────
export const circlesApi = {
    /** List circles I own */
    listMine: () => get('/circles/mine'),

    /** List people who shared with me */
    listShared: () => get('/circles/shared-with-me'),

    /** List pending invitations */
    listPending: () => get('/circles/pending'),

    /** Create a new circle */
    create: (name) => post('/circles/mine', { name }),

    /** Invite someone to watch you */
    invite: (circleId, email, shareTransactions, shareBudget) =>
        post('/circles/invite', {
            circle_id: circleId,
            email,
            share_transactions: shareTransactions,
            share_budget: shareBudget
        }),

    /** Respond to an invitation (accept or deny) */
    respond: (circleId, response) =>
        post('/circles/respond', { circle_id: circleId, response }),

    /** Update existing member permissions */
    updatePermissions: (circleId, email, shareTx, shareBg) =>
        post('/circles/permissions', {
            circle_id: circleId,
            email,
            share_transactions: shareTx,
            share_budget: shareBg
        }),
};

// ── Expenses ─────────────────────────────────────────────
export const expenseApi = {
    /** Fetch all expenses, optionally filtered by month (YYYY-MM) */
    list: (month) => get(`/list${month ? `?month=${month}` : ''}`),

    /** Fetch summary totals (day, week, month, year) */
    getSummary: () => get('/summary'),

    /** Add a new expense */
    add: (amount, category, note, date, is_recurring, recurrence_interval) =>
        post('/add', { amount, category, note, date, is_recurring, recurrence_interval }),

    /** Update an existing expense */
    update: (id, amount, category, note, date, is_recurring, recurrence_interval) =>
        post('/expense/update', { id, amount, category, note, date, is_recurring, recurrence_interval }),

    /** Delete an expense by id */
    delete: (id) => get(`/expense/delete?id=${id}`),
};

// ── Budget ───────────────────────────────────────────────
export const budgetApi = {
    /** Fetch budget config { category: limit } */
    get: (userId) => get(`/budget${userId ? `?user_id=${userId}` : ''}`),

    /** Upsert budget categories */
    update: (budgetObj) => post('/budget/update', budgetObj),

    /** Delete a single budget category */
    deleteCategory: (category) => post('/budget/delete', { category }),
};

// ── Watch ────────────────────────────────────────────────
export const watchApi = {
    /** Get shared summary */
    getSummary: (userId) => get(`/watch/summary?user_id=${userId}`),

    /** Get shared expenses */
    getExpenses: (userId, month) =>
        get(`/watch/expenses?user_id=${userId}${month ? `&month=${month}` : ''}`),
};
