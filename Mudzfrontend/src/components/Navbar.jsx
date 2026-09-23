import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { username: 'Official' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-emerald-600/30">
          M
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">MudziSave</h1>
          <p className="text-xs text-emerald-400">FINOVATE 2026 Portal</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-xs text-slate-400">Logged in as <strong className="text-white">{user.username}</strong></span>
        <button
          onClick={handleLogout}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg border border-slate-700 transition"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}