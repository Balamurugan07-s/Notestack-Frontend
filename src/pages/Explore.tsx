import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Search, SlidersHorizontal, Eye, Download, Bookmark, FileType, BookOpen, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Note {
  _id: string;
  title: string;
  description: string;
  subject: string;
  tags: string[];
  fileType: string;
  downloadCount: number;
  isPrivate: boolean;
  uploader: {
    _id: string;
    name: string;
    college?: string;
  };
}

const Explore: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // API parameters from URL query params
  const initialSearch = searchParams.get('search') || '';
  const initialSubject = searchParams.get('subject') || '';
  const initialFileType = searchParams.get('fileType') || '';
  const initialSortBy = searchParams.get('sortBy') || 'createdAt';
  const initialPage = parseInt(searchParams.get('page') || '1');

  // UI States
  const [searchVal, setSearchVal] = useState(initialSearch);
  const [subject, setSubject] = useState(initialSubject);
  const [fileType, setFileType] = useState(initialFileType);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [page, setPage] = useState(initialPage);

  // Notes payload states
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);
  const [bookmarks, setBookmarks] = useState<string[]>([]); // Track bookmarked note IDs

  // Fetch list of notes
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await API.get('/notes', {
        params: {
          search: searchParams.get('search') || '',
          subject: searchParams.get('subject') || '',
          fileType: searchParams.get('fileType') || '',
          sortBy: searchParams.get('sortBy') || 'createdAt',
          page: searchParams.get('page') || '1',
          limit: 9,
        },
      });
      if (res.data.success) {
        setNotes(res.data.notes);
        setTotalPages(res.data.totalPages);
        setTotalNotes(res.data.totalNotes);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's bookmarks to show active bookmark states
  const fetchBookmarks = async () => {
    try {
      const res = await API.get('/users/bookmarks');
      if (res.data.success) {
        setBookmarks(res.data.bookmarks.map((n: any) => n._id));
      }
    } catch (err) {
      console.warn('Bookmarks failed to load');
    }
  };

  // Synchronize component states with searchParams updates
  useEffect(() => {
    fetchNotes();
    fetchBookmarks();
  }, [searchParams]);

  // Update query params when filters are applied
  const applyFilters = (newParams: any) => {
    const updated = new URLSearchParams(searchParams);
    
    // Set or delete key value pairs
    Object.keys(newParams).forEach((key) => {
      const val = newParams[key];
      if (val) {
        updated.set(key, val);
      } else {
        updated.delete(key);
      }
    });
    
    // Reset to page 1 on filter updates
    if (newParams.page === undefined) {
      updated.set('page', '1');
      setPage(1);
    }

    setSearchParams(updated);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search: searchVal });
  };

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    applyFilters({ subject: val });
  };

  const handleFileTypeChange = (val: string) => {
    setFileType(val);
    applyFilters({ fileType: val });
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    applyFilters({ sortBy: val });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      applyFilters({ page: newPage.toString() });
    }
  };

  const handleBookmarkToggle = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation(); // Avoid card click navigation
    try {
      const res = await API.post(`/notes/${noteId}/bookmark`);
      if (res.data.success) {
        if (res.data.bookmarked) {
          setBookmarks([...bookmarks, noteId]);
        } else {
          setBookmarks(bookmarks.filter((id) => id !== noteId));
        }
      }
    } catch (err) {
      console.error('Bookmark toggle failed');
    }
  };

  const subjects = [
    { value: '', label: 'All Subjects' },
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Physics', label: 'Physics' },
    { value: 'Business', label: 'Business & Finance' },
    { value: 'Chemistry', label: 'Chemistry' },
    { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
  ];

  const fileTypes = [
    { value: '', label: 'All Formats' },
    { value: 'pdf', label: 'PDF Documents' },
    { value: 'docx', label: 'Word (DOCX)' },
    { value: 'txt', label: 'Plain Text' },
    { value: 'png', label: 'Images (PNG/JPG)' },
  ];

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'docx': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'txt': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0b0f19] text-gray-100 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Search header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-indigo-500" />
              Browse Notes
            </h1>
            <p className="text-gray-400 text-sm mt-1">Explore verified study notes from students globally</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md relative flex items-center bg-gray-900 border border-white/5 rounded-xl px-3 py-1 shadow-lg focus-within:border-indigo-500/50 transition-colors">
            <Search className="h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search title, tags, description..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-white px-3 py-2.5 text-sm focus:ring-0"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => { setSearchVal(''); applyFilters({ search: '' }); }}
                className="text-gray-500 hover:text-white text-xs mr-2 cursor-pointer"
              >
                Clear
              </button>
            )}
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer">
              Go
            </button>
          </form>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-white/5 h-fit space-y-6">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
              <SlidersHorizontal className="h-5 w-5 text-indigo-400" />
              <h2 className="text-md font-bold text-white uppercase tracking-wider">Filter Search</h2>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2.5">Subject / Course</label>
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full bg-gray-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {subjects.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* File Type Filter */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2.5">Document Type</label>
              <select
                value={fileType}
                onChange={(e) => handleFileTypeChange(e.target.value)}
                className="w-full bg-gray-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {fileTypes.map((ft) => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2.5">Sort Results By</label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSortChange('createdAt')}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${sortBy === 'createdAt' ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                >
                  Newest Uploaded
                </button>
                <button
                  onClick={() => handleSortChange('downloads')}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${sortBy === 'downloads' ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                >
                  Popularity (Downloads)
                </button>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-xs text-gray-400 space-y-1">
              <span className="font-bold text-white block mb-1">💡 Pro-Tip</span>
              <span>Filter by computer science or math to view detailed sheets, preview file internals before saving download clicks.</span>
            </div>
          </div>

          {/* Notes Grid */}
          <div className="lg:col-span-3 space-y-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="glass-panel h-64 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="glass-panel text-center py-20 px-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center space-y-4">
                <AlertCircle className="h-12 w-12 text-indigo-500" />
                <h3 className="text-xl font-bold text-white">No Notes Found</h3>
                <p className="text-gray-400 text-sm max-w-sm">
                  We couldn't find any study notes matching your parameters. Adjust your keyword or category filter.
                </p>
                <button
                  onClick={() => {
                    setSearchVal('');
                    setSubject('');
                    setFileType('');
                    setSortBy('createdAt');
                    setSearchParams({});
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notes.map((note) => (
                    <div
                      key={note._id}
                      onClick={() => navigate(`/notes/${note._id}`)}
                      className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col justify-between border border-white/5 cursor-pointer group"
                    >
                      <div>
                        {/* Upper row: File type and bookmarks */}
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${getFileTypeColor(note.fileType)}`}>
                            {note.fileType}
                          </span>
                          
                          <button
                            onClick={(e) => handleBookmarkToggle(e, note._id)}
                            className={`p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer ${bookmarks.includes(note._id) ? 'bg-indigo-600/30 text-indigo-400 border-indigo-500/20' : 'text-gray-400'}`}
                          >
                            <Bookmark className="h-4 w-4" fill={bookmarks.includes(note._id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-md font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1.5">
                          {note.title}
                        </h3>
                        <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed mb-4">
                          {note.description}
                        </p>
                      </div>

                      <div>
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {note.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 text-[10px] px-2 py-0.5 rounded-md font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Note Metadata / Footer */}
                        <div className="flex justify-between items-center pt-3.5 border-t border-white/5 text-xs text-gray-500">
                          <span className="truncate max-w-[120px] font-medium text-gray-400">
                            By {note.uploader?.name || 'Student'}
                          </span>
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center space-x-1">
                              <Download className="h-3 w-3" />
                              <span>{note.downloadCount}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination bar */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4 pt-4">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-semibold text-gray-400">
                      Page <span className="text-white font-bold">{page}</span> of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Explore;
