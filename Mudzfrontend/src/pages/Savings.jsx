import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { getGroupMembers, recordSavings } from '../api/service.jsx';

export default function Saving() {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ member_id: '', amount: '' });

  useEffect(() => {
    if (groupId) loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    const res = await getGroupMembers(groupId);
    setMembers(res.data);
    if (res.data.length > 0) setForm({ ...form, member_id: res.data[0].id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await recordSavings({ member_id: form.member_id, amount: parseFloat(form.amount) });
      alert('Savings recorded successfully!');
      navigate(`/dashboard`);
    } catch (err) {
      alert('Failed to record savings');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-4 text-emerald-400">Record Savings Deposit</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase">Select Member</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white mt-1"
                value={form.member_id}
                onChange={(e) => setForm({ ...form, member_id: e.target.value })}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase">Amount (MWK)</label>
              <input
                type="number"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white mt-1"
                placeholder="e.g. 10000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-lg mt-4">
              Submit Deposit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}