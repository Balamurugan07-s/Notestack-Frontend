import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import API from '../services/api';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = request otp, 2 = enter otp and new password
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      return setError('Please fill in all fields');
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setPreviewUrl(null);

    if (!forgotEmail) {
      return setError('Please enter your email address');
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email: forgotEmail });
      setLoading(false);
      if (res.data.success) {
        setMessage('Reset OTP code sent to your email.');
        if (res.data.previewUrl) {
          setPreviewUrl(res.data.previewUrl);
        }
        setForgotStep(2);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || 'Password reset request failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!resetOtp || !newPassword) {
      return setError('Please enter the OTP and your new password');
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/reset-password', {
        email: forgotEmail,
        otp: resetOtp,
        newPassword: newPassword,
      });
      setLoading(false);
      if (res.data.success) {
        setMessage('Password reset successful. You can now login with your new password.');
        setTimeout(() => {
          setShowForgot(false);
          setForgotStep(1);
          setEmail(forgotEmail);
          setPassword('');
          setMessage('');
          setError('');
        }, 3000);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || 'Password reset failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center animate-glow-bg px-4 py-12 relative">
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-float-shape"></div>

      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative z-10">
        {!showForgot ? (
          <>
            {/* Login Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-400 text-sm">Enter your credentials to access your notes</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 p-3.5 rounded-xl text-sm flex items-center space-x-2 mb-6">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                  <div className="p-3 text-gray-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="you@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-white px-2 py-3 text-sm focus:ring-0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
                <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                  <div className="p-3 text-gray-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-white px-2 py-3 text-sm focus:ring-0"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setError('');
                    setMessage('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex justify-center items-center space-x-1.5 cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Sign In'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="text-center pt-4">
                <p className="text-gray-400 text-xs">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold">
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Forgot Password Flow */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-white mb-2">Reset Password</h2>
              <p className="text-gray-400 text-sm">Recover your NoteStack account password</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 p-3.5 rounded-xl text-sm flex items-center space-x-2 mb-6">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-3.5 rounded-xl text-sm mb-6">
                {message}
              </div>
            )}

            {previewUrl && (
              <div className="bg-indigo-500/10 border border-indigo-500/25 p-3 rounded-xl mb-6 text-center">
                <p className="text-xs text-indigo-300 mb-2 font-medium">✉️ Local Dev SMTP Email generated:</p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  View Test Email HTML
                </a>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Account Email</label>
                  <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                    <div className="p-3 text-gray-500">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      placeholder="you@college.edu"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-white px-2 py-3 text-sm focus:ring-0"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {loading ? 'Sending Code...' : 'Send Reset Code'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(false);
                      setError('');
                      setMessage('');
                    }}
                    className="text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">6-Digit OTP Code</label>
                  <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                    <div className="p-3 text-gray-500">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="123456"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-white px-2 py-3 text-sm focus:ring-0 text-center tracking-widest font-bold"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                    <div className="p-3 text-gray-500">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      placeholder="Minimum 8 chars (1 letter, 1 number)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-white px-2 py-3 text-sm focus:ring-0"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {loading ? 'Resetting...' : 'Update Password'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setError('');
                      setMessage('');
                    }}
                    className="text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
