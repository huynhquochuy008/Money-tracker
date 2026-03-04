/**
 * Dashboard.jsx — Overview page with stats, budget summary, and charts.
 */
import Charts from './Charts';

/**
 * @param {Object}   props
 * @param {Array}    props.expenses    - all expense objects for selected month
 * @param {Object}   props.budgets     - { category: limit }
 * @param {string}   props.month       - currently selected month (YYYY-MM)
 * @param {string[]} props.months      - list of available months for dropdown
 * @param {Function} props.onMonthChange - called with new month string
 * @param {Function} props.onAddExpense  - called to open the ExpenseModal
 */
export default function Dashboard({ expenses, budgets, month, months, onMonthChange, onAddExpense }) {
    // Aggregate stats
    let total = 0;
    const catSum = {};
    const daySum = {};

    for (const item of expenses) {
        total += item.amount || 0;
        catSum[item.category] = (catSum[item.category] || 0) + item.amount;
        const d = (item.date || '').split(' ')[0];
        daySum[d] = (daySum[d] || 0) + item.amount;
    }

    return (
        <div className="page-enter">
            {/* Page header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <p className="text-muted" style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>Good day!</p>
                    <h1 style={{ fontSize: '2rem', color: '#f1f5f9' }}>Financial Overview</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                        id="monthFilter"
                        className="month-select"
                        value={month}
                        onChange={(e) => onMonthChange(e.target.value)}
                    >
                        {months.map((m) => {
                            const [y, mm] = m.split('-');
                            return <option key={m} value={m}>Month {mm}, {y}</option>;
                        })}
                    </select>
                    <button className="btn-premium" id="addExpenseBtn" onClick={onAddExpense}>
                        ＋ Add Expense
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Left column: total + budget progress */}
                <div>
                    {/* Total spent card */}
                    <div className="glass-card stat-card primary" style={{ marginBottom: '1.5rem' }}>
                        <small style={{ opacity: 0.75, display: 'block', marginBottom: '0.5rem', fontSize: '0.82rem' }}>
                            Total Spent This Month
                        </small>
                        <h2 id="total-spent" style={{ fontSize: '2.25rem', color: '#fff', fontWeight: 700 }}>
                            {total.toLocaleString()}<span style={{ fontSize: '1rem', opacity: 0.7, marginLeft: '4px' }}>đ</span>
                        </h2>
                    </div>

                    {/* Budget progress */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h5 style={{ color: '#f1f5f9', fontSize: '1rem' }}>Budget</h5>
                        </div>
                        <div id="budget-summary">
                            {Object.keys(budgets).length === 0 ? (
                                <p className="text-muted" style={{ textAlign: 'center', padding: '1.5rem 0' }}>No budget configured.</p>
                            ) : (
                                Object.entries(budgets).map(([cat, lim]) => {
                                    const s = catSum[cat] || 0;
                                    const pct = Math.min((s / lim) * 100, 100);
                                    const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981';
                                    return (
                                        <div key={cat} style={{ marginBottom: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                                <span style={{ fontWeight: 600, color: '#cbd5e1', fontSize: '0.9rem' }}>{cat}</span>
                                                <span className="text-muted small">{Math.round(pct)}%</span>
                                            </div>
                                            <div className="premium-progress">
                                                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                                                <span className="text-muted small">Spent: {s.toLocaleString()}đ</span>
                                                <span className="text-muted small">Left: {(lim - s).toLocaleString()}đ</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column: charts */}
                <div className="glass-card" style={{ padding: '1.75rem' }}>
                    {expenses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#475569' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                            <p>No data for this month yet.</p>
                        </div>
                    ) : (
                        <Charts catSum={catSum} daySum={daySum} />
                    )}
                </div>
            </div>
        </div>
    );
}
