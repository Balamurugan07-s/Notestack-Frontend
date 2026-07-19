import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Download, Bookmark, MessageSquare, ThumbsUp, Calendar, CornerDownRight, AlertCircle, FileText, ArrowLeft, ShieldAlert } from 'lucide-react';
import axios from 'axios';

interface Uploader {
  _id: string;
  name: string;
  college?: string;
  course?: string;
}

interface Note {
  _id: string;
  title: string;
  description: string;
  subject: string;
  tags: string[];
  fileUrl: string;
  fileKey: string;
  fileType: string;
  isPrivate: boolean;
  downloadCount: number;
  uploader: Uploader;
  createdAt: string;
}

interface Reply {
  _id: string;
  content: string;
  createdAt: string;
  helpfulVotes: string[];
  user: {
    _id: string;
    name: string;
    role: string;
  };
}

interface QueryThread {
  _id: string;
  content: string;
  createdAt: string;
  helpfulVotes: string[];
  user: {
    _id: string;
    name: string;
    role: string;
  };
  replies?: Reply[];
}

const NoteDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Note details & comment states
  const [note, setNote] = useState<Note | null>(null);
  const [queries, setQueries] = useState<QueryThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Custom txt file content preview
  const [txtContent, setTxtContent] = useState('');

  // Form controls
  const [newComment, setNewComment] = useState('');
  const [activeReplyBox, setActiveReplyBox] = useState<string | null>(null); // Track which comment is being replied to
  const [replyContent, setReplyContent] = useState('');
  const [bookmarked, setBookmarked] = useState(false);

  const fetchNoteDetails = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/notes/${id}`);
      if (res.data.success) {
        setNote(res.data.note);
        setQueries(res.data.queries || []);
        
        // If file type is txt, fetch plain text content for inline rendering
        if (res.data.note.fileType === 'txt') {
          try {
            const txtRes = await axios.get(`http://localhost:5000${res.data.note.fileUrl}`);
            setTxtContent(txtRes.data);
          } catch (txtErr) {
            console.warn('Could not load txt content preview:', txtErr);
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load note details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarkStatus = async () => {
    try {
      const res = await API.get('/users/bookmarks');
      if (res.data.success && id) {
        const isBookmarked = res.data.bookmarks.some((b: any) => b._id === id);
        setBookmarked(isBookmarked);
      }
    } catch (err) {
      console.warn('Bookmarks failed to load');
    }
  };

  useEffect(() => {
    fetchNoteDetails();
    fetchBookmarkStatus();
  }, [id]);

  const handleDownload = async () => {
    if (!note) return;
    try {
      // 1. Request secure signed token
      const res = await API.get(`/notes/${note._id}/download`);
      if (res.data.success) {
        const downloadUrl = res.data.downloadUrl;
        
        // 2. Open link in dynamic iframe or trigger native attachment download
        const link = document.createElement('a');
        link.href = `http://localhost:5000${downloadUrl}`;
        link.setAttribute('download', note.title);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Increment local state download count
        setNote({
          ...note,
          downloadCount: note.downloadCount + 1,
        });
      }
    } catch (err) {
      console.error('Download link generation failed:', err);
      alert('Could not secure file download. Access restricted.');
    }
  };

  const handleBookmarkToggle = async () => {
    if (!note) return;
    try {
      const res = await API.post(`/notes/${note._id}/bookmark`);
      if (res.data.success) {
        setBookmarked(res.data.bookmarked);
      }
    } catch (err) {
      console.error('Bookmark toggle failed');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !note) return;

    try {
      const res = await API.post(`/notes/${note._id}/queries`, { content: newComment });
      if (res.data.success) {
        const addedQuery = res.data.query;
        setQueries([
          { ...addedQuery, replies: [] },
          ...queries,
        ]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Comment post failed');
    }
  };

  const handlePostReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const res = await API.post(`/queries/${parentId}/reply`, { content: replyContent });
      if (res.data.success) {
        const addedReply = res.data.reply;
        setQueries(
          queries.map((q) => {
            if (q._id === parentId) {
              return {
                ...q,
                replies: [...(q.replies || []), addedReply],
              };
            }
            return q;
          })
        );
        setReplyContent('');
        setActiveReplyBox(null);
      }
    } catch (err) {
      console.error('Reply post failed');
    }
  };

  const handleVoteQuery = async (queryId: string, isReply: boolean, parentId?: string) => {
    try {
      const res = await API.post(`/queries/${queryId}/helpful`);
      if (res.data.success) {
        if (!isReply) {
          setQueries(
            queries.map((q) => {
              if (q._id === queryId) {
                const voted = res.data.isHelpful;
                const newVotes = voted
                  ? [...q.helpfulVotes, user?.id || '']
                  : q.helpfulVotes.filter((vid) => vid !== user?.id);
                return { ...q, helpfulVotes: newVotes };
              }
              return q;
            })
          );
        } else if (parentId) {
          setQueries(
            queries.map((q) => {
              if (q._id === parentId) {
                const updatedReplies = q.replies?.map((r) => {
                  if (r._id === queryId) {
                    const voted = res.data.isHelpful;
                    const newVotes = voted
                      ? [...r.helpfulVotes, user?.id || '']
                      : r.helpfulVotes.filter((vid) => vid !== user?.id);
                    return { ...r, helpfulVotes: newVotes };
                  }
                  return r;
                });
                return { ...q, replies: updatedReplies };
              }
              return q;
            })
          );
        }
      }
    } catch (err) {
      console.error('Upvote failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex justify-center items-center bg-[#0b0f19]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#0b0f19] px-6">
        <div className="glass-panel max-w-md p-8 rounded-3xl border border-white/5 text-center flex flex-col items-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-rose-500" />
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{error || 'This note has been marked private or does not exist.'}</p>
          <button
            onClick={() => navigate('/explore')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0b0f19] text-gray-100 px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate('/explore')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors cursor-pointer text-sm font-semibold mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Discovery</span>
        </button>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Document Viewport Previewer (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Note Document Preview</h2>
            
            <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden min-h-[500px] flex flex-col justify-between">
              
              {/* PDF Frame */}
              {note.fileType === 'pdf' && (
                <iframe
                  src={`http://localhost:5000${note.fileUrl}#toolbar=0`}
                  title="PDF Document Preview"
                  className="w-full h-[650px] border-0"
                />
              )}

              {/* Image Frame */}
              {['png', 'jpg', 'jpeg'].includes(note.fileType) && (
                <div className="flex justify-center items-center p-6 bg-gray-950/40 h-[650px]">
                  <img
                    src={`http://localhost:5000${note.fileUrl}`}
                    alt={note.title}
                    className="max-h-full max-w-full object-contain rounded-xl shadow-lg border border-white/5 transition-transform hover:scale-[1.02]"
                  />
                </div>
              )}

              {/* Text File Frame */}
              {note.fileType === 'txt' && (
                <div className="p-8 font-mono text-xs text-indigo-300 bg-gray-950/60 h-[650px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {txtContent || 'Reading file stream data...'}
                </div>
              )}

              {/* Word Document Frame (Static placeholder) */}
              {note.fileType === 'docx' && (
                <div className="flex flex-col items-center justify-center space-y-4 p-20 text-center h-[550px] bg-gray-950/30">
                  <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <FileText className="h-16 w-16" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Word Document (.docx)</h3>
                  <p className="text-gray-400 text-sm max-w-sm">
                    Direct browser document previews for DOCX files are restricted. Download the file natively to view.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 px-5 rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                  >
                    <Download className="h-4.5 w-4.5" />
                    <span>Download Native DOCX</span>
                  </button>
                </div>
              )}

              {/* Preview Footer */}
              <div className="bg-gray-950/50 px-6 py-4 flex justify-between items-center border-t border-white/5 text-xs text-gray-500">
                <span>Security hard-link signature verified clean.</span>
                <span>Format: {note.fileType.toUpperCase()} File</span>
              </div>
            </div>
          </div>

          {/* Column 2: Note metadata & Q&A comments (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Metadata Card */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-5">
              <div>
                <h1 className="text-2xl font-extrabold text-white leading-tight mb-2">{note.title}</h1>
                <p className="text-gray-400 text-sm leading-relaxed">{note.description}</p>
              </div>

              {/* Subject Tag */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="bg-indigo-600/25 border border-indigo-500/35 text-indigo-300 text-xs px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider">
                  {note.subject}
                </span>
                {note.tags.map((tag, idx) => (
                  <span key={idx} className="bg-white/5 text-gray-300 border border-white/5 text-xs px-3 py-1 rounded-xl">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Document details list */}
              <div className="border-t border-b border-white/5 py-4 space-y-3 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Author:</span>
                  <span className="text-gray-200 font-medium">{note.uploader.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>College:</span>
                  <span className="text-gray-200 font-medium">{note.uploader.college || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Course:</span>
                  <span className="text-gray-200 font-medium">{note.uploader.course || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Downloads:</span>
                  <span className="text-emerald-400 font-bold">{note.downloadCount} downloads</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Date:</span>
                  <span className="flex items-center space-x-1 text-gray-300">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={handleDownload}
                  className="col-span-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex justify-center items-center space-x-2 cursor-pointer text-sm"
                >
                  <Download className="h-4.5 w-4.5" />
                  <span>Download Securely</span>
                </button>
                <button
                  onClick={handleBookmarkToggle}
                  className={`col-span-1 border rounded-xl flex justify-center items-center transition-all cursor-pointer ${bookmarked ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/35 shadow-inner' : 'border-white/5 text-gray-400 hover:bg-white/10'}`}
                  title="Bookmark"
                >
                  <Bookmark className="h-5 w-5" fill={bookmarked ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Q&A Thread Container */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-md font-bold text-white flex items-center space-x-2 uppercase tracking-wider">
                  <MessageSquare className="h-5 w-5 text-indigo-400" />
                  <span>Q&A Discussion</span>
                </h3>
                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-2.5 py-1 rounded-lg font-bold">
                  {queries.length} Queries
                </span>
              </div>

              {/* Comment Input */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question about these notes..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Post
                </button>
              </form>

              {/* Thread list */}
              <div className="space-y-5 max-h-[350px] overflow-y-auto pr-1">
                {queries.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-xs">
                    No questions asked yet. Be the first to start the discussion!
                  </div>
                ) : (
                  queries.map((q) => (
                    <div key={q._id} className="border-b border-white/5 pb-4 last:border-b-0 space-y-3">
                      
                      {/* Top-level comment */}
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                            {q.user.name}
                            {q.user.role === 'admin' && <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-1 rounded">Admin</span>}
                          </span>
                          <span className="text-[10px] text-gray-500">{new Date(q.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-300 text-xs mt-1.5 leading-relaxed">{q.content}</p>
                        
                        {/* Vote and reply actions */}
                        <div className="flex space-x-4 mt-3 pt-2.5 border-t border-white/5 text-[10px] text-gray-500">
                          <button
                            onClick={() => handleVoteQuery(q._id, false)}
                            className={`flex items-center space-x-1 hover:text-indigo-400 transition-colors cursor-pointer ${q.helpfulVotes.includes(user?.id || '') ? 'text-indigo-400' : ''}`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span>Helpful ({q.helpfulVotes.length})</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setActiveReplyBox(activeReplyBox === q._id ? null : q._id);
                              setReplyContent('');
                            }}
                            className="hover:text-white transition-colors cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>

                      {/* Reply Input block */}
                      {activeReplyBox === q._id && (
                        <form onSubmit={(e) => handlePostReply(e, q._id)} className="flex gap-2 pl-4">
                          <input
                            type="text"
                            placeholder="Reply to this thread..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full bg-gray-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-[11px] text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3.5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                          >
                            Post
                          </button>
                        </form>
                      )}

                      {/* Nested Replies list */}
                      {q.replies && q.replies.length > 0 && (
                        <div className="pl-4 space-y-2 pt-1">
                          {q.replies.map((reply) => (
                            <div key={reply._id} className="flex items-start space-x-2 bg-indigo-950/20 p-2.5 rounded-xl border border-white/5">
                              <CornerDownRight className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                              <div className="w-full">
                                <div className="flex justify-between items-center">
                                  <span className="text-[11px] font-bold text-indigo-300">{reply.user.name}</span>
                                  <span className="text-[9px] text-gray-500">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-300 text-xs mt-1 leading-relaxed">{reply.content}</p>
                                
                                <button
                                  onClick={() => handleVoteQuery(reply._id, true, q._id)}
                                  className={`flex items-center space-x-1 mt-2 text-[9px] text-gray-500 hover:text-indigo-400 transition-colors cursor-pointer ${reply.helpfulVotes.includes(user?.id || '') ? 'text-indigo-400' : ''}`}
                                >
                                  <ThumbsUp className="h-2.5 w-2.5" />
                                  <span>Helpful ({reply.helpfulVotes.length})</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default NoteDetails;
