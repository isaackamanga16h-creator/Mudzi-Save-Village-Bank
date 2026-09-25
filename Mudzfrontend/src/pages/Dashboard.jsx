import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import { getGroups, createGroup, getGroupDashboard } from '../api/service.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = 'https://mudzisavebackend.onrender.com';

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ group_name: '', location: '' });

  // Loan Repayment States
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [repayData, setRepayData] = useState({ member_id: '', loan_id: '', amount_paid: '' });

  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await getGroups();
      setGroups(res.data);
      if (res.data.length > 0) {
        selectGroup(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectGroup = async (group) => {
    setSelectedGroup(group);
    try {
      const res = await getGroupDashboard(group.id);
      setStats(res.data);

      // Load group members using your existing route
      loadGroupMembers(group.id);
    } catch (err) {
      console.error(err);
    }
  };

  const loadGroupMembers = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${baseURL}/api/groups/${groupId}/members`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      setGroupMembers(response.data || []);
    } catch (err) {
      console.error("Could not fetch group members:", err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await createGroup(newGroup);
      setShowModal(false);
      setNewGroup({ group_name: '', location: '' });
      loadGroups();
    } catch (err) {
      alert('Error creating group');
    }
  };

  const handleRepaySubmit = async (e) => {
    e.preventDefault();
    if (!repayData.member_id && !repayData.loan_id) {
      alert('Please select a member or enter a Loan ID.');
      return;
    }

    try {
      const payload = {
        amount_paid: parseFloat(repayData.amount_paid)
      };
      if (repayData.member_id) payload.member_id = parseInt(repayData.member_id, 10);
      if (repayData.loan_id) payload.loan_id = parseInt(repayData.loan_id, 10);

      const token = localStorage.getItem('token');
      await axios.post(`${baseURL}/api/repayments`, payload, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });

      alert('Repayment recorded successfully!');
      setShowRepayModal(false);
      setRepayData({ member_id: '', loan_id: '', amount_paid: '' });

      // Refresh group stats
      if (selectedGroup) selectGroup(selectedGroup);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to record repayment');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Left Sidebar: Groups */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Savings Groups</h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1.5 rounded-lg transition font-medium"
            >
              + New Group
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {groups.map((g) => (
              <div
                key={g.id}
                onClick={() => selectGroup(g)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  selectedGroup?.id === g.id
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <p className="font-semibold text-sm">{g.group_name}</p>
                <p className="text-xs text-slate-500 mt-1">📍 {g.location || 'Lilongwe Campus'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Stats & Action Navigation */}
        <div className="lg:col-span-9 space-y-6">
          {selectedGroup ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-xs font-medium text-slate-400 uppercase">Total Members</p>
                  <p className="text-2xl font-black text-white mt-2">{stats?.totalMembers || 0}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-xs font-medium text-slate-400 uppercase">Group Savings</p>
                  <p className="text-2xl font-black text-emerald-400 mt-2">MWK {(stats?.totalGroupSavings || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-xs font-medium text-slate-400 uppercase">Loans Issued</p>
                  <p className="text-2xl font-black text-amber-400 mt-2">MWK {(stats?.totalLoansIssued || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <p className="text-xs font-medium text-slate-400 uppercase">Outstanding Balance</p>
                  <p className="text-2xl font-black text-rose-400 mt-2">MWK {(stats?.outstandingLoanBalance || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Quick Action Navigation */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">{selectedGroup.group_name} Operations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => navigate(`/members?groupId=${selectedGroup.id}`)}
                    className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-2xl">👥</p>
                      <p className="font-bold text-sm text-white mt-2">Manage Members</p>
                      <p className="text-xs text-slate-400 mt-1">Register members & view profiles</p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate(`/saving?groupId=${selectedGroup.id}`)}
                    className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-2xl">💵</p>
                      <p className="font-bold text-sm text-white mt-2">Record Savings</p>
                      <p className="text-xs text-slate-400 mt-1">Log weekly banki mkhonde deposits</p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate(`/loan?groupId=${selectedGroup.id}`)}
                    className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-2xl">💰</p>
                      <p className="font-bold text-sm text-white mt-2">Issue Loans</p>
                      <p className="text-xs text-slate-400 mt-1">Issue loans with auto-interest</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowRepayModal(true)}
                    className="p-4 bg-emerald-950/30 hover:bg-emerald-900/40 rounded-xl border border-emerald-800/50 text-left transition flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-2xl">💳</p>
                      <p className="font-bold text-sm text-emerald-400 mt-2">Repay Loan</p>
                      <p className="text-xs text-slate-400 mt-1">Record loan repayments & clear balances</p>
                    </div>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              No group selected. Create or choose a savings group from the sidebar.
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create New Savings Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase">Group Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 mt-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Chinsapo Savings Club"
                  value={newGroup.group_name}
                  onChange={(e) => setNewGroup({ ...newGroup, group_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase">Location</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 mt-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Lilongwe"
                  value={newGroup.location}
                  onChange={(e) => setNewGroup({ ...newGroup, location: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-800 text-slate-300 text-xs px-4 py-2.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white text-xs px-5 py-2.5 rounded-lg font-semibold"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Repayment Modal */}
      {showRepayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Record Loan Repayment</h3>
            <p className="text-xs text-slate-400 mb-4">Group: <span className="text-emerald-400 font-semibold">{selectedGroup?.group_name}</span></p>

            <form onSubmit={handleRepaySubmit} className="space-y-4">
              {/* Select Member Dropdown */}
              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Select Member</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 mt-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                  value={repayData.member_id}
                  onChange={(e) => setRepayData({ ...repayData, member_id: e.target.value })}
                >
                  <option value="">-- Select Member --</option>
                  {groupMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} {m.phone_number ? `(${m.phone_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan ID Input */}
              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Loan ID (Optional)</label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 mt-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Auto-detected from member if left blank"
                  value={repayData.loan_id}
                  onChange={(e) => setRepayData({ ...repayData, loan_id: e.target.value })}
                />
              </div>

              {/* Amount Paid */}
              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Amount Paid (MWK)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 mt-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 5000"
                  value={repayData.amount_paid}
                  onChange={(e) => setRepayData({ ...repayData, amount_paid: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRepayModal(false)}
                  className="bg-slate-800 text-slate-300 text-xs px-4 py-2.5 rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-5 py-2.5 rounded-lg font-semibold transition"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}