import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Calendar, RefreshCw, Mail, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, DashboardStats, Expense } from '../lib/api';
import { DashboardCard } from '../components/DashboardCard';
import { ExpenseList } from '../components/ExpenseList';
import { MonthlyTrendChart, CategoryBreakdownChart } from '../components/SpendingChart';

export function PersonalDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    if (user) {
      loadDashboard();
      checkGmailStatus();
    }
  }, [user, timeframe]);

  const loadDashboard = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [dashboardStats, userExpenses] = await Promise.all([
        api.getExpenseStats(user.id, false, timeframe),
        api.getExpenses(user.id, false),
      ]);
      setStats(dashboardStats);
      setExpenses(userExpenses);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkGmailStatus = async () => {
    if (!user) return;
    try {
      const status = await api.getGmailStatus(user.id);
      setGmailConnected(status.connected);
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
    }
  };

  const syncGmail = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      const result = await api.syncGmail(user.id);
      alert(`Synced ${result.new_expenses} new expenses from Gmail!`);
      loadDashboard();
    } catch (error) {
      console.error('Failed to sync Gmail:', error);
      alert('Failed to sync Gmail. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await api.deleteExpense(expense.id, user.id);
      setExpenses(expenses.filter((e) => e.id !== expense.id));
      loadDashboard();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Expenses</h1>
          <p className="text-slate-500">Your personal spending tracker</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          {gmailConnected && (
            <button
              onClick={syncGmail}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Mail className={`w-4 h-4 ${syncing ? 'animate-pulse' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Gmail'}
            </button>
          )}
          <button
            onClick={loadDashboard}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Gmail Status Banner */}
      {!gmailConnected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Connect Gmail</p>
              <p className="text-sm text-blue-700">
                Automatically import expenses from your email receipts
              </p>
            </div>
          </div>
          <a
            href="/settings"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Connect
          </a>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="Total Spent"
          value={`$${stats?.total_spent.toFixed(2) || '0.00'}`}
          subtitle={`In the selected ${timeframe}`}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <DashboardCard
          title="This Month"
          value={`$${stats?.total_this_month.toFixed(2) || '0.00'}`}
          subtitle="Current month total"
          icon={<Calendar className="w-6 h-6" />}
        />
        <DashboardCard
          title="Daily Average"
          value={`$${stats?.average_daily.toFixed(2) || '0.00'}`}
          subtitle="Based on selected period"
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Monthly Trend
          </h2>
          {stats?.monthly_trend && stats.monthly_trend.length > 0 ? (
            <MonthlyTrendChart data={stats.monthly_trend} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              No data available
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Spending by Category
          </h2>
          {stats?.top_categories && stats.top_categories.length > 0 ? (
            <CategoryBreakdownChart data={stats.top_categories} />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* All Expenses */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          All Expenses ({expenses.length})
        </h2>
        <ExpenseList
          expenses={expenses}
          showActions
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
