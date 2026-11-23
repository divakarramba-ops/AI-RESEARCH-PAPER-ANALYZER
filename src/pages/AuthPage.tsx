import { ArrowRight, KeyRound, Lock, Mail, ShieldQuestion, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  loginUser,
  lookupSecurityQuestion,
  registerUser,
  resetPasswordWithSecurityAnswer,
} from '../api.ts';
import type { AuthUser, PageRoute } from '../types.ts';

interface AuthPageProps {
  onAuthSuccess: (user: AuthUser) => void;
  onNavigate: (page: PageRoute) => void;
}

type AuthTab = 'login' | 'register' | 'forgot';

const SECURITY_QUESTIONS = [
  'What was the name of your first university or high school?',
  'What is the title of your favorite textbook or paper?',
  'What city were you born in?',
  'What was your childhood nickname?',
];

export function AuthPage({ onAuthSuccess, onNavigate }: AuthPageProps) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regQuestion, setRegQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [regAnswer, setRegAnswer] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [foundQuestion, setFoundQuestion] = useState<string | null>(null);
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

  const switchTab = (next: AuthTab) => {
    setTab(next);
    setError(null);
    setNotice(null);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const { user } = await loginUser({ email: loginEmail, password: loginPassword });
      onAuthSuccess(user);
      onNavigate('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const { user } = await registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        securityQuestion: regQuestion,
        securityAnswer: regAnswer,
      });
      onAuthSuccess(user);
      onNavigate('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleLookupQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await lookupSecurityQuestion(forgotEmail);
      setFoundQuestion(res.securityQuestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not find account.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await resetPasswordWithSecurityAnswer({
        email: forgotEmail,
        securityAnswer: forgotAnswer,
        newPassword: forgotNewPassword,
      });
      setNotice(res.message);
      setFoundQuestion(null);
      setForgotAnswer('');
      setForgotNewPassword('');
      setLoginEmail(forgotEmail);
      setTab('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-12 lg:py-16">
      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Informational Column */}
        <div className="lg:col-span-5 space-y-6 pt-2">
          <div>
            <p className="text-sm font-semibold text-blue-800">Researcher Account</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">
              Save your analyzed library and study history
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Sign in or create an account to persist your PDF paper analyses, Ask AI conversations,
              and cross-paper comparisons in your personal database workspace.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-display text-sm font-bold text-slate-900">
              Included with every account
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>01. Persistent SQLite history of every analyzed PDF</li>
              <li>02. Saved Ask AI conversation threads with page citations</li>
              <li>03. Multi-paper comparison tables and gap reports</li>
              <li>04. Unlimited downloadable PDF analysis reports</li>
            </ul>
            <div className="border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-900 hover:text-blue-700"
              >
                <span>Continue directly to Workspace Dashboard</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          {/* Interactive Tab Switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                tab === 'login'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                tab === 'register'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => switchTab('forgot')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                tab === 'forgot'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Forgot Password
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              {notice}
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="mt-6 space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="researcher@university.edu"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchTab('forgot')}
                    className="text-xs font-medium text-blue-800 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
              >
                {loading ? 'Signing In...' : 'Sign In to Dashboard'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <User
                    className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    minLength={2}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Dr. Aarav Sharma"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
                  Password (minimum 8 characters)
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-4">
                <div>
                  <label htmlFor="reg-question" className="block text-sm font-medium text-slate-700">
                    Password Recovery Question
                  </label>
                  <div className="relative mt-1.5">
                    <ShieldQuestion
                      className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    />
                    <select
                      id="reg-question"
                      value={regQuestion}
                      onChange={(e) => setRegQuestion(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {SECURITY_QUESTIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-answer" className="block text-sm font-medium text-slate-700">
                    Recovery Answer
                  </label>
                  <input
                    id="reg-answer"
                    type="text"
                    required
                    minLength={2}
                    value={regAnswer}
                    onChange={(e) => setRegAnswer(e.target.value)}
                    placeholder="Used if you ever need to reset your password"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
              >
                {loading ? 'Creating Account...' : 'Create Account & Open Dashboard'}
              </button>
            </form>
          )}

          {/* Forgot Password Flow */}
          {tab === 'forgot' && (
            <div className="mt-6">
              {!foundQuestion ? (
                <form onSubmit={handleLookupQuestion} className="space-y-5">
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700">
                      Registered Email Address
                    </label>
                    <div className="relative mt-1.5">
                      <Mail
                        className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@university.edu"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
                  >
                    {loading ? 'Checking Account...' : 'Find Recovery Question'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                    <p className="text-xs font-semibold text-blue-900">Security Question</p>
                    <p className="mt-1 text-sm text-slate-800">{foundQuestion}</p>
                  </div>

                  <div>
                    <label htmlFor="forgot-answer" className="block text-sm font-medium text-slate-700">
                      Your Recovery Answer
                    </label>
                    <input
                      id="forgot-answer"
                      type="text"
                      required
                      value={forgotAnswer}
                      onChange={(e) => setForgotAnswer(e.target.value)}
                      placeholder="Enter your recovery answer"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="forgot-new-pass" className="block text-sm font-medium text-slate-700">
                      New Password (minimum 8 characters)
                    </label>
                    <div className="relative mt-1.5">
                      <KeyRound
                        className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id="forgot-new-pass"
                        type="password"
                        required
                        minLength={8}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Enter a new password"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFoundQuestion(null)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
                    >
                      {loading ? 'Updating Password...' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
