import { useState } from 'react';
import {
  Home,
  PlusCircle,
  TrendingUp,
  Mail,
  Brain,
  DollarSign,
  Calendar,
  Tag,
  Trash2,
  RefreshCw,
  ChevronDown,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://financial-dashboard-w5q7.onrender.com';

// Types
interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  source: 'gmail' | 'manual';
}

interface CategoryTotal {
  name: string;
  amount: number;
  color: string;
  [key: string]: string | number;
}

// Categories with colors
const CATEGORIES = [
  { name: 'Food', color: '#f59e0b' },
  { name: 'Transport', color: '#3b82f6' },
  { name: 'Shopping', color: '#ec4899' },
  { name: 'Entertainment', color: '#8b5cf6' },
  { name: 'Bills', color: '#ef4444' },
  { name: 'Health', color: '#10b981' },
  { name: 'Other', color: '#6b7280' },
];

// Sample data
const SAMPLE_EXPENSES: Expense[] = [
  { id: '1', amount: 45.50, description: 'Grocery shopping', category: 'Food', date: '2024-11-28', source: 'manual' },
  { id: '2', amount: 12.00, description: 'Uber ride', category: 'Transport', date: '2024-11-27', source: 'gmail' },
  { id: '3', amount: 89.99, description: 'New shoes', category: 'Shopping', date: '2024-11-26', source: 'manual' },
  { id: '4', amount: 15.00, description: 'Netflix subscription', category: 'Entertainment', date: '2024-11-25', source: 'gmail' },
  { id: '5', amount: 120.00, description: 'Electric bill', category: 'Bills', date: '2024-11-24', source: 'gmail' },
];

const MONTHLY_DATA = [
  { month: 'Jun', amount: 1200 },
  { month: 'Jul', amount: 1450 },
  { month: 'Aug', amount: 980 },
  { month: 'Sep', amount: 1680 },
  { month: 'Oct', amount: 1320 },
  { month: 'Nov', amount: 890 },
];

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>(SAMPLE_EXPENSES);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'insights'>('dashboard');
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
  });
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Calculate totals
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categoryTotals: CategoryTotal[] = CATEGORIES.map(cat => ({
    name: cat.name,
    color: cat.color,
    amount: expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0),
  })).filter(c => c.amount > 0);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.description) return;

    const expense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(newExpense.amount),
      description: newExpense.description,
      category: newExpense.category,
      date: newExpense.date,
      source: 'manual',
    };
    setExpenses([expense, ...expenses]);
    setNewExpense({
      amount: '',
      description: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
    });
    showNotification('success', 'Expense added successfully!');
    setActiveTab('dashboard');
  };

  const handleDelete = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
    showNotification('success', 'Expense deleted');
  };

  const handleConnectGmail = async () => {
    try {
      // For demo purposes, we'll simulate the connection
      // In production, this would redirect to Google OAuth
      setShowGmailModal(false);
      showNotification('success', 'Gmail connected! Syncing expenses...');
      setGmailConnected(true);

      // Simulate importing some expenses from Gmail
      setTimeout(() => {
        const gmailExpenses: Expense[] = [
          { id: 'gmail-1', amount: 29.99, description: 'Spotify Premium', category: 'Entertainment', date: '2024-11-29', source: 'gmail' },
          { id: 'gmail-2', amount: 156.00, description: 'Amazon order', category: 'Shopping', date: '2024-11-28', source: 'gmail' },
        ];
        setExpenses(prev => [...gmailExpenses, ...prev]);
        showNotification('success', '2 expenses imported from Gmail!');
      }, 2000);
    } catch (error) {
      showNotification('error', 'Failed to connect Gmail');
    }
  };

  const generateAIInsight = () => {
    setLoadingAI(true);
    setTimeout(() => {
      const topCategory = categoryTotals.sort((a, b) => b.amount - a.amount)[0];
      const insights = [
        `Your highest spending category is ${topCategory?.name || 'Unknown'} at $${topCategory?.amount.toFixed(2) || 0}. Consider setting a budget limit for this category.`,
        `You've made ${expenses.length} transactions totaling $${totalSpent.toFixed(2)}. Your average transaction is $${(totalSpent / expenses.length).toFixed(2)}.`,
        `${expenses.filter(e => e.source === 'gmail').length} of your expenses were automatically imported from Gmail. Keep tagging your receipts for better tracking!`,
        `Based on your spending pattern, you could save approximately $${(totalSpent * 0.15).toFixed(2)} by reducing discretionary expenses by 15%.`,
      ];
      setAiInsight(insights[Math.floor(Math.random() * insights.length)]);
      setLoadingAI(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Gmail Modal */}
      {showGmailModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40">
          <div className="bg-[#1a1a2e] rounded-2xl p-8 max-w-md w-full mx-4 border border-[#2a2a4a]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Connect Gmail</h2>
              <button onClick={() => setShowGmailModal(false)} className="p-2 hover:bg-[#2a2a4a] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center">
                <Mail className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p className="font-medium mb-1">Auto-import expenses</p>
                <p className="text-sm text-gray-400">We'll scan your emails for receipts and bills</p>
              </div>
            </div>
            <div className="space-y-3 mb-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Automatic receipt detection</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Smart categorization</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Secure read-only access</span>
              </div>
            </div>
            <button
              onClick={handleConnectGmail}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Connect with Google
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-60 bg-[#12121c] border-r border-[#1e1e30] p-5 flex flex-col fixed h-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold">FinTrack</span>
        </div>

        <nav className="space-y-1 flex-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#1e1e30]'
            }`}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'add'
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#1e1e30]'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            Add Expense
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'insights'
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#1e1e30]'
            }`}
          >
            <Brain className="w-5 h-5" />
            AI Insights
          </button>
        </nav>

        {/* Gmail Card */}
        <div className="p-4 bg-gradient-to-br from-[#1e1e30] to-[#16162a] rounded-xl border border-[#2a2a4a]">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium">Gmail Sync</span>
            {gmailConnected && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
          </div>
          <p className="text-xs text-gray-500 mb-3">
            {gmailConnected ? 'Connected and syncing' : 'Import expenses automatically'}
          </p>
          <button
            onClick={() => !gmailConnected && setShowGmailModal(true)}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
              gmailConnected
                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {gmailConnected ? 'Connected' : 'Connect Gmail'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 p-8 min-h-screen">
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
              <p className="text-gray-500 text-sm">Track and manage your expenses</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl p-5">
                <p className="text-violet-200 text-xs font-medium mb-1">TOTAL SPENT</p>
                <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
                <p className="text-violet-300 text-xs mt-1">{expenses.length} transactions</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-5">
                <p className="text-blue-200 text-xs font-medium mb-1">THIS MONTH</p>
                <p className="text-2xl font-bold">${thisMonthTotal.toFixed(2)}</p>
                <p className="text-blue-300 text-xs mt-1">{thisMonthExpenses.length} transactions</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl p-5">
                <p className="text-emerald-200 text-xs font-medium mb-1">DAILY AVG</p>
                <p className="text-2xl font-bold">${(thisMonthTotal / 30).toFixed(2)}</p>
                <p className="text-emerald-300 text-xs mt-1">Based on this month</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              {/* Monthly Chart - Takes 3 columns */}
              <div className="col-span-3 bg-[#12121c] rounded-xl p-5 border border-[#1e1e30]">
                <h3 className="text-sm font-semibold mb-4 text-gray-300">Monthly Spending</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={MONTHLY_DATA}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} width={40} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '8px', fontSize: 12 }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`$${value}`, 'Spent']}
                    />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart - Takes 2 columns */}
              <div className="col-span-2 bg-[#12121c] rounded-xl p-5 border border-[#1e1e30]">
                <h3 className="text-sm font-semibold mb-4 text-gray-300">By Category</h3>
                <div className="flex items-center gap-4">
                  <div className="w-28 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryTotals}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={3}
                        >
                          {categoryTotals.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {categoryTotals.slice(0, 4).map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-gray-400">{cat.name}</span>
                        </div>
                        <span className="font-medium">${cat.amount.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-[#12121c] rounded-xl p-5 border border-[#1e1e30]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300">Recent Transactions</h3>
                <span className="text-xs text-gray-500">{expenses.length} total</span>
              </div>
              <div className="space-y-2">
                {expenses.slice(0, 6).map((expense) => {
                  const cat = CATEGORIES.find(c => c.name === expense.category);
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-[#0a0a12] rounded-lg hover:bg-[#16162a] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: (cat?.color || '#6b7280') + '20' }}
                        >
                          <Tag className="w-4 h-4" style={{ color: cat?.color || '#6b7280' }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{expense.description}</p>
                          <p className="text-xs text-gray-500">
                            {expense.category} • {expense.date}
                            {expense.source === 'gmail' && <span className="ml-1 text-violet-400">(Gmail)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-red-400">-${expense.amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div className="max-w-lg">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Add Expense</h1>
              <p className="text-gray-500 text-sm">Record a new transaction</p>
            </div>

            <form onSubmit={handleAddExpense} className="bg-[#12121c] rounded-xl p-6 border border-[#1e1e30]">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-[#0a0a12] border border-[#1e1e30] rounded-lg focus:outline-none focus:border-violet-500 text-lg"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Description</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a12] border border-[#1e1e30] rounded-lg focus:outline-none focus:border-violet-500"
                    placeholder="What was this expense for?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Category</label>
                  <div className="relative">
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a12] border border-[#1e1e30] rounded-lg focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-[#0a0a12] border border-[#1e1e30] rounded-lg focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition-all mt-2"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">AI Insights</h1>
              <p className="text-gray-500 text-sm">Smart analysis of your spending</p>
            </div>

            <div className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 rounded-xl p-6 border border-violet-500/20 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-violet-600/30 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Smart Analysis</h2>
                  <p className="text-sm text-gray-400">Get AI-powered spending insights</p>
                </div>
              </div>
              <button
                onClick={generateAIInsight}
                disabled={loadingAI}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {loadingAI ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Generate Insight
                  </>
                )}
              </button>
            </div>

            {aiInsight && (
              <div className="bg-[#12121c] rounded-xl p-5 border border-[#1e1e30] mb-6">
                <h3 className="text-sm font-semibold mb-2 text-violet-400">Latest Insight</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{aiInsight}</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#12121c] rounded-xl p-5 border border-[#1e1e30]">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Top Category</p>
                <p className="text-xl font-bold">
                  {categoryTotals.sort((a, b) => b.amount - a.amount)[0]?.name || 'N/A'}
                </p>
              </div>
              <div className="bg-[#12121c] rounded-xl p-5 border border-[#1e1e30]">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Avg Transaction</p>
                <p className="text-xl font-bold">${(totalSpent / expenses.length).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
