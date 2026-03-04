/**
 * ExpenseModal.jsx — Add / Edit expense modal dialog.
 */
import { useState, useEffect } from 'react';
import { expenseApi } from '../api/moneyApi';

/**
 * @param {Object}   props
 * @param {boolean}  props.isOpen        - whether modal is visible
 * @param {Object}   [props.editItem]    - expense to edit, or null for add mode
 * @param {Object}   props.budgets       - { category: limit } for the category dropdown
 * @param {Function} props.onClose       - called when modal closes
 * @param {Function} props.onSaved       - called after successful save
 */
export default function ExpenseModal({ isOpen, editItem, budgets, onClose, onSaved }) {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Khác');
    const [date, setDate] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Populate form when editing
    useEffect(() => {
        if (editItem) {
            setAmount(String(editItem.amount));
            setCategory(editItem.category);
            setDate((editItem.date || '').split(' ')[0]);
            setNote(editItem.note || '');
        } else {
            setAmount('');
            setCategory(Object.keys(budgets)[0] || 'Khác');
            setDate(new Date().toISOString().split('T')[0]);
            setNote('');
        }
        setError('');
    }, [editItem, isOpen, budgets]);

    if (!isOpen) return null;

    /**
     * Parse shorthand amounts like "50k", "1.2m", "2000000"
     * @param {string} input
     * @returns {number}
     */
    const parseAmount = (input) => {
        if (!input) return 0;
        let val = input.toString().toLowerCase().replace(/,/g, '').replace(/\./g, '').trim();
        if (val.endsWith('k')) return Math.floor(parseFloat(val.slice(0, -1)) * 1000);
        if (val.endsWith('m')) return Math.floor(parseFloat(val.slice(0, -1)) * 1_000_000);
        return parseInt(val, 10) || 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const parsedAmount = parseAmount(amount);
        if (!parsedAmount) { setError('Please enter a valid amount.'); setLoading(false); return; }

        try {
            if (editItem) {
                await expenseApi.update(editItem.id, parsedAmount, category, note, date);
            } else {
                await expenseApi.add(parsedAmount, category, note, date);
            }
            onSaved();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save.');
        } finally {
            setLoading(false);
        }
    };

    const categoryOptions = [
        ...Object.keys(budgets),
        ...(budgets['Khác'] === undefined ? ['Khác'] : []),
    ];

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#f1f5f9' }}>
                        {editItem ? 'Edit Transaction' : 'Add Expense'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>

                {error && <div className="auth-alert" style={{ marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Amount */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Amount</label>
                        <input
                            id="formAmount"
                            type="text"
                            className="modal-input"
                            style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, color: '#818cf8' }}
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            autoFocus
                            required
                        />
                        <p style={{ color: '#475569', fontSize: '0.78rem', marginTop: '0.4rem' }}>Tip: 50k, 1.2m, 2000000</p>
                    </div>

                    {/* Category + Date */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Category</label>
                            <select
                                id="formCat"
                                className="modal-input modal-select"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {categoryOptions.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Date</label>
                            <input
                                id="formDate"
                                type="date"
                                className="modal-input"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Note */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Note (optional)</label>
                        <textarea
                            id="formNote"
                            className="modal-input"
                            rows={2}
                            placeholder="What did you spend on?"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            style={{ resize: 'none' }}
                        />
                    </div>

                    <button
                        id="expenseSubmitBtn"
                        type="submit"
                        className="btn-premium"
                        disabled={loading}
                        style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem' }}
                    >
                        {loading ? 'Saving…' : editItem ? 'Update' : 'Save Transaction'}
                    </button>
                </form>
            </div>
        </div>
    );
}
