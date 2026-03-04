/**
 * HistoryPage.jsx — Transaction history table with edit and delete actions.
 */
import { expenseApi } from '../api/moneyApi';

/**
 * @param {Object}   props
 * @param {Array}    props.expenses  - filtered list of expense objects
 * @param {Function} props.onEdit    - called with expense object to open edit modal
 * @param {Function} props.onRefresh - called after a delete to reload data
 */
export default function HistoryPage({ expenses, onEdit, onRefresh }) {
    /**
     * Delete an expense after user confirmation.
     * @param {number} id
     */
    const handleDelete = async (id) => {
        if (!confirm('Delete this transaction?')) return;
        await expenseApi.delete(id);
        onRefresh();
    };

    const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

    return (
        <div className="page-enter">
            <h1 className="section-title">Transaction History</h1>

            {sorted.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#475569' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                    <p>No transactions this month.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="table-custom">
                        <tbody>
                            {sorted.map((item) => {
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
                                        </td>
                                        {/* Note */}
                                        <td>
                                            <span style={{ fontWeight: 500, color: '#cbd5e1' }}>{item.note || '—'}</span>
                                        </td>
                                        {/* Amount */}
                                        <td style={{ width: '22%', textAlign: 'right' }}>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>
                                                {(item.amount || 0).toLocaleString()}
                                                <span style={{ fontSize: '0.78rem', opacity: 0.5, marginLeft: '2px' }}>đ</span>
                                            </span>
                                        </td>
                                        {/* Actions */}
                                        <td style={{ width: '10%', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="icon-btn"
                                                    onClick={() => onEdit(item)}
                                                    title="Edit"
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    className="icon-btn danger"
                                                    onClick={() => handleDelete(item.id)}
                                                    title="Delete"
                                                >
                                                    🗑
                                                </button>
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
