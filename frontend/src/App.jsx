/**
 * App.jsx — Root application shell.
 *
 * Responsibilities:
 * - Check authentication on mount; show AuthOverlay if unauthenticated
 * - Load expenses + budgets from the API
 * - Manage page routing between Dashboard, History, Budget
 * - Pass state and callbacks down to child components
 */
import { useState, useEffect, useCallback } from 'react';
import { authApi, expenseApi, budgetApi } from './api/moneyApi';

import AuthOverlay from './components/AuthOverlay';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import HistoryPage from './components/HistoryPage';
import BudgetPage from './components/BudgetPage';
import ExpenseModal from './components/ExpenseModal';

export default function App() {
  // ── Auth state ──────────────────────────────────────────
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // ── Data state ──────────────────────────────────────────
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [months, setMonths] = useState([]);
  const [month, setMonth] = useState('');

  // ── UI state ────────────────────────────────────────────
  const [page, setPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // ── Load data from API ───────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [allExpenses, budget] = await Promise.all([
        expenseApi.list(),
        budgetApi.get(),
      ]);
      setExpenses(allExpenses);
      setBudgets(budget);

      const currentMonth = new Date().toISOString().substring(0, 7);
      const allMonths = [...new Set(allExpenses.map((e) => e.date.substring(0, 7)))];
      if (!allMonths.includes(currentMonth)) allMonths.push(currentMonth);
      const sorted = allMonths.sort().reverse();
      setMonths(sorted);
      setMonth((prev) => prev || sorted[0] || currentMonth);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, []);

  // ── Check session on mount ───────────────────────────────
  useEffect(() => {
    authApi.session()
      .then((data) => {
        setAuthenticated(true);
        setUserEmail(data.user?.email || '');
        loadData();
      })
      .catch(() => setAuthenticated(false));
  }, [loadData]);

  // ── Handlers ────────────────────────────────────────────
  const handleAuthenticated = () => {
    authApi.session().then((data) => {
      setAuthenticated(true);
      setUserEmail(data.user?.email || '');
      loadData();
    });
  };

  const handleLogout = async () => {
    await authApi.logout();
    setAuthenticated(false);
    setUserEmail('');
    setExpenses([]);
    setBudgets({});
  };

  const handleNavigate = (p) => {
    setPage(p);
    setMobileOpen(false);
  };

  const openAddModal = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setModalOpen(true);
  };

  // Filtered expenses for the selected month
  const filtered = expenses.filter((e) => (e.date || '').startsWith(month));

  // ── Render ───────────────────────────────────────────────
  if (!authenticated) {
    return <AuthOverlay onAuthenticated={handleAuthenticated} />;
  }

  return (
    <>
      <Sidebar
        activePage={page}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userEmail={userEmail}
        mobileOpen={mobileOpen}
      />

      {/* Mobile top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        display: 'none', // shown via CSS @media below
        justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.5rem',
        background: 'rgba(8,15,30,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }} className="mobile-topbar">
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9' }}>◈ MoneyPro</span>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          ☰
        </button>
      </div>

      <main className="main-content">
        {page === 'dashboard' && (
          <Dashboard
            expenses={filtered}
            budgets={budgets}
            month={month}
            months={months}
            onMonthChange={setMonth}
            onAddExpense={openAddModal}
          />
        )}
        {page === 'history' && (
          <HistoryPage
            expenses={filtered}
            onEdit={openEditModal}
            onRefresh={loadData}
          />
        )}
        {page === 'settings' && (
          <BudgetPage
            budgets={budgets}
            onRefresh={loadData}
          />
        )}
      </main>

      <ExpenseModal
        isOpen={modalOpen}
        editItem={editItem}
        budgets={budgets}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
      />
    </>
  );
}
