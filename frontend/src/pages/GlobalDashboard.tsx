import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, DashboardStats, PartnerStatus } from '../lib/api';
import { DashboardCard } from '../components/DashboardCard';
import { ExpenseList } from '../components/ExpenseList';
import { MonthlyTrendChart, CategoryBreakdownChart, ComparisonChart } from '../components/SpendingChart';

export function GlobalDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [comparison, setComparison] = useState<{ user: any; partner: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user, timeframe]);

  const loadDashboard = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load partner status first
      const partner = await api.getPartnerStatus(user.id);
      setPartnerStatus(partner);

      // Load stats (include partner if linked)
      const dashboardStats = await api.getExpenseStats(
        user.id,
        partner.has_partner,
        timeframe
      );
      setStats(dashboardStats);

      // Load comparison if partner is linked
      if (partner.has_partner) {
        const comp = await api.compareWithPartner(user.id, timeframe);
        setComparison(comp);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-slate-900">
            {partnerStatus?.has_partner ? 'Global Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-slate-500">
            {partnerStatus?.has_partner
              ? `Combined expenses with ${partnerStatus.partner?.name || partnerStatus.partner?.email}`
              : 'Track and analyze your expenses'}
          </p>
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
          <button
            onClick={loadDashboard}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

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

      {/* Partner Comparison */}
      {partnerStatus?.has_partner && comparison && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Spending Comparison
          </h2>
          <ComparisonChart user={comparison.user} partner={comparison.partner} />
        </div>
      )}

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

      {/* Recent Expenses */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Expenses
        </h2>
        <ExpenseList expenses={stats?.recent_expenses || []} />
      </div>
    </div>
  );
}
