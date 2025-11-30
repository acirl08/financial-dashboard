const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
}

export const api = {
  // Expenses
  getExpenses: (userId: string, includePartner = false, startDate?: string, endDate?: string) =>
    fetchAPI<Expense[]>(
      `/expenses?user_id=${userId}&include_partner=${includePartner}${startDate ? `&start_date=${startDate}` : ''}${endDate ? `&end_date=${endDate}` : ''}`
    ),

  createExpense: (userId: string, expense: ExpenseCreate) =>
    fetchAPI<Expense>(`/expenses?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(expense),
    }),

  updateExpense: (expenseId: string, userId: string, expense: ExpenseUpdate) =>
    fetchAPI<Expense>(`/expenses/${expenseId}?user_id=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    }),

  deleteExpense: (expenseId: string, userId: string) =>
    fetchAPI<{ message: string }>(`/expenses/${expenseId}?user_id=${userId}`, {
      method: 'DELETE',
    }),

  getExpenseStats: (userId: string, includePartner = false, timeframe = 'month') =>
    fetchAPI<DashboardStats>(
      `/expenses/stats?user_id=${userId}&include_partner=${includePartner}&timeframe=${timeframe}`
    ),

  // Gmail
  getGmailAuthUrl: (userId: string) =>
    fetchAPI<{ authorization_url: string }>(`/auth/google?user_id=${userId}`),

  syncGmail: (userId: string, daysBack = 30) =>
    fetchAPI<GmailSyncResult>(`/gmail/sync?user_id=${userId}&days_back=${daysBack}`, {
      method: 'POST',
    }),

  getGmailStatus: (userId: string) =>
    fetchAPI<{ connected: boolean }>(`/gmail/status?user_id=${userId}`),

  disconnectGmail: (userId: string) =>
    fetchAPI<{ message: string }>(`/auth/google/disconnect?user_id=${userId}`, {
      method: 'POST',
    }),

  // Analysis
  analyzeExpenses: (userId: string, timeframe = 'month', includePartner = false) =>
    fetchAPI<AIAnalysis>(`/analysis?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify({ timeframe, include_partner: includePartner }),
    }),

  compareWithPartner: (userId: string, timeframe = 'month') =>
    fetchAPI<PartnerComparison>(`/analysis/comparison?user_id=${userId}&timeframe=${timeframe}`),

  // Partners
  invitePartner: (userId: string, email: string) =>
    fetchAPI<{ message: string; invite_id: string }>(`/partners/invite?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getInvites: (userId: string) =>
    fetchAPI<{ sent: Invite[]; received: Invite[] }>(`/partners/invites?user_id=${userId}`),

  acceptInvite: (inviteId: string, userId: string) =>
    fetchAPI<{ message: string }>(`/partners/invites/${inviteId}/accept?user_id=${userId}`, {
      method: 'POST',
    }),

  declineInvite: (inviteId: string, userId: string) =>
    fetchAPI<{ message: string }>(`/partners/invites/${inviteId}/decline?user_id=${userId}`, {
      method: 'POST',
    }),

  unlinkPartner: (userId: string) =>
    fetchAPI<{ message: string }>(`/partners/unlink?user_id=${userId}`, {
      method: 'DELETE',
    }),

  getPartnerStatus: (userId: string) =>
    fetchAPI<PartnerStatus>(`/partners/status?user_id=${userId}`),

  // Categories
  getCategories: (userId: string) =>
    fetchAPI<Category[]>(`/categories?user_id=${userId}`),

  createCategory: (userId: string, category: CategoryCreate) =>
    fetchAPI<Category>(`/categories?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(category),
    }),
};

// Types
export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_id: string | null;
  categories?: { name: string; color: string; icon?: string };
  merchant: string | null;
  date: string;
  source: 'gmail' | 'manual';
  email_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  amount: number;
  description: string;
  category?: string;
  date?: string;
  merchant?: string;
  source?: 'gmail' | 'manual';
}

export interface ExpenseUpdate {
  amount?: number;
  description?: string;
  category?: string;
  date?: string;
  merchant?: string;
}

export interface DashboardStats {
  total_spent: number;
  total_this_month: number;
  average_daily: number;
  top_categories: { name: string; color: string; amount: number }[];
  recent_expenses: Expense[];
  monthly_trend: { month: string; amount: number }[];
}

export interface GmailSyncResult {
  message: string;
  emails_processed: number;
  new_expenses: number;
  expenses: Expense[];
}

export interface AIAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
  spending_by_category: Record<string, number>;
  trends: { week: string; amount: number }[];
}

export interface PartnerComparison {
  user: { total: number; percentage: number; by_category: Record<string, number> };
  partner: { total: number; percentage: number; by_category: Record<string, number> };
  combined: { total: number; by_category: Record<string, number> };
}

export interface Invite {
  id: string;
  inviter_id: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  profiles?: { email: string; name: string };
}

export interface PartnerStatus {
  has_partner: boolean;
  partner: { id: string; email: string; name: string } | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  user_id: string | null;
}

export interface CategoryCreate {
  name: string;
  color?: string;
  icon?: string;
}
