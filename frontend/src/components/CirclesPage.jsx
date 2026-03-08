import { useState, useEffect } from 'react';
import { circlesApi, watchApi } from '../api/moneyApi';

export default function CirclesPage() {
    const [myCircles, setMyCircles] = useState([]);
    const [sharedWithMe, setSharedWithMe] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [newCircleName, setNewCircleName] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(null); // circleId
    const [inviteEmail, setInviteEmail] = useState('');
    const [shareTx, setShareTx] = useState(true);
    const [shareBg, setShareBg] = useState(true);
    const [watchingUser, setWatchingUser] = useState(null); // { id, name, permissions }
    const [watchData, setWatchData] = useState(null);

    const loadCircles = async () => {
        setLoading(true);
        try {
            const [mine, shared, pending] = await Promise.all([
                circlesApi.listMine(),
                circlesApi.listShared(),
                circlesApi.listPending()
            ]);
            setMyCircles(mine || []);
            setSharedWithMe(shared || []);
            setPendingInvites(pending || []);
        } catch (err) {
            console.error('Failed to load circles:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCircles();
    }, []);

    const handleCreateCircle = async (e) => {
        e.preventDefault();
        if (!newCircleName) return;
        try {
            await circlesApi.create(newCircleName);
            setNewCircleName('');
            loadCircles();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            await circlesApi.invite(showInviteModal, inviteEmail, shareTx, shareBg);
            setInviteEmail('');
            setShowInviteModal(null);
            loadCircles();
            alert('Invitation sent! User needs to accept it.');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRespond = async (circleId, response) => {
        try {
            await circlesApi.respond(circleId, response);
            loadCircles();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await authApi.syncFromCloud();
            alert('Data synced from cloud successfully!');
            // After sync, we should probably redirect to dashboard or refresh
        } catch (err) {
            alert('Sync failed: ' + err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleWatch = async (sharedCircle) => {
        setLoading(true);
        try {
            const [summary, expenses] = await Promise.all([
                sharedCircle.permissions.share_budget ? watchApi.getSummary(sharedCircle.owner_id) : null,
                sharedCircle.permissions.share_transactions ? watchApi.getExpenses(sharedCircle.owner_id) : []
            ]);
            setWatchData({ summary, expenses });
            setWatchingUser({
                id: sharedCircle.owner_id,
                name: sharedCircle.circle_name,
                permissions: sharedCircle.permissions
            });
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (watchingUser) {
        return (
            <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button className="icon-btn" onClick={() => setWatchingUser(null)}>
                        <span style={{ fontSize: '1.2rem' }}>←</span>
                    </button>
                    <h1 className="section-title" style={{ margin: 0 }}>Watching: {watchingUser.name}</h1>
                </div>

                {watchingUser.permissions.share_budget && watchData?.summary && (
                    <div className="summary-grid" style={{ marginBottom: '2rem' }}>
                        <div className="summary-card glass-card stat-card primary">
                            <div className="summary-label">Month Total</div>
                            <div className="summary-value">${watchData.summary.month.toLocaleString()} <span>VND</span></div>
                        </div>
                        <div className="summary-card glass-card">
                            <div className="summary-label">Today</div>
                            <div className="summary-value">${watchData.summary.day.toLocaleString()} <span>VND</span></div>
                        </div>
                    </div>
                )}

                {watchingUser.permissions.share_transactions && (
                    <div className="glass-card">
                        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>Shared Transactions</h2>
                        </div>
                        <div className="scroll-container">
                            <table className="table-custom mobile-stack">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Amount</th>
                                        <th>Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {watchData?.expenses?.map(exp => (
                                        <tr key={exp.id}>
                                            <td className="text-muted">{exp.date.split(' ')[0]}</td>
                                            <td><span className="badge-cat">{exp.category}</span></td>
                                            <td className="fw-bold text-danger">-${exp.amount.toLocaleString()}</td>
                                            <td className="text-muted small italic">{exp.note || '—'}</td>
                                        </tr>
                                    ))}
                                    {(!watchData?.expenses || watchData.expenses.length === 0) && (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>No transactions shared.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>MoneyPro Circles</h1>
                <button
                    className="btn-premium"
                    onClick={handleSync}
                    disabled={syncing}
                    style={{ background: syncing ? 'var(--gray-400)' : 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' }}
                >
                    {syncing ? 'Syncing...' : '☁️ Sync from Cloud'}
                </button>
            </div>

            {pendingInvites.length > 0 && (
                <div className="glass-card animate-fade-in" style={{ marginBottom: '2rem', border: '2px solid #6366f1', background: 'rgba(99, 102, 241, 0.05)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📩</span> Pending Invitations
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {pendingInvites.map(inv => (
                            <div key={inv.id} className="glass-card" style={{ padding: '1rem', border: '1px solid var(--gray-200)', background: '#fff' }}>
                                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{inv.name}</div>
                                <div className="text-muted small mb-3">from {inv.owner_id}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-premium small" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleRespond(inv.id, 'accept')}>Accept</button>
                                    <button className="btn-premium small" style={{ flex: 1, background: 'var(--gray-700)', justifyContent: 'center' }} onClick={() => handleRespond(inv.id, 'deny')}>Deny</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="dashboard-main-grid">
                {/* My Circles */}
                <section>
                    <div className="glass-card">
                        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>My Circles</h2>
                            <p className="text-muted small">Manage people who can watch your spending</p>
                        </div>

                        <form onSubmit={handleCreateCircle} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                            <input
                                className="modal-input"
                                style={{ flex: 1 }}
                                placeholder="Circle Name (e.g. Family)"
                                value={newCircleName}
                                onChange={e => setNewCircleName(e.target.value)}
                            />
                            <button type="submit" className="btn-premium">Create</button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {myCircles.map(c => (
                                <div key={c.id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--gray-200)', background: 'var(--bg-main)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{c.name}</span>
                                        <button className="btn-premium small" onClick={() => setShowInviteModal(c.id)}>+ Invite</button>
                                    </div>
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            {c.members.map(m => (
                                                <span
                                                    key={m.email}
                                                    className="badge-cat"
                                                    style={{
                                                        background: '#fff',
                                                        border: '1px solid var(--gray-200)',
                                                        opacity: m.status === 'pending' ? 0.6 : 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                    title={`Budget: ${m.permissions.share_budget}, Tx: ${m.permissions.share_transactions}`}
                                                >
                                                    {m.email}
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        textTransform: 'uppercase',
                                                        fontWeight: 800,
                                                        color: m.status === 'accepted' ? '#16a34a' : '#ea580c'
                                                    }}>
                                                        • {m.status}
                                                    </span>
                                                </span>
                                            ))}
                                            {c.members.length === 0 && <span className="text-muted small">No members yet. Invite someone!</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {myCircles.length === 0 && <p className="text-muted text-center py-4">You haven't created any circles yet.</p>}
                        </div>
                    </div>
                </section>

                {/* Shared with Me */}
                <section>
                    <div className="glass-card">
                        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>Watching Others</h2>
                            <p className="text-muted small">People who shared their data with you</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {sharedWithMe.map(s => (
                                <div key={s.circle_id} className="glass-card stat-card primary" style={{ cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => handleWatch(s)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.circle_name}</span>
                                        <span className="text-primary small fw-bold">View Data →</span>
                                    </div>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <span className="text-muted small">
                                            Sharing: {[
                                                s.permissions.share_transactions && 'Transactions',
                                                s.permissions.share_budget && 'Budget'
                                            ].filter(Boolean).join(' & ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {sharedWithMe.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔭</div>
                                    <p className="text-muted">No one has shared their data with you yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* Invite Modal Overlay */}
            {showInviteModal && (
                <div className="modal-backdrop" onClick={() => setShowInviteModal(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h2 style={{ marginBottom: '0.5rem' }}>Invite Member</h2>
                        <p className="text-muted small" style={{ marginBottom: '2rem' }}>
                            Invite someone to watch {myCircles.find(c => c.id === showInviteModal)?.name}
                        </p>

                        <form onSubmit={handleInvite}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="small-hint text-muted">Member Email</label>
                                <input
                                    className="modal-input"
                                    type="email"
                                    required
                                    placeholder="friend@example.com"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        style={{ width: '18px', height: '18px' }}
                                        checked={shareTx}
                                        onChange={e => setShareTx(e.target.checked)}
                                    />
                                    <span style={{ fontWeight: 500 }}>Share Transactions</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        style={{ width: '18px', height: '18px' }}
                                        checked={shareBg}
                                        onChange={e => setShareBg(e.target.checked)}
                                    />
                                    <span style={{ fontWeight: 500 }}>Share Budget</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn-premium" style={{ flex: 1, justifyContent: 'center' }}>Send Invite</button>
                                <button type="button" className="btn-premium" style={{ flex: 1, background: 'var(--gray-700)', justifyContent: 'center' }} onClick={() => setShowInviteModal(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
