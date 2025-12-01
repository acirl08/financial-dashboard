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
  ChevronDown
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

// Sample data
const CATEGORIES = [
  { name: 'Food', color: '#f59e0b' },
  { name: 'Transport', color: '#3b82f6' },
  { name: 'Shopping', color: '#ec4899' },
  { name: 'Entertainment', color: '#8b5cf6' },
  { name: 'Bills', color: '#ef4444' },
  { name: 'Health', color: '#10b981' },
  { name: 'Other', color: '#6b7280' },
];

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

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
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
    setActiveTab('dashboard');
  };

  const handleDelete = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const generateAIInsight = () => {
    setLoadingAI(true);
    // Simulate AI response
    setTimeout(() => {
      const insights = [
        `Based on your spending patterns, you've spent ${((categoryTotals.find(c => c.name === 'Food')?.amount || 0) / totalSpent * 100).toFixed(0)}% on Food this month. Consider meal prepping to reduce costs.`,
        `Your highest expense category is ${categoryTotals.sort((a, b) => b.amount - a.amount)[0]?.name || 'Unknown'}. Look for ways to optimize spending here.`,
        `You're averaging $${(totalSpent / expenses.length).toFixed(2)} per transaction. Setting a per-transaction budget of $50 could help control spending.`,
        `Your spending trend shows a ${MONTHLY_DATA[5].amount < MONTHLY_DATA[4].amount ? 'decrease' : 'increase'} compared to last month. ${MONTHLY_DATA[5].amount < MONTHLY_DATA[4].amount ? 'Great job!' : 'Consider reviewing your budget.'}`,
      ];
      setAiInsight(insights[Math.floor(Math.random() * insights.length)]);
      setLoadingAI(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a2e] border-r border-[#2a2a4a] p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">FinTrack</span>
        </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30'
                : 'hover:bg-[#2a2a4a] text-gray-400'
            }`}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'add'
                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30'
                : 'hover:bg-[#2a2a4a] text-gray-400'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            Add Expense
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'insights'
                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30'
                : 'hover:bg-[#2a2a4a] text-gray-400'
            }`}
          >
            <Brain className="w-5 h-5" />
            AI Insights
          </button>
        </nav>

        {/* Gmail Sync Card */}
        <div className="mt-auto p-4 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-2xl border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-purple-400" />
            <span className="font-medium">Gmail Sync</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Auto-import expenses from your emails</p>
          <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors">
            Connect Gmail
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
              <p className="text-gray-400">Track and manage your expenses</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6">
                <p className="text-blue-200 text-sm mb-1">Total Balance</p>
                <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
                <p className="text-blue-200 text-xs mt-2">All time spending</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6">
                <p className="text-purple-200 text-sm mb-1">This Month</p>
                <p className="text-3xl font-bold">${thisMonthTotal.toFixed(2)}</p>
                <p className="text-purple-200 text-xs mt-2">{thisMonthExpenses.length} transactions</p>
              </div>
              <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-6">
                <p className="text-amber-200 text-sm mb-1">Average/Day</p>
                <p className="text-3xl font-bold">${(thisMonthTotal / 30).toFixed(2)}</p>
                <p className="text-amber-200 text-xs mt-2">Based on this month</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Monthly Trend */}
              <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-[#2a2a4a]">
                <h3 className="text-lg font-semibold mb-4">Monthly Spending</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={MONTHLY_DATA}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="amount" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown */}
              <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-[#2a2a4a]">
                <h3 className="text-lg font-semibold mb-4">By Category</h3>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={150} height={150}>
                    <PieChart>
                      <Pie
                        data={categoryTotals}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {categoryTotals.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {categoryTotals.slice(0, 5).map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm text-gray-300">{cat.name}</span>
                        </div>
                        <span className="text-sm font-medium">${cat.amount.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-[#2a2a4a]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Transactions</h3>
                <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
              </div>
              <div className="space-y-3">
                {expenses.slice(0, 5).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 bg-[#0f0f1a] rounded-xl hover:bg-[#15152a] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: CATEGORIES.find(c => c.name === expense.category)?.color + '20' }}
                      >
                        <Tag
                          className="w-5 h-5"
                          style={{ color: CATEGORIES.find(c => c.name === expense.category)?.color }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-500">{expense.category} • {expense.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold">-${expense.amount.toFixed(2)}</span>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'add' && (
          <div className="max-w-xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Add Expense</h1>
            <form onSubmit={handleAddExpense} className="bg-[#1a1a2e] rounded-2xl p-8 border border-[#2a2a4a]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="number"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-[#0f0f1a] border border-[#2a2a4a] rounded-xl focus:outline-none focus:border-blue-500 text-xl"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full px-4 py-4 bg-[#0f0f1a] border border-[#2a2a4a] rounded-xl focus:outline-none focus:border-blue-500"
                    placeholder="What was this expense for?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <div className="relative">
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      className="w-full px-4 py-4 bg-[#0f0f1a] border border-[#2a2a4a] rounded-xl focus:outline-none focus:border-blue-500 appearance-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-[#0f0f1a] border border-[#2a2a4a] rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold transition-all"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">AI Insights</h1>

            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-2xl p-8 border border-purple-500/20 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-8 h-8 text-purple-400" />
                <h2 className="text-xl font-semibold">Smart Analysis</h2>
              </div>
              <p className="text-gray-300 mb-6">
                Get personalized insights about your spending patterns and recommendations to help you save money.
              </p>
              <button
                onClick={generateAIInsight}
                disabled={loadingAI}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl font-medium transition-colors"
              >
                {loadingAI ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Generate Insight
                  </>
                )}
              </button>
            </div>

            {aiInsight && (
              <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-[#2a2a4a]">
                <h3 className="text-lg font-semibold mb-3 text-blue-400">Latest Insight</h3>
                <p className="text-gray-300 leading-relaxed">{aiInsight}</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-[#2a2a4a]">
                <p className="text-gray-400 text-sm mb-1">Most spent on</p>
                <p className="text-2xl font-bold">
                  {categoryTotals.sort((a, b) => b.amount - a.amount)[0]?.name || 'N/A'}
                </p>
              </div>
              <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-[#2a2a4a]">
                <p className="text-gray-400 text-sm mb-1">Transactions</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
