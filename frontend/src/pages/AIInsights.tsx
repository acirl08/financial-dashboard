import { useEffect, useState } from 'react';
import { Brain, RefreshCw, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, AIAnalysis, PartnerStatus } from '../lib/api';

export function AIInsights() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  const [includePartner, setIncludePartner] = useState(true);

  useEffect(() => {
    if (user) {
      loadInsights();
    }
  }, [user, timeframe, includePartner]);

  const loadInsights = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [status, insights] = await Promise.all([
        api.getPartnerStatus(user.id),
        api.analyzeExpenses(user.id, timeframe, includePartner),
      ]);
      setPartnerStatus(status);
      setAnalysis(insights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Brain className="w-12 h-12 text-blue-500 animate-pulse" />
        <p className="text-slate-600">Analyzing your spending patterns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Insights</h1>
          <p className="text-slate-500">
            Smart analysis of your spending habits
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
          {partnerStatus?.has_partner && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includePartner}
                onChange={(e) => setIncludePartner(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Include partner
            </label>
          )}
          <button
            onClick={loadInsights}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Brain className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <p className="text-blue-100 leading-relaxed">
              {analysis?.summary || 'No analysis available. Add some expenses to get started!'}
            </p>
          </div>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Key Insights
          </h2>
          {analysis?.insights && analysis.insights.length > 0 ? (
            <ul className="space-y-4">
              {analysis.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-yellow-700">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-slate-600">{insight}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No insights available yet.</p>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Recommendations
          </h2>
          {analysis?.recommendations && analysis.recommendations.length > 0 ? (
            <ul className="space-y-4">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-700">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-slate-600">{rec}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No recommendations available yet.</p>
          )}
        </div>
      </div>

      {/* Spending by Category */}
      {analysis?.spending_by_category &&
        Object.keys(analysis.spending_by_category).length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Spending Breakdown
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(analysis.spending_by_category)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div
                    key={category}
                    className="p-4 bg-slate-50 rounded-lg"
                  >
                    <p className="text-sm text-slate-500">{category}</p>
                    <p className="text-xl font-bold text-slate-900">
                      ${amount.toFixed(2)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900">Pro Tips</h3>
            <ul className="mt-2 text-sm text-amber-800 space-y-1">
              <li>• Connect your Gmail to automatically import expense receipts</li>
              <li>• Categorize expenses for more accurate insights</li>
              <li>• Review weekly to catch spending patterns early</li>
              <li>• Set budget goals for each category to stay on track</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
