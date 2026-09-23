import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/service';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser({ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-emerald-400">MudziSave</h1>
          <p className="text-slate-400 text-sm mt-1">Official Portal • Sign In</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-300 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase">Email</label>
            <input
              type="email"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 text-white focus:outline-none focus:border-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase">Password</label>
            <input
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mt-1 text-white focus:outline-none focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold py-3 rounded-lg transition mt-6"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Need an account? <span onClick={() => navigate('/register')} className="text-emerald-400 cursor-pointer underline">Register</span>
        </p>
      </div>
    </div>
  );
}