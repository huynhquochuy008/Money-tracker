/**
 * BottomNav.jsx — Mobile-first bottom navigation bar.
 * Standard for financial and productivity apps on mobile devices.
 */
import React from 'react';

/**
 * @param {Object}   props
 * @param {string}   props.activePage    - current active page id
 * @param {Function} props.onNavigate    - called with page id when nav item clicked
 * @param {Function} props.onAdd         - called when the Floating Action Button (FAB) is clicked
 */
export default function BottomNav({ activePage, onNavigate, onAdd }) {
    const navItems = [
        { id: 'dashboard', label: 'Home', icon: '🏡' },
        { id: 'history', label: 'History', icon: '🧾' },
        { id: 'spacer', label: '', icon: '' }, // Spacer for the FAB
        { id: 'settings', label: 'Budget', icon: '📊' },
        { id: 'profile', label: 'Profile', icon: '👤' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item, index) => {
                if (item.id === 'spacer') {
                    return (
                        <div key="action-btn" className="bottom-nav-action-wrapper">
                            <button className="bottom-nav-fab" onClick={onAdd} aria-label="Add transaction">
                                <span>+</span>
                            </button>
                        </div>
                    );
                }

                const isActive = activePage === item.id;

                return (
                    <button
                        key={item.id}
                        className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <span className="bottom-nav-icon">{item.icon}</span>
                        <span className="bottom-nav-label">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
