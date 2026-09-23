import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import { getGroupMembers, issueLoan } from '../api/service';

export default function Loan() {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ member_id: '', principal_amount: '', interest_rate: '10' });

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
      await issueLoan({
        member_id: form.member_id,
        principal_amount: parseFloat(form.principal_amount),
        interest_rate: parseFloat(form.interest_rate),
      });
      alert('Loan issued successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to issue loan');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-4 text-amber-400">Issue Loan</h2>
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
              <label className="text-xs text-slate-400 uppercase">Principal Amount (MWK)</label>
              <input
                type="number"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white mt-1"
                placeholder="e.g. 50000"
                value={form.principal_amount}
                onChange={(e) => setForm({ ...form, principal_amount: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase">Interest Rate (%)</label>
              <input
                type="number"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white mt-1"
                value={form.interest_rate}
                onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
              />
            </div>
            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 font-bold py-3 rounded-lg mt-4">
              Confirm Loan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}