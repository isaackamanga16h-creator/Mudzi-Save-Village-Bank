import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import MemberProfileModal from '../components/memberprofilemodal.jsx';
import { 
  getGroupMembers, 
  addMember, 
  recordSavings, 
  issueLoan 
} from '../api/service.jsx';

export default function Members() {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modals & Selection State
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);

  // Form States
  const [newMember, setNewMember] = useState({ full_name: '', phone_number: '', national_id: '' });
  const [savingsData, setSavingsData] = useState({ member_id: '', amount: '' });
  const [loanData, setLoanData] = useState({ member_id: '', amount: '' });

  useEffect(() => {
    if (groupId) loadMembers();
  }, [groupId, search]);

  const loadMembers = async () => {
    try {
      const res = await getGroupMembers(groupId, search);
      const data = res.data || res;
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading group members:", err);
    }
  };

  // Handler: Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await addMember({ ...newMember, group_id: groupId });
      setShowAddModal(false);
      setNewMember({ full_name: '', phone_number: '', national_id: '' });
      loadMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding member');
    }
  };

  // Handler: Record Savings
  const handleRecordSavings = async (e) => {
    e.preventDefault();
    if (!savingsData.member_id) return alert("Please select a member");

    try {
      await recordSavings({
        member_id: savingsData.member_id,
        amount: parseFloat(savingsData.amount)
      });
      setShowSavingsModal(false);
      setSavingsData({ member_id: '', amount: '' });
      alert("Savings recorded successfully!");
      loadMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error recording savings');
    }
  };

  // Handler: Issue Loan
  const handleIssueLoan = async (e) => {
    e.preventDefault();
    if (!loanData.member_id) return alert("Please select a member");

    // Calculate due date (30 days default)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const principal = parseFloat(loanData.amount);
    const interestRate = 10.0; // 10%
    const totalDue = principal + (principal * (interestRate / 100));

    try {
      await issueLoan({
        member_id: loanData.member_id,
        principal_amount: principal,
        interest_rate_percent: interestRate,
        total_due: totalDue,
        due_date: dueDateStr
      });
      setShowLoanModal(false);
      setLoanData({ member_id: '', amount: '' });
      alert("Loan issued successfully!");
      loadMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error issuing loan');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Group Members</h2>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search members..."
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 min-w-[200px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={() => {
                setSavingsData({ member_id: '', amount: '' });
                setShowSavingsModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3.5 py-2.5 rounded-xl font-semibold whitespace-nowrap"
            >
              + Record Savings
            </button>
            <button
              onClick={() => {
                setLoanData({ member_id: '', amount: '' });
                setShowLoanModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-3.5 py-2.5 rounded-xl font-semibold whitespace-nowrap"
            >
              + Issue Loan
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-2.5 rounded-xl font-semibold whitespace-nowrap"
            >
              + Add Member
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Full Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">National ID</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {members.map((m) => {
                const activeId = m.id || m.member_id;

                return (
                  <tr key={activeId || m.phone_number || m.full_name} className="hover:bg-slate-800/50 transition">
                    <td className="p-4 font-semibold text-white">{m.full_name}</td>
                    <td className="p-4">{m.phone_number || 'N/A'}</td>
                    <td className="p-4">{m.national_id || 'N/A'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSavingsData({ member_id: activeId, amount: '' });
                          setShowSavingsModal(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700"
                      >
                        + Savings
                      </button>
                      <button
                        onClick={() => {
                          setLoanData({ member_id: activeId, amount: '' });
                          setShowLoanModal(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700"
                      >
                        + Loan
                      </button>
                      <button
                        onClick={() => {
                          console.log("Opening profile for member ID:", activeId);
                          setSelectedMemberId(activeId);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-medium"
                      >
                        View Profile & FBI Score
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Profile Modal */}
      <MemberProfileModal
        memberId={selectedMemberId}
        isOpen={Boolean(selectedMemberId)}
        onClose={() => setSelectedMemberId(null)}
      />

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Add New Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                value={newMember.full_name}
                onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Phone Number"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                value={newMember.phone_number}
                onChange={(e) => setNewMember({ ...newMember, phone_number: e.target.value })}
              />
              <input
                type="text"
                placeholder="National ID"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                value={newMember.national_id}
                onChange={(e) => setNewMember({ ...newMember, national_id: e.target.value })}
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 text-xs px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-xs px-5 py-2 rounded-lg font-bold text-white"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Savings Modal */}
      {showSavingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Record Member Savings</h3>
            <form onSubmit={handleRecordSavings} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Member</label>
                <select
                  required
                  value={savingsData.member_id}
                  onChange={(e) => setSavingsData({ ...savingsData, member_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m.id || m.member_id} value={m.id || m.member_id}>
                      {m.full_name} (ID: {m.id || m.member_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount (MWK)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  required
                  min="1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={savingsData.amount}
                  onChange={(e) => setSavingsData({ ...savingsData, amount: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSavingsModal(false)}
                  className="bg-slate-800 text-xs px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-xs px-5 py-2 rounded-lg font-bold text-white"
                >
                  Save Savings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Loan Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Issue New Loan</h3>
            <form onSubmit={handleIssueLoan} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Member</label>
                <select
                  required
                  value={loanData.member_id}
                  onChange={(e) => setLoanData({ ...loanData, member_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m.id || m.member_id} value={m.id || m.member_id}>
                      {m.full_name} (ID: {m.id || m.member_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Principal Amount (MWK)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  required
                  min="1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  value={loanData.amount}
                  onChange={(e) => setLoanData({ ...loanData, amount: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="bg-slate-800 text-xs px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-xs px-5 py-2 rounded-lg font-bold text-white"
                >
                  Issue Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}