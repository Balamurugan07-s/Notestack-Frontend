import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, GraduationCap, Users, ShieldAlert, MessageCircle, FileText, ArrowRight } from 'lucide-react';
import API from '../services/api';

const Home: React.FC = () => {
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    studyNotesCount: 0,
    activeStudentsCount: 0,
    academicProgramsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/notes/public/stats');
        if (res.data && res.data.success) {
          setStats({
            studyNotesCount: res.data.studyNotesCount,
            activeStudentsCount: res.data.activeStudentsCount,
            academicProgramsCount: res.data.academicProgramsCount,
          });
        }
      } catch (err) {
        console.error('Failed to fetch platform stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchVal.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const handleSubjectClick = (subject: string) => {
    navigate(`/explore?subject=${encodeURIComponent(subject)}`);
  };

  const featuredSubjects = [
    'Computer Science', 'Mathematics', 'Mechanical Engineering', 
    'Physics', 'Business & Finance', 'Chemistry'
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] animate-glow-bg overflow-hidden flex flex-col justify-between">
      {/* Decorative floating shapes */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-float-shape"></div>
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float-shape" style={{ animationDelay: '-4s' }}></div>

      {/* Hero Content Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center z-10 w-full">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/25 px-4 py-1.5 rounded-full text-indigo-400 font-semibold text-sm mb-6">
          <GraduationCap className="h-4 w-4" />
          <span>NoteStack: Curated Notes by Students, for Students</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-tight">
          Level Up Your Study Sessions With <span className="text-indigo-400 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">NoteStack</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload, share, browse, and download secure academic notes. Ask questions directly on study material and collaborate with peers instantly.
        </p>

        {/* Large search bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-12">
          <div className="relative flex items-center bg-gray-900/60 backdrop-blur-md rounded-2xl border border-white/10 p-2 shadow-2xl focus-within:border-indigo-500/50 transition-colors">
            <Search className="h-6 w-6 text-gray-500 ml-4" />
            <input
              type="text"
              placeholder="Search by topic, subject, tags, or course..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-white px-4 py-3 placeholder-gray-500 text-md md:text-lg focus:ring-0"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <span>Search</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Subject suggestions */}
        <div className="max-w-3xl mx-auto mb-16">
          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-4">Browse by popular subjects</p>
          <div className="flex flex-wrap justify-center gap-3">
            {featuredSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => handleSubjectClick(subject)}
                className="bg-white/5 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 text-gray-300 hover:text-indigo-300 font-medium px-4 py-2 rounded-xl transition-all text-sm cursor-pointer"
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        {/* Quick features showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl w-fit mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Secure Notes Sharing</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Upload your study materials in PDF, DOCX, or text format. All files undergo malware verification checks upon submission.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl w-fit mb-4">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Live Q&A Queries</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Stuck on a formula or concept? Post queries directly under any note, reply to threads, and mark answers as helpful.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="bg-amber-500/10 text-amber-400 p-3 rounded-xl w-fit mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Privacy & GDPR Controls</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Control your visibility with private drafts. Initiate GDPR purges to delete your profile and documents instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Footer section */}
      <div className="bg-gray-950/60 backdrop-blur-md border-t border-white/5 py-8 px-6 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-gray-500 text-sm">
          <div className="flex space-x-12">
            <div>
              <span className="block text-2xl font-bold text-white mb-0.5">
                {loading ? '...' : stats.studyNotesCount.toLocaleString()}
              </span>
              <span>Study Notes Uploaded</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white mb-0.5">
                {loading ? '...' : stats.activeStudentsCount.toLocaleString()}
              </span>
              <span>Active Students</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white mb-0.5">
                {loading ? '...' : stats.academicProgramsCount.toLocaleString()}
              </span>
              <span>Academic Programs</span>
            </div>
          </div>
          <div>
            <span>© 2026 NoteStack Study Platform. All personal data encrypted.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
