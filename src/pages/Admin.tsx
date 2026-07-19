import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, Check, Trash2, Users, FileText, Download, Activity, Globe, ArrowRight } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
}

interface Note {
  _id: string;
  title: string;
  subject: string;
  fileType: string;
  status: 'pending' | 'approved' | 'flagged';
  uploader: {
    name: string;
    email: string;
  };
}

interface AuditEntry {
  _id: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  actor: {
    name: string;
    email: string;
  };
}

interface Analytics {
  totalUsers: number;
  totalNotes: number;
  totalDownloads: number;
  flaggedNotes: number;
  subjectBreakdown: { subject: string; count: number }[];
  fileTypeBreakdown: { fileType: string; count: number }[];
  recentLogs: AuditEntry[];
}

const Admin: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  // Dashboard states
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [flaggedNotes, setFlaggedNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'moderation' | 'users' | 'telemetry'>('moderation');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Analytics & Logs
      const res = await API.get('/admin/analytics');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }

      // 2. Fetch Flagged Notes
      const flaggedRes = await API.get('/admin/notes/flagged');
      if (flaggedRes.data.success) {
        setFlaggedNotes(flaggedRes.data.notes);
      }

      // 3. Fetch Users
      const usersRes = await API.get('/admin/users');
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch admin panel data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleModerateNote = async (noteId: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !window.confirm('Are you sure you want to permanently delete this flagged note?')) return;
    try {
      const res = await API.put(`/admin/notes/${noteId}/status`, { status });
      if (res.data.success) {
        setSuccess(`Note status set to ${status}`);
        setFlaggedNotes(flaggedNotes.filter((n) => n._id !== noteId));
        // Refresh analytics
        fetchAdminData();
      }
    } catch (err) {
      console.error('Note moderation failed');
    }
  };

  const handleChangeRole = async (userId: string, currentRole: 'student' | 'admin') => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      const res = await API.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setSuccess('User privileges updated');
        setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user privileges');
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#0b0f19] px-6">
        <div className="glass-panel max-w-md p-8 rounded-3xl border border-white/5 text-center flex flex-col items-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-rose-500" />
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            You do not possess the required administrator privileges to access NoteStack console panel.
          </p>
        </div>
      </div>
    );
  }

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
        
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
              <Shield className="h-8 w-8 text-indigo-500" />
              NoteStack Admin Panel
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage system uploads, user roles, and monitor security audit logs</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><Users className="h-6 w-6" /></div>
            <div>
              <span className="text-2xl font-black text-white">{analytics?.totalUsers}</span>
              <span className="block text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Users</span>
            </div>
          </div>
          
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><FileText className="h-6 w-6" /></div>
            <div>
              <span className="text-2xl font-black text-white">{analytics?.totalNotes}</span>
              <span className="block text-xs text-gray-400 uppercase tracking-wider font-semibold">Study Notes</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Download className="h-6 w-6" /></div>
            <div>
              <span className="text-2xl font-black text-white">{analytics?.totalDownloads}</span>
              <span className="block text-xs text-gray-400 uppercase tracking-wider font-semibold">Downloads</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-950/5 flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl"><ShieldAlert className="h-6 w-6" /></div>
            <div>
              <span className="text-2xl font-black text-rose-400">{analytics?.flaggedNotes}</span>
              <span className="block text-xs text-gray-400 uppercase tracking-wider font-semibold">Flagged Notes</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-white/5 pb-2">
          <button
            onClick={() => { setActiveSubTab('moderation'); setError(''); setSuccess(''); }}
            className={`pb-3 px-4 font-bold text-sm transition-all cursor-pointer ${activeSubTab === 'moderation' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
          >
            File Moderation
          </button>
          <button
            onClick={() => { setActiveSubTab('users'); setError(''); setSuccess(''); }}
            className={`pb-3 px-4 font-bold text-sm transition-all cursor-pointer ${activeSubTab === 'users' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
          >
            User Permissions
          </button>
          <button
            onClick={() => { setActiveSubTab('telemetry'); setError(''); setSuccess(''); }}
            className={`pb-3 px-4 font-bold text-sm transition-all cursor-pointer ${activeSubTab === 'telemetry' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
          >
            System Telemetry & Logs
          </button>
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-3.5 rounded-xl text-xs">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 p-3.5 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Tab views */}
        <div className="space-y-6">
          
          {/* Moderation tab */}
          {activeSubTab === 'moderation' && (
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h2 className="text-md font-bold text-white uppercase tracking-wider mb-2">Flagged Uploads Queue</h2>
              
              {flaggedNotes.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  Inbox clean. No notes are currently flagged for review.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400 border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-200 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-3">Title</th>
                        <th className="pb-3">Subject</th>
                        <th className="pb-3">Uploader Email</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3 text-right pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flaggedNotes.map((note) => (
                        <tr key={note._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 pl-3 font-bold text-white">{note.title}</td>
                          <td className="py-4">{note.subject}</td>
                          <td className="py-4 text-xs font-mono">{note.uploader?.email || 'N/A'}</td>
                          <td className="py-4 uppercase text-xs font-semibold">{note.fileType}</td>
                          <td className="py-4 text-right pr-3 space-x-2">
                            <button
                              onClick={() => handleModerateNote(note._id, 'approved')}
                              className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 transition-colors cursor-pointer"
                              title="Approve & Clear Flag"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleModerateNote(note._id, 'rejected')}
                              className="text-rose-400 hover:text-rose-300 p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 transition-colors cursor-pointer"
                              title="Delete & Reject note"
                            >
                              <Trash2 className="h-4 w-4" />
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

          {/* User management tab */}
          {activeSubTab === 'users' && (
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h2 className="text-md font-bold text-white uppercase tracking-wider mb-2">Registered Accounts List</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-200 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 pl-3">Name</th>
                      <th className="pb-3">Email Address</th>
                      <th className="pb-3">System Role</th>
                      <th className="pb-3 text-right pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 pl-3 font-bold text-white">{u.name}</td>
                        <td className="py-4 text-xs font-mono">{u.email}</td>
                        <td className="py-4">
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-gray-400 border-white/5'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 text-right pr-3">
                          <button
                            onClick={() => handleChangeRole(u._id, u.role)}
                            disabled={u._id === currentUser?.id}
                            className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 disabled:opacity-40 disabled:hover:bg-indigo-500/5 transition-colors cursor-pointer"
                          >
                            Toggle Role
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System Telemetry (Analytics & Audit Logs) */}
          {activeSubTab === 'telemetry' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Analytics bars */}
              <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Activity className="h-4.5 w-4.5 text-indigo-400" />
                    <span>Top Note subjects</span>
                  </h3>
                  <div className="space-y-4">
                    {analytics?.subjectBreakdown.map((sb, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-300 truncate max-w-[150px]">{sb.subject}</span>
                          <span className="text-white font-bold">{sb.count} notes</span>
                        </div>
                        {/* Custom visual progress bar */}
                        <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${(sb.count / (analytics.totalNotes || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {(!analytics?.subjectBreakdown || analytics.subjectBreakdown.length === 0) && (
                      <div className="text-center py-4 text-gray-500 text-xs">No aggregation records.</div>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Globe className="h-4.5 w-4.5 text-indigo-400" />
                    <span>File Formats</span>
                  </h3>
                  <div className="space-y-4">
                    {analytics?.fileTypeBreakdown.map((fb, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-300 uppercase">{fb.fileType} Files</span>
                          <span className="text-white font-bold">{fb.count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(fb.count / (analytics.totalNotes || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {(!analytics?.fileTypeBreakdown || analytics.fileTypeBreakdown.length === 0) && (
                      <div className="text-center py-4 text-gray-500 text-xs">No aggregation records.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audit Log list */}
              <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Globe className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Security Audit Logs</span>
                </h3>
                
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                  {analytics?.recentLogs.map((log) => (
                    <div key={log._id} className="bg-gray-950/50 p-3 rounded-xl border border-white/5 text-[11px] space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-indigo-400 uppercase font-bold">{log.action}</span>
                        <span className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-300">{log.details}</p>
                      <div className="flex justify-between text-[10px] text-gray-500 pt-1">
                        <span>Actor: {log.actor?.email || 'System'}</span>
                        <span>IP: {log.ipAddress || 'unknown'}</span>
                      </div>
                    </div>
                  ))}
                  {(!analytics?.recentLogs || analytics.recentLogs.length === 0) && (
                    <div className="text-center py-10 text-gray-500 text-xs">No audit logs found.</div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Admin;
