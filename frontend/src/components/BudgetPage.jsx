/**
 * BudgetPage.jsx — Budget configuration page.
 * Allows editing/deleting existing categories and adding new ones.
 */
import { useState } from 'react';
import { budgetApi } from '../api/moneyApi';

/**
 * @param {Object}   props
 * @param {Object}   props.budgets   - { category: limit }
 * @param {Function} props.onRefresh - called after any budget change
 */
export default function BudgetPage({ budgets, onRefresh }) {
    const [limits, setLimits] = useState(() => ({ ...budgets }));
    const [newName, setNewName] = useState('');
    const [newLimit, setNewLimit] = useState('');
    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');

    /**
     * Parse shorthand like 2m, 500k
     * @param {string|number} v
     * @returns {number}
     */
    const parseLimit = (v) => {
        const s = String(v).toLowerCase().replace(/,/g, '').replace(/\./g, '').trim();
        if (s.endsWith('k')) return Math.floor(parseFloat(s) * 1000);
        if (s.endsWith('m')) return Math.floor(parseFloat(s) * 1_000_000);
        return parseInt(s, 10) || 0;
    };

    /** Save all budget limits */
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const parsed = Object.fromEntries(
                Object.entries(limits).map(([k, v]) => [k, parseLimit(v)])
            );
            await budgetApi.update(parsed);
            onRefresh();
        } catch (err) {
            setError(err.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    /** Add a new budget category */
    const handleAddCategory = async () => {
        if (!newName.trim()) return;
        const parsed = parseLimit(newLimit);
        if (!parsed) { setError('Please enter a valid limit.'); return; }
        setAdding(true);
        setError('');
        try {
            await budgetApi.update({ [newName.trim()]: parsed });
            setNewName('');
            setNewLimit('');
            onRefresh();
        } catch (err) {
            setError(err.message || 'Failed to add category.');
        } finally {
            setAdding(false);
        }
    };

    /** Delete a budget category */
    const handleDelete = async (category) => {
        if (!confirm(`Delete category "${category}"?`)) return;
        await budgetApi.deleteCategory(category);
        onRefresh();
    };

    return (
        <div className="page-enter">
            <h1 className="section-title">Budget Settings</h1>

            {error && <div className="auth-alert" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div className="budget-grid">
                {/* Existing categories */}
                <div className="glass-card budget-list-card">
                    <form onSubmit={handleSave}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                            {Object.entries(budgets).map(([cat]) => (
                                <div key={cat} className="glass-card" style={{ padding: '1.25rem', position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(cat)}
                                        style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4, fontSize: '1rem' }}
                                        title="Delete"
                                    >
                                        🗑
                                    </button>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>{cat}</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            className="modal-input"
                                            style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}
                                            value={limits[cat] ?? budgets[cat]}
                                            onChange={(e) => setLimits((prev) => ({ ...prev, [cat]: e.target.value }))}
                                        />
                                        <span style={{ color: 'var(--text-soft)', fontWeight: 600, marginLeft: '0.5rem' }}>đ</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            id="saveBudgetBtn"
                            type="submit"
                            className="btn-premium"
                            disabled={saving}
                        >
                            {saving ? 'Saving…' : '💾 Save Budget'}
                        </button>
                    </form>
                </div>

                {/* Add new category */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>New Category</h3>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', color: 'var(--text-soft)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Category Name</label>
                        <input
                            id="newCatName"
                            type="text"
                            className="modal-input"
                            placeholder="e.g. Skincare"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', color: 'var(--text-soft)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Limit</label>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <input
                                id="newCatLimit"
                                type="text"
                                className="modal-input"
                                placeholder="e.g. 2m, 500k"
                                value={newLimit}
                                onChange={(e) => setNewLimit(e.target.value)}
                            />
                            <span style={{ color: 'var(--text-soft)', fontWeight: 600, whiteSpace: 'nowrap' }}>đ</span>
                        </div>
                    </div>
                    <button
                        className="btn-premium"
                        onClick={handleAddCategory}
                        disabled={adding}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {adding ? 'Adding…' : '+ Add Category'}
                    </button>
                </div>
            </div>
        </div>
    );
}
