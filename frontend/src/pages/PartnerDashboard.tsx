import { useEffect, useState } from 'react';
import { DollarSign, RefreshCw, Users, UserPlus, UserMinus, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, DashboardStats, PartnerStatus, Invite, Expense } from '../lib/api';
import { DashboardCard } from '../components/DashboardCard';
import { ExpenseList } from '../components/ExpenseList';
import { CategoryBreakdownChart } from '../components/SpendingChart';

export function PartnerDashboard() {
  const { user } = useAuth();
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [partnerStats, setPartnerStats] = useState<DashboardStats | null>(null);
  const [invites, setInvites] = useState<{ sent: Invite[]; received: Invite[] }>({
    sent: [],
    received: [],
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    if (user) {
      loadPartnerData();
    }
  }, [user, timeframe]);

  const loadPartnerData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [status, inviteData] = await Promise.all([
        api.getPartnerStatus(user.id),
        api.getInvites(user.id),
      ]);
      setPartnerStatus(status);
      setInvites(inviteData);

      // If partner is linked, load their stats
      if (status.has_partner && status.partner) {
        // We can view partner's expenses through the include_partner flag
        // but here we show them separately, so we fetch only partner data
        // For demo purposes, we'll show comparison data
        const comparison = await api.compareWithPartner(user.id, timeframe);
        // Create a stats object from comparison data
        setPartnerStats({
          total_spent: comparison.partner.total,
          total_this_month: comparison.partner.total,
          average_daily: comparison.partner.total / 30,
          top_categories: Object.entries(comparison.partner.by_category).map(
            ([name, amount]) => ({
              name,
              color: '#8b5cf6',
              amount: amount as number,
            })
          ),
          recent_expenses: [],
          monthly_trend: [],
        });
      }
    } catch (error) {
      console.error('Failed to load partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!user || !inviteEmail.trim()) return;

    setSending(true);
    try {
      await api.invitePartner(user.id, inviteEmail.trim());
      setInviteEmail('');
      loadPartnerData();
      alert('Invite sent successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    if (!user) return;

    try {
      await api.acceptInvite(inviteId, user.id);
      loadPartnerData();
    } catch (error: any) {
      alert(error.message || 'Failed to accept invite');
    }
  };

  const declineInvite = async (inviteId: string) => {
    if (!user) return;

    try {
      await api.declineInvite(inviteId, user.id);
      loadPartnerData();
    } catch (error: any) {
      alert(error.message || 'Failed to decline invite');
    }
  };

  const unlinkPartner = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to unlink your partner? You will no longer see their expenses.')) return;

    try {
      await api.unlinkPartner(user.id);
      loadPartnerData();
    } catch (error: any) {
      alert(error.message || 'Failed to unlink partner');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // No partner linked - show invite UI
  if (!partnerStatus?.has_partner) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Partner</h1>
          <p className="text-slate-500">Link with your partner to share expenses</p>
        </div>

        {/* Invite Partner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Partner
          </h2>
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Partner's email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendInvite}
              disabled={sending || !inviteEmail.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Your partner will receive an invite and can accept it from their account.
          </p>
        </div>

        {/* Pending Invites */}
        {invites.sent.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Sent Invites
            </h2>
            <div className="space-y-3">
              {invites.sent.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{invite.invitee_email}</p>
                    <p className="text-sm text-slate-500">Pending acceptance</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Received Invites */}
        {invites.received.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Received Invites
            </h2>
            <div className="space-y-3">
              {invites.received.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {invite.profiles?.name || invite.profiles?.email || 'Unknown'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Wants to link accounts with you
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptInvite(invite.id)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => declineInvite(invite.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Partner linked - show their expenses
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Partner's Expenses</h1>
          <p className="text-slate-500">
            {partnerStatus.partner?.name || partnerStatus.partner?.email}'s spending
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
            onClick={unlinkPartner}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <UserMinus className="w-4 h-4" />
            Unlink
          </button>
        </div>
      </div>

      {/* Partner Info Card */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-purple-900">
              {partnerStatus.partner?.name || 'Partner'}
            </p>
            <p className="text-sm text-purple-700">{partnerStatus.partner?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Partner's Total"
          value={`$${partnerStats?.total_spent.toFixed(2) || '0.00'}`}
          subtitle={`In the selected ${timeframe}`}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <DashboardCard
          title="Daily Average"
          value={`$${partnerStats?.average_daily.toFixed(2) || '0.00'}`}
          subtitle="Based on selected period"
          icon={<DollarSign className="w-6 h-6" />}
        />
      </div>

      {/* Category Breakdown */}
      {partnerStats?.top_categories && partnerStats.top_categories.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Partner's Spending by Category
          </h2>
          <CategoryBreakdownChart data={partnerStats.top_categories} />
        </div>
      )}
    </div>
  );
}
