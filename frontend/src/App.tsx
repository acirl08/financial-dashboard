import { useState } from 'react';
import {
  Home,
  PlusCircle,
  TrendingUp,
  Mail,
  Brain,
  DollarSign,
  Calendar,
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

// Categories
const CATEGORIES = [
  { name: 'Food', color: '#f59e0b' },
  { name: 'Transport', color: '#3b82f6' },
  { name: 'Shopping', color: '#ec4899' },
  { name: 'Entertainment', color: '#8b5cf6' },
  { name: 'Bills', color: '#ef4444' },
  { name: 'Health', color: '#10b981' },
  { name: 'Other', color: '#6b7280' },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: '1', amount: 45.50, description: 'Grocery shopping', category: 'Food', date: '2025-11-28', source: 'manual' },
  { id: '2', amount: 12.00, description: 'Uber ride', category: 'Transport', date: '2025-11-27', source: 'gmail' },
  { id: '3', amount: 89.99, description: 'New shoes', category: 'Shopping', date: '2025-11-26', source: 'manual' },
  { id: '4', amount: 15.00, description: 'Netflix subscription', category: 'Entertainment', date: '2025-11-25', source: 'gmail' },
  { id: '5', amount: 120.00, description: 'Electric bill', category: 'Bills', date: '2025-11-24', source: 'gmail' },
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
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'insights'>('dashboard');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Calculations
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals: CategoryTotal[] = CATEGORIES.map(cat => ({
    name: cat.name,
    color: cat.color,
    amount: expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0),
  })).filter(c => c.amount > 0);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) {
      showNotification('error', 'Please fill all fields');
      return;
    }
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description,
      category,
      date,
      source: 'manual',
    };
    setExpenses([newExpense, ...expenses]);
    setAmount('');
    setDescription('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    showNotification('success', 'Expense added!');
    setActiveTab('dashboard');
  };

  const handleDelete = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
    showNotification('success', 'Deleted');
  };

  const handleConnectGmail = () => {
    setShowGmailModal(false);
    setGmailConnected(true);
    showNotification('success', 'Gmail connected!');
    setTimeout(() => {
      const newExpenses: Expense[] = [
        { id: 'g1', amount: 29.99, description: 'Spotify Premium', category: 'Entertainment', date: '2025-11-29', source: 'gmail' },
        { id: 'g2', amount: 156.00, description: 'Amazon order', category: 'Shopping', date: '2025-11-28', source: 'gmail' },
      ];
      setExpenses(prev => [...newExpenses, ...prev]);
      showNotification('success', '2 expenses imported!');
    }, 1500);
  };

  const generateAIInsight = () => {
    setLoadingAI(true);
    setTimeout(() => {
      const top = categoryTotals.sort((a, b) => b.amount - a.amount)[0];
      const insights = [
        `Top spending: ${top?.name || 'N/A'} at $${top?.amount.toFixed(2) || 0}. Consider setting a budget.`,
        `${expenses.length} transactions totaling $${totalSpent.toFixed(2)}. Average: $${(totalSpent / expenses.length).toFixed(2)}`,
        `${expenses.filter(e => e.source === 'gmail').length} expenses from Gmail. Keep tagging receipts!`,
        `Save ~$${(totalSpent * 0.15).toFixed(2)} by cutting 15% of discretionary spending.`,
      ];
      setAiInsight(insights[Math.floor(Math.random() * insights.length)]);
      setLoadingAI(false);
    }, 1200);
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex overflow-hidden">
      {/* Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-xl ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {notification.message}
          <button onClick={() => setNotification(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      {/* Gmail Modal */}
      {showGmailModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Connect Gmail</h2>
              <button onClick={() => setShowGmailModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800 rounded-xl">
              <Mail className="text-red-400" size={24} />
              <div>
                <p className="font-medium text-sm">Auto-import expenses</p>
                <p className="text-xs text-gray-400">Scan emails for receipts</p>
              </div>
            </div>
            <ul className="text-sm text-gray-300 space-y-2 mb-5">
              <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Receipt detection</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Smart categorization</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Read-only access</li>
            </ul>
            <button
              onClick={handleConnectGmail}
              className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Mail size={18} /> Connect Google
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center">
            <DollarSign size={18} />
          </div>
          <span className="font-bold">FinTrack</span>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'add', icon: PlusCircle, label: 'Add Expense' },
            { id: 'insights', icon: Brain, label: 'AI Insights' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-violet-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 bg-gray-800 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Mail size={14} className="text-violet-400" />
            <span className="text-xs font-medium">Gmail Sync</span>
            {gmailConnected && <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />}
          </div>
          <p className="text-[10px] text-gray-500 mb-2">
            {gmailConnected ? 'Connected' : 'Import automatically'}
          </p>
          <button
            onClick={() => !gmailConnected && setShowGmailModal(true)}
            disabled={gmailConnected}
            className={`w-full py-1.5 rounded-lg text-xs font-medium ${
              gmailConnected
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            {gmailConnected ? 'Connected' : 'Connect'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-xl font-bold mb-1">Dashboard</h1>
            <p className="text-gray-500 text-sm mb-5">Track your expenses</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-violet-600 rounded-xl p-4">
                <p className="text-violet-200 text-xs mb-0.5">TOTAL SPENT</p>
                <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
                <p className="text-violet-200 text-xs">{expenses.length} transactions</p>
              </div>
              <div className="bg-blue-600 rounded-xl p-4">
                <p className="text-blue-200 text-xs mb-0.5">THIS MONTH</p>
                <p className="text-2xl font-bold">${thisMonthTotal.toFixed(2)}</p>
                <p className="text-blue-200 text-xs">{thisMonthExpenses.length} transactions</p>
              </div>
              <div className="bg-emerald-600 rounded-xl p-4">
                <p className="text-emerald-200 text-xs mb-0.5">DAILY AVG</p>
                <p className="text-2xl font-bold">${(thisMonthTotal / 30).toFixed(2)}</p>
                <p className="text-emerald-200 text-xs">This month</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="col-span-2 bg-gray-900 rounded-xl p-4 border border-gray-800">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Monthly Spending</h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MONTHLY_DATA}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} width={35} />
                      <Tooltip
                        contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', fontSize: 12 }}
                        formatter={(v: number) => [`$${v}`, 'Spent']}
                      />
                      <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <h3 className="text-sm font-medium text-gray-400 mb-3">By Category</h3>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryTotals} dataKey="amount" cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={2}>
                          {categoryTotals.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-1">
                    {categoryTotals.slice(0, 4).map(cat => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-gray-400">{cat.name}</span>
                        </div>
                        <span>${cat.amount.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-400">Recent Transactions</h3>
                <span className="text-xs text-gray-500">{expenses.length} total</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {expenses.map(exp => {
                  const cat = CATEGORIES.find(c => c.name === exp.category);
                  return (
                    <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg group hover:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (cat?.color || '#666') + '25' }}>
                          <DollarSign size={14} style={{ color: cat?.color || '#666' }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{exp.description}</p>
                          <p className="text-xs text-gray-500">
                            {exp.category} • {exp.date}
                            {exp.source === 'gmail' && <span className="text-violet-400 ml-1">(Gmail)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-red-400">-${exp.amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 rounded hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Add Expense */}
        {activeTab === 'add' && (
          <div className="max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-1">Add Expense</h1>
            <p className="text-gray-500 text-sm mb-5">Record a new transaction</p>

            <form onSubmit={handleAddExpense} className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What did you spend on?"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-violet-500 appearance-none"
                  >
                    {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Date</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium">
                Add Expense
              </button>
            </form>
          </div>
        )}

        {/* AI Insights */}
        {activeTab === 'insights' && (
          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold mb-1">AI Insights</h1>
            <p className="text-gray-500 text-sm mb-5">Smart spending analysis</p>

            <div className="bg-gradient-to-br from-violet-900/50 to-purple-900/50 rounded-xl p-5 border border-violet-500/20 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-violet-600/30 rounded-lg flex items-center justify-center">
                  <Brain size={20} className="text-violet-400" />
                </div>
                <div>
                  <p className="font-medium">Smart Analysis</p>
                  <p className="text-xs text-gray-400">AI-powered insights</p>
                </div>
              </div>
              <button
                onClick={generateAIInsight}
                disabled={loadingAI}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg text-sm font-medium"
              >
                {loadingAI ? <><RefreshCw size={14} className="animate-spin" /> Analyzing...</> : <><TrendingUp size={14} /> Generate Insight</>}
              </button>
            </div>

            {aiInsight && (
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
                <p className="text-xs text-violet-400 font-medium mb-1">INSIGHT</p>
                <p className="text-sm text-gray-300">{aiInsight}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-0.5">Top Category</p>
                <p className="text-lg font-bold">{categoryTotals[0]?.name || 'N/A'}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-0.5">Avg Transaction</p>
                <p className="text-lg font-bold">${(totalSpent / expenses.length || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
