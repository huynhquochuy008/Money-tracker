/**
 * Dashboard.jsx — Overview page with stats, budget summary, and charts.
 */
import Charts from './Charts';

/**
 * @param {Object}   props
 * @param {Array}    props.expenses    - all expense objects for selected month
 * @param {Object}   props.budgets     - { category: limit }
 * @param {Object}   props.summary     - { day, week, month, year }
 * @param {string}   props.month       - currently selected month (YYYY-MM)
 * @param {string[]} props.months      - list of available months for dropdown
 * @param {Function} props.onMonthChange - called with new month string
 * @param {Function} props.onAddExpense  - called to open the ExpenseModal
 */
export default function Dashboard({ expenses, budgets, summary, month, months, onMonthChange, onAddExpense }) {
    // Aggregate stats
    const catSum = {};
    const daySum = {};
    const todayStr = new Date().toISOString().split('T')[0];
    const todayExpenses = expenses.filter(e => (e.date || '').startsWith(todayStr));

    for (const item of expenses) {
        catSum[item.category] = (catSum[item.category] || 0) + item.amount;
        const d = (item.date || '').split(' ')[0];
        daySum[d] = (daySum[d] || 0) + item.amount;
    }

    return (
        <div className="page-enter">
            {/* Page header */}
            <div className="dashboard-header">
                <div>
                    <p className="text-muted small-hint">Good day!</p>
                    <h1 className="dashboard-title">Financial Overview</h1>
                </div>
                <div className="dashboard-actions">
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

            {/* Summary Cards Section (TODO #13-14) */}
            <div className="summary-grid">
                <div className="glass-card summary-card">
                    <span className="summary-label">Today</span>
                    <h3 className="summary-value">{(summary?.day || 0).toLocaleString()}<span>đ</span></h3>
                </div>
                <div className="glass-card summary-card">
                    <span className="summary-label">This Week</span>
                    <h3 className="summary-value">{(summary?.week || 0).toLocaleString()}<span>đ</span></h3>
                </div>
                <div className="glass-card summary-card">
                    <span className="summary-label">This Month</span>
                    <h3 className="summary-value">{(summary?.month || 0).toLocaleString()}<span>đ</span></h3>
                </div>
                <div className="glass-card summary-card">
                    <span className="summary-label">This Year</span>
                    <h3 className="summary-value">{(summary?.year || 0).toLocaleString()}<span>đ</span></h3>
                </div>
            </div>

            <div className="dashboard-main-grid">
                <div className="dashboard-left-content">
                    {/* Today's Spending Table (Scrollable - TODO #14) */}
                    <div className="glass-card daily-spending-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h5 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600 }}>Today's Spending</h5>
                            <span className="text-muted small">{todayExpenses.length} items</span>
                        </div>
                        <div className="scroll-container">
                            {todayExpenses.length === 0 ? (
                                <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>No spending today yet.</p>
                            ) : (
                                <table className="table-custom">
                                    <tbody>
                                        {todayExpenses.map((exp) => (
                                            <tr key={exp.id}>
                                                <td style={{ width: '40%' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{exp.category}</div>
                                                    <div className="text-muted small">{exp.note || 'No note'}</div>
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                                                    {exp.amount.toLocaleString()}đ
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column: Budget tracking */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h5 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600 }}>Budget Tracking</h5>
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-soft)', fontSize: '0.95rem' }}>{cat}</span>
                                            <span className="text-muted small" style={{ fontWeight: 600 }}>{Math.round(pct)}%</span>
                                        </div>
                                        <div className="premium-progress">
                                            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                                            <span className="text-muted small" style={{ fontWeight: 600 }}>Spent: {s.toLocaleString()}đ</span>
                                            <span className="text-muted small" style={{ fontWeight: 600 }}>Left: {(lim - s).toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Charts at Bottom (TODO #14) */}
            <div className="glass-card charts-bottom" style={{ padding: '1.75rem' }}>
                <h5 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Analytics</h5>
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
    );
}
