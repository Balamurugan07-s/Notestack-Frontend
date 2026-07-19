import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { User, FileText, Bookmark, Settings, Download, Trash2, ShieldAlert, Award, School, BookOpen, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Note {
  _id: string;
  title: string;
  subject: string;
  fileType: string;
  downloadCount: number;
  status: 'pending' | 'approved' | 'flagged';
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { user, updateProfile, gdprDeleteAccount } = useAuth();
  const navigate = useNavigate();

  // Tab controls
  const [activeTab, setActiveTab] = useState<'uploads' | 'bookmarks' | 'settings'>('uploads');

  // Profile data payload states
  const [stats, setStats] = useState({ uploadsCount: 0, totalDownloads: 0, bookmarksCount: 0 });
  const [uploads, setUploads] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings form states
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Alerts states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users/me');
      if (res.data.success) {
        setStats(res.data.stats);
        setUploads(res.data.uploads || []);
        
        // Fill form fields
        setName(res.data.user.name);
        setCollege(res.data.user.college || '');
        setCourse(res.data.user.course || '');
        setYear(res.data.user.year || '');
      }

      // Fetch Bookmarks
      const bookmarksRes = await API.get('/users/bookmarks');
      if (bookmarksRes.data.success) {
        setBookmarks(bookmarksRes.data.bookmarks || []);
      }
    } catch (err) {
      console.error('Failed to load profile settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await updateProfile({ name, college, course, year });
      if (result.success) {
        setSuccess('Profile details updated successfully');
      } else {
        setError(result.error || 'Failed to update details');
      }
    } catch (err) {
      setError('An error occurred during update');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword) {
      return setError('Please fill in password fields.');
    }

    try {
      const res = await API.put('/users/me/password', { currentPassword, newPassword });
      if (res.data.success) {
        setSuccess('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password update failed');
    }
  };

  const handleDeleteUpload = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note? This file will be unlinked permanently.')) return;
    try {
      const res = await API.delete(`/notes/${noteId}`);
      if (res.data.success) {
        setUploads(uploads.filter((u) => u._id !== noteId));
        setStats({
          ...stats,
          uploadsCount: stats.uploadsCount - 1,
        });
      }
    } catch (err) {
      console.error('Note deletion failed');
    }
  };

  const handleGdprPurge = async () => {
    if (
      !window.confirm(
        '⚠️ DANGER ACTION ⚠️\n\nAre you absolutely sure you want to execute GDPR account erasure? This will permanently delete your profile, saved bookmarks, comments, upvotes, and physically destroy all uploaded notes. This action cannot be undone!'
      )
    )
      return;

    try {
      const result = await gdprDeleteAccount();
      if (result.success) {
        alert('GDPR purge complete. All your personal data and files have been deleted.');
        navigate('/login');
      } else {
        setError(result.error || 'GDPR Purge failed');
      }
    } catch (err) {
      setError('GDPR purge failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex justify-center items-center bg-[#0b0f19]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0b0f19] text-gray-100 px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* User Banner Header */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-600 p-4 rounded-2xl text-white">
              <User className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">{name}</h1>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 font-medium">
                <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">{user?.role.toUpperCase()}</span>
                <span>•</span>
                <span>Member since {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex space-x-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-indigo-400">{stats.uploadsCount}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Uploads</span>
            </div>
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-emerald-400">{stats.totalDownloads}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Downloads</span>
            </div>
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-amber-400">{stats.bookmarksCount}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Saved</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-3 border-b border-white/5 pb-2">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`flex items-center space-x-1.5 pb-3.5 px-4 font-bold text-sm transition-all cursor-pointer ${activeTab === 'uploads' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
          >
            <FileText className="h-4.5 w-4.5" />
            <span>My Uploads</span>
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center space-x-1.5 pb-3.5 px-4 font-bold text-sm transition-all cursor-pointer ${activeTab === 'bookmarks' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
          >
            <Bookmark className="h-4.5 w-4.5" />
            <span>Bookmarks</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-1.5 pb-3.5 px-4 font-bold text-sm transition-all cursor-pointer ${activeTab === 'settings' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
          >
            <Settings className="h-4.5 w-4.5" />
            <span>Account Settings</span>
          </button>
        </div>

        {/* Tab Viewports */}
        <div className="space-y-6">
          
          {/* Uploads Tab */}
          {activeTab === 'uploads' && (
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h2 className="text-md font-bold text-white uppercase tracking-wider mb-2">Uploaded Notes ({uploads.length})</h2>
              
              {uploads.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  You haven't uploaded any notes yet. Shared resources help everyone!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400 border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-200 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-3">Title</th>
                        <th className="pb-3">Subject</th>
                        <th className="pb-3">Downloads</th>
                        <th className="pb-3">Format</th>
                        <th className="pb-3 text-right pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploads.map((note) => (
                        <tr
                          key={note._id}
                          onClick={() => navigate(`/notes/${note._id}`)}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                          <td className="py-4 pl-3 font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {note.title}
                          </td>
                          <td className="py-4">{note.subject}</td>
                          <td className="py-4 text-emerald-400 font-bold">{note.downloadCount}</td>
                          <td className="py-4">
                            <span className="bg-white/5 text-gray-300 px-2 py-0.5 rounded border border-white/5 text-xs font-semibold uppercase">
                              {note.fileType}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteUpload(note._id)}
                              className="text-gray-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Note"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Bookmarks Tab */}
          {activeTab === 'bookmarks' && (
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h2 className="text-md font-bold text-white uppercase tracking-wider mb-2">Saved Study Notes ({bookmarks.length})</h2>
              
              {bookmarks.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  You haven't bookmarked any notes yet. Browse the collection!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarks.map((note) => (
                    <div
                      key={note._id}
                      onClick={() => navigate(`/notes/${note._id}`)}
                      className="bg-gray-950/40 hover:bg-gray-950/70 border border-white/5 hover:border-indigo-500/20 p-5 rounded-2xl cursor-pointer transition-all group flex flex-col justify-between h-44"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                          {note.fileType}
                        </span>
                        <h3 className="text-md font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mt-3 mb-1.5">
                          {note.title}
                        </h3>
                        <p className="text-gray-400 text-xs line-clamp-2">{note.subject}</p>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-white/5">
                        <span className="flex items-center space-x-1">
                          <Download className="h-3.5 w-3.5" />
                          <span>{note.downloadCount}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Profile updates form */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-md font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Award className="h-5 w-5 text-indigo-400" />
                  <span>Profile Information</span>
                </h3>

                {success && (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-3 rounded-xl text-xs">
                    {success}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">College / University</label>
                    <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50">
                      <div className="p-2 text-gray-500"><School className="h-4.5 w-4.5" /></div>
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full bg-transparent border-0 outline-none text-white px-2 py-2 text-xs focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Course</label>
                      <div className="relative flex items-center bg-gray-950/60 rounded-xl border border-white/5 p-1 focus-within:border-indigo-500/50">
                        <div className="p-2 text-gray-500"><BookOpen className="h-4.5 w-4.5" /></div>
                        <input
                          type="text"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          className="w-full bg-transparent border-0 outline-none text-white px-2 py-2 text-xs focus:ring-0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 3rd Year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer text-xs"
                  >
                    Save Profile Details
                  </button>
                </form>
              </div>

              {/* Password update & GDPR delete section */}
              <div className="space-y-6">
                
                {/* Password editor */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="text-md font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <KeyRound className="h-5 w-5 text-indigo-400" />
                    <span>Change Credentials</span>
                  </h3>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer text-xs"
                    >
                      Update Password
                    </button>
                  </form>
                </div>

                {/* GDPR Deletion Block */}
                <div className="glass-panel p-6 rounded-2xl border border-red-500/20 space-y-4 bg-rose-950/5">
                  <h3 className="text-md font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="h-5 w-5" />
                    <span>GDPR Data Deletion</span>
                  </h3>
                  
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Under the General Data Protection Regulation (GDPR), you can purge all your account information. Executing this will permanently wipe your profile, saved bookmarks, comment histories, and physically unlink all uploaded files from storage.
                  </p>

                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 p-2.5 rounded-xl text-xs">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleGdprPurge}
                    className="w-full bg-rose-600/90 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-rose-600/25 cursor-pointer text-xs uppercase"
                  >
                    Purge Account & Files
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
