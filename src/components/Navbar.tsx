import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Upload, User, LogOut, Shield, Menu, X, Bookmark } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 px-6 py-4 shadow-xl">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 text-indigo-400 font-bold text-2xl hover:text-indigo-300 transition-colors">
          <BookOpen className="h-7 w-7 text-indigo-500" />
          <span className="tracking-tight text-white">
            Note<span className="text-indigo-400">Stack</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/explore" className="text-gray-300 hover:text-white font-medium transition-colors">
            Explore
          </Link>
          
          {user ? (
            <>
              <Link to="/upload" className="flex items-center space-x-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-indigo-500/20">
                <Upload className="h-4 w-4" />
                <span>Upload Notes</span>
              </Link>

              <Link to="/dashboard" className="flex items-center space-x-1 text-gray-300 hover:text-white font-medium transition-colors">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>

              {user.role === 'admin' && (
                <Link to="/admin" className="flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  <Shield className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-400 hover:text-rose-400 font-medium transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white font-semibold px-4 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-300 hover:text-white focus:outline-none cursor-pointer"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/5 space-y-3 flex flex-col">
          <Link
            to="/explore"
            onClick={() => setIsOpen(false)}
            className="text-gray-300 hover:text-white py-2 font-medium"
          >
            Explore Notes
          </Link>

          {user ? (
            <>
              <Link
                to="/upload"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 bg-indigo-600/90 text-white py-2.5 px-4 rounded-xl font-semibold"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Notes</span>
              </Link>

              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white py-2 font-medium"
              >
                <User className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 py-2 font-semibold"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center space-x-2 text-gray-400 hover:text-rose-400 py-2 font-medium text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-center text-gray-300 hover:text-white py-2.5 font-semibold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="text-center bg-indigo-600 text-white py-2.5 rounded-xl font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
