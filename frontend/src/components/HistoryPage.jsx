/**
 * HistoryPage.jsx — Transaction history with real-time search and filters.
 * Supports searching by note/category, filtering by category, and sorting.
 */
import { useState, useMemo } from 'react';
import { expenseApi } from '../api/moneyApi';

/**
 * @param {Object}   props
 * @param {Array}    props.expenses  - filtered list of expense objects for the month
 * @param {string}   props.month     - current selected month (YYYY-MM) for export
 * @param {Function} props.onEdit    - called with expense object to open edit modal
 * @param {Function} props.onRefresh - called after a delete to reload data
 */
export default function HistoryPage({ expenses, month, onEdit, onRefresh }) {
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [sortOrder, setSortOrder] = useState('date-desc'); // date-desc | date-asc | amount-desc | amount-asc
    const [exporting, setExporting] = useState(false);

    /** Delete an expense after user confirmation. */
    const handleDelete = async (id) => {
        if (!confirm('Delete this transaction?')) return;
        await expenseApi.delete(id);
        onRefresh();
    };

    /** Trigger a CSV download from the /api/export endpoint */
    const handleExport = async () => {
        setExporting(true);
        try {
            const params = month ? `?month=${month}` : '';
            const res = await fetch(`/api/export${params}`);
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = res.headers.get('Content-Disposition')?.split('filename=')[1] || 'export.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error:', err);
        } finally {
            setExporting(false);
        }
    };

    /** All unique categories from the data for the filter dropdown */
    const categories = useMemo(() => {
        const allCats = [...new Set(expenses.map((e) => e.category))].sort();
        return allCats;
    }, [expenses]);

    /** Apply search + category filter, then sort */
    const filtered = useMemo(() => {
        let result = expenses;

        // Text search across note and category
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (e) =>
                    (e.note || '').toLowerCase().includes(q) ||
                    (e.category || '').toLowerCase().includes(q)
            );
        }

        // Category filter
        if (filterCategory) {
            result = result.filter((e) => e.category === filterCategory);
        }

        // Sorting
        result = [...result].sort((a, b) => {
            switch (sortOrder) {
                case 'date-asc':
                    return a.date.localeCompare(b.date);
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                case 'date-desc':
                default:
                    return b.date.localeCompare(a.date);
            }
        });

        return result;
    }, [expenses, search, filterCategory, sortOrder]);

    const totalFiltered = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Transaction History</h1>
                <button
                    id="exportCsvBtn"
                    onClick={handleExport}
                    disabled={exporting}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: exporting ? '#e2e8f0' : 'var(--secondary)',
                        color: '#fff', border: 'none', borderRadius: '12px',
                        padding: '0.55rem 1.1rem', fontFamily: 'inherit',
                        fontWeight: 700, fontSize: '0.85rem', cursor: exporting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                    }}
                >
                    {exporting ? '⏳ Exporting…' : '⬇ Export CSV'}
                </button>
            </div>

            {/* ── Search & Filter Bar ─────────────────────────── */}
            <div className="search-filter-bar glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
                {/* Search input */}
                <div className="search-input-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                        id="historySearch"
                        type="text"
                        placeholder="Search notes or categories…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="search-clear" aria-label="Clear search">×</button>
                    )}
                </div>

                {/* Filters row */}
                <div className="filter-row">
                    {/* Category filter */}
                    <select
                        id="historyCategory"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Sort */}
                    <select
                        id="historySort"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="filter-select"
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="amount-desc">Highest Amount</option>
                        <option value="amount-asc">Lowest Amount</option>
                    </select>

                    {/* Results count */}
                    <span className="filter-count">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''} · {totalFiltered.toLocaleString()}đ
                    </span>
                </div>
            </div>

            {/* ── Results Table ───────────────────────────────── */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#475569' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                        {expenses.length === 0 ? '📭' : '🔎'}
                    </div>
                    <p>{expenses.length === 0 ? 'No transactions this month.' : 'No results match your search.'}</p>
                    {(search || filterCategory) && (
                        <button
                            onClick={() => { setSearch(''); setFilterCategory(''); }}
                            className="btn-premium"
                            style={{ marginTop: '1rem', fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table-custom mobile-stack">
                        <tbody>
                            {filtered.map((item) => {
                                const d = (item.date || '').split(' ')[0];
                                const formatted = d.split('-').reverse().join('/');
                                return (
                                    <tr key={item.id}>
                                        {/* Date */}
                                        <td style={{ width: '14%' }}>
                                            <span className="text-muted small">{formatted}</span>
                                        </td>
                                        {/* Category */}
                                        <td style={{ width: '18%' }}>
                                            <span className="badge-cat">{item.category}</span>
                                            {item.is_recurring && (
                                                <span title="Recurring" style={{ marginLeft: '6px', fontSize: '0.75rem' }}>🔄</span>
                                            )}
                                        </td>
                                        {/* Note */}
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--text-soft)' }}>{item.note || '—'}</span>
                                        </td>
                                        {/* Amount */}
                                        <td style={{ width: '22%', textAlign: 'right' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                {(item.amount || 0).toLocaleString()}
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '4px' }}>đ</span>
                                            </span>
                                        </td>
                                        {/* Actions */}
                                        <td style={{ width: '10%', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                <button className="icon-btn" onClick={() => onEdit(item)} title="Edit">✎</button>
                                                <button className="icon-btn danger" onClick={() => handleDelete(item.id)} title="Delete">🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
