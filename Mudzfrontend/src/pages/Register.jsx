import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/service.jsx';

export default function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'Official' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-emerald-400">MudziSave</h1>
          <p className="text-slate-400 text-sm mt-1">Create Official Account</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-300 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase">Username</label>
            <input
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 text-white focus:outline-none focus:border-emerald-500"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase">Email</label>
            <input
              type="email"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 text-white focus:outline-none focus:border-emerald-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase">Password</label>
            <input
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 text-white focus:outline-none focus:border-emerald-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold py-3 rounded-lg transition mt-6"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already registered? <span onClick={() => navigate('/login')} className="text-emerald-400 cursor-pointer underline">Sign In</span>
        </p>
      </div>
    </div>
  );
}