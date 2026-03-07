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

// import AuthOverlay from './components/AuthOverlay';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import HistoryPage from './components/HistoryPage';
import BudgetPage from './components/BudgetPage';
import ExpenseModal from './components/ExpenseModal';
import BottomNav from './components/BottomNav';

export default function App() {
  // ── Auth state ──────────────────────────────────────────
  // ── Auth state ──────────────────────────────────────────
  const [authenticated, setAuthenticated] = useState(true);
  const [userEmail, setUserEmail] = useState('demo@moneypro.ai');

  // ── Data state ──────────────────────────────────────────
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [months, setMonths] = useState([]);
  const [month, setMonth] = useState('');
  const [summary, setSummary] = useState({ day: 0, week: 0, month: 0, year: 0 });

  // ── UI state ────────────────────────────────────────────
  const [page, setPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // ── Load data from API ───────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [allExpenses, budget, summaryData] = await Promise.all([
        expenseApi.list(),
        budgetApi.get(),
        expenseApi.getSummary(),
      ]);
      setExpenses(allExpenses || []);
      setBudgets(budget || {});
      setSummary(summaryData || { day: 0, week: 0, month: 0, year: 0 });

      const currentMonth = new Date().toISOString().substring(0, 7);
      const allMonths = [...new Set((allExpenses || []).map((e) => e.date.substring(0, 7)))];
      if (!allMonths.includes(currentMonth)) allMonths.push(currentMonth);
      const sorted = allMonths.sort().reverse();
      setMonths(sorted);
      setMonth((prev) => prev || sorted[0] || currentMonth);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, []);

  // ── Load on mount (No-Auth) ──────────────────────────────
  useEffect(() => {
    loadData();
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
        display: 'none', // shown via CSS @media
        justifyContent: 'space-between', alignItems: 'center',
        padding: '0.75rem 1.25rem',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }} className="mobile-topbar">
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#6366f1' }}>◈</span> MoneyPro
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{userEmail}</span>
        </div>
      </div>

      <main className="main-content">
        {page === 'dashboard' && (
          <Dashboard
            expenses={filtered}
            budgets={budgets}
            summary={summary}
            month={month}
            months={months}
            onMonthChange={setMonth}
            onAddExpense={openAddModal}
          />
        )}
        {page === 'history' && (
          <HistoryPage
            expenses={filtered}
            month={month}
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

      <BottomNav
        activePage={page}
        onNavigate={handleNavigate}
        onAdd={openAddModal}
      />

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
