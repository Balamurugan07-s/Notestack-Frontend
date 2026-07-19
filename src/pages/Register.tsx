import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, BookOpen, GraduationCap, Calendar, ShieldCheck, ShieldAlert, KeyRound } from 'lucide-react';
import API from '../services/api';

const Register: React.FC = () => {
  const { register, verifyEmail } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    course: '',
    year: '',
  });

  const [step, setStep] = useState(1); // 1 = register form, 2 = verify OTP
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');

  // Password requirements state
  const passwordLength = formData.password.length >= 8;
  const passwordHasLetter = /[a-zA-Z]/.test(formData.password);
  const passwordHasNumber = /[0-9]/.test(formData.password);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      return setError('Please enter name, email, and password.');
    }

    if (!passwordLength || !passwordHasLetter || !passwordHasNumber) {
      return setError('Password does not meet standard complexity rules.');
    }

    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      setSuccessMsg(result.message || 'Registration successful. Verify code sent.');
      if (result.previewUrl) {
        setPreviewUrl(result.previewUrl);
      }
      setStep(2);
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otpCode) {
      return setError('Please enter the 6-digit verification code.');
    }

    setLoading(true);
    const result = await verifyEmail(formData.email, otpCode);
    setLoading(false);

    if (result.success) {
      setSuccessMsg('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } else {
      setError(result.error || 'Verification failed. Please check the code.');
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      setLoading(false);
      // Login endpoint on unverified accounts sends a new OTP
      if (res.data.success) {
        // Should not happen as user is unverified
      }
    } catch (err: any) {
      setLoading(false);
      if (err.response?.status === 403 && err.response?.data?.unverified) {
        setSuccessMsg('A new OTP has been sent.');
        if (err.response.data.previewUrl) {
          setPreviewUrl(err.response.data.previewUrl);
        }
      } else {
        setError(err.response?.data?.error || 'Resend failed.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center animate-glow-bg px-4 py-12 relative">
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-float-shape"></div>

      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative z-10">
        {step === 1 ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-extrabold text-white mb-2">Create Account</h2>
              <p className="text-gray-400 text-sm">Join NoteStack to start sharing notes</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 p-3.5 rounded-xl text-sm flex items-center space-x-2 mb-4">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                  <div className="p-2.5 text-gray-500">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-0 outline-none text-white px-2 py-2 text-sm focus:ring-0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                  <div className="p-2.5 text-gray-500">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="john@college.edu"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-0 outline-none text-white px-2 py-2 text-sm focus:ring-0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                  <div className="p-2.5 text-gray-500">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-0 outline-none text-white px-2 py-2 text-sm focus:ring-0"
                    required
                  />
                </div>
                {/* Real-time complexity validator UI */}
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  <div className={`text-[10px] py-1 text-center font-bold rounded-md transition-colors ${passwordLength ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-500 border border-transparent'}`}>
                    8+ Characters
                  </div>
                  <div className={`text-[10px] py-1 text-center font-bold rounded-md transition-colors ${passwordHasLetter ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-500 border border-transparent'}`}>
                    Has Letter
                  </div>
                  <div className={`text-[10px] py-1 text-center font-bold rounded-md transition-colors ${passwordHasNumber ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-500 border border-transparent'}`}>
                    Has Number
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">College</label>
                  <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                    <div className="p-2.5 text-gray-500">
                      <BookOpen className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      name="college"
                      placeholder="MIT"
                      value={formData.college}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border-0 outline-none text-white px-2 py-2 text-sm focus:ring-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Course</label>
                  <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                    <div className="p-2.5 text-gray-500">
                      <GraduationCap className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      name="course"
                      placeholder="B.Tech CS"
                      value={formData.course}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border-0 outline-none text-white px-2 py-2 text-sm focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Academic Year (Optional)</label>
                <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                  <div className="p-2.5 text-gray-500">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    name="year"
                    placeholder="e.g. 3rd Year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-0 outline-none text-white px-2 py-2 text-sm focus:ring-0"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer mt-2"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <div className="text-center pt-2">
                <p className="text-gray-400 text-xs">
                  Already have an account?{' '}
                  <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* OTP Verification Step */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-extrabold text-white mb-2">Verify Email</h2>
              <p className="text-gray-400 text-sm">We've sent a 6-digit OTP code to <span className="text-indigo-300 font-bold">{formData.email}</span></p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 p-3.5 rounded-xl text-sm flex items-center space-x-2 mb-4">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-3.5 rounded-xl text-sm mb-4">
                {successMsg}
              </div>
            )}

            {previewUrl && (
              <div className="bg-indigo-500/10 border border-indigo-500/25 p-3.5 rounded-xl mb-6 text-center">
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

            <form onSubmit={handleVerifySubmit} className="space-y-5">
              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 text-center">Enter Verification OTP</label>
                <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50 transition-colors">
                  <div className="p-3 text-gray-500">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-white px-2 py-3 text-md focus:ring-0 text-center tracking-widest font-bold"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex justify-center items-center space-x-1.5 cursor-pointer"
              >
                <ShieldCheck className="h-5 w-5" />
                <span>{loading ? 'Verifying...' : 'Verify OTP & Activate'}</span>
              </button>

              <div className="text-center pt-2 flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-bold cursor-pointer"
                >
                  Resend Verification OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                    setSuccessMsg('');
                    setPreviewUrl(null);
                  }}
                  className="text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Edit Registration Info
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
