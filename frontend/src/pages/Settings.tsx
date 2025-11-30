import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, User, Shield, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function Settings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (user) {
      checkGmailStatus();
    }

    // Check for Gmail callback status
    const gmailStatus = searchParams.get('gmail');
    if (gmailStatus === 'connected') {
      alert('Gmail connected successfully!');
      checkGmailStatus();
    } else if (gmailStatus === 'error') {
      alert('Failed to connect Gmail. Please try again.');
    }
  }, [user, searchParams]);

  const checkGmailStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const status = await api.getGmailStatus(user.id);
      setGmailConnected(status.connected);
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectGmail = async () => {
    if (!user) return;
    setConnecting(true);
    try {
      const { authorization_url } = await api.getGmailAuthUrl(user.id);
      window.location.href = authorization_url;
    } catch (error) {
      console.error('Failed to get Gmail auth URL:', error);
      alert('Failed to connect Gmail. Please try again.');
      setConnecting(false);
    }
  };

  const disconnectGmail = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to disconnect Gmail?')) return;

    try {
      await api.disconnectGmail(user.id);
      setGmailConnected(false);
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
      alert('Failed to disconnect Gmail. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account and integrations</p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Account
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Email</label>
            <p className="text-slate-900 font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">User ID</label>
            <p className="text-slate-900 font-mono text-sm">{user?.id}</p>
          </div>
        </div>
      </div>

      {/* Gmail Integration */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Gmail Integration
        </h2>

        {loading ? (
          <div className="animate-pulse h-20 bg-slate-100 rounded-lg" />
        ) : gmailConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Gmail Connected</p>
                <p className="text-sm text-green-700">
                  Expenses from labeled emails will be automatically imported
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-2">How it works:</h3>
              <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                <li>
                  In Gmail, create a label called <strong>"Expenses"</strong> (or
                  your configured label name)
                </li>
                <li>Apply this label to emails with receipts or transaction notifications</li>
                <li>Click "Sync Gmail" on your personal dashboard to import expenses</li>
                <li>AI will automatically extract amounts and categorize expenses</li>
              </ol>
            </div>

            <button
              onClick={disconnectGmail}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Disconnect Gmail
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Gmail Not Connected</p>
                <p className="text-sm text-blue-700">
                  Connect your Gmail to automatically import expenses from email receipts
                </p>
              </div>
            </div>

            <button
              onClick={connectGmail}
              disabled={connecting}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Mail className="w-5 h-5" />
              {connecting ? 'Connecting...' : 'Connect Gmail'}
            </button>

            <p className="text-sm text-slate-500">
              We only request read access to your emails and the ability to manage
              labels. We never modify or delete your emails.
            </p>
          </div>
        )}
      </div>

      {/* Security Note */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy & Security
        </h2>
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Your financial data is stored securely in Supabase with row-level
            security. Only you (and your linked partner) can access your expenses.
          </p>
          <p>
            Gmail access tokens are encrypted and stored securely. We only read
            emails with your specified label - we never access your full inbox.
          </p>
          <p>
            AI analysis is performed using Google Gemini. Expense data sent for
            analysis is not stored by the AI provider.
          </p>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Setup Guide
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-blue-700">1</span>
            </div>
            <div>
              <p className="font-medium text-slate-900">Connect Gmail</p>
              <p className="text-sm text-slate-600">
                Link your Google account to import expenses from receipts
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-blue-700">2</span>
            </div>
            <div>
              <p className="font-medium text-slate-900">Label Your Emails</p>
              <p className="text-sm text-slate-600">
                Create an "Expenses" label in Gmail and apply it to receipts
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-blue-700">3</span>
            </div>
            <div>
              <p className="font-medium text-slate-900">Invite Your Partner</p>
              <p className="text-sm text-slate-600">
                Go to the Partner tab and send an invite to share expenses
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-blue-700">4</span>
            </div>
            <div>
              <p className="font-medium text-slate-900">Track & Analyze</p>
              <p className="text-sm text-slate-600">
                View your combined expenses and get AI-powered insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
