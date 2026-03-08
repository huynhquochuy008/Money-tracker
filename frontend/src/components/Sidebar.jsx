/**
 * Sidebar.jsx — Fixed navigation sidebar with page links and user info.
 */

/**
 * @param {Object}   props
 * @param {string}   props.activePage    - current active page id
 * @param {Function} props.onNavigate    - called with page id when nav item clicked
 * @param {Function} props.onLogout      - called when logout button clicked
 * @param {string}   props.userEmail     - logged-in user's email display
 * @param {boolean}  props.mobileOpen    - whether sidebar is open on mobile
 */
export default function Sidebar({ activePage, onNavigate, onLogout, userEmail, mobileOpen }) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
        { id: 'history', label: 'Transactions', icon: '☰' },
        { id: 'settings', label: 'Budget', icon: '⚙' },
        { id: 'circles', label: 'Circles', icon: '◈' },
    ];

    return (
        <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
            {/* Brand */}
            <div className="sidebar-brand">
                <span style={{ color: '#6366f1', WebkitTextFillColor: '#6366f1' }}>◈</span>
                MoneyPro
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1 }}>
                {navItems.map(({ id, label, icon }) => (
                    <button
                        key={id}
                        className={`nav-link-item${activePage === id ? ' active' : ''}`}
                        onClick={() => onNavigate(id)}
                    >
                        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                        {label}
                    </button>
                ))}
            </nav>

            <hr className="sidebar-divider" />

            {/* User info & Logout */}
            <div className="sidebar-user">
                <p style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '0.3rem' }}>Account</p>
                <p style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '1rem' }}>
                    {userEmail || 'User'}
                </p>
                <button
                    className="nav-link-item danger"
                    onClick={onLogout}
                    style={{ padding: '0.6rem 1rem', fontSize: '0.88rem', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444' }}
                >
                    <span style={{ fontSize: '1rem' }}>⏻</span>
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
