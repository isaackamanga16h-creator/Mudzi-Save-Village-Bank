import React, { useEffect, useState } from "react";
import { getMemberProfile } from "../api/service.jsx";

export default function MemberProfileModal({ memberId, isOpen, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const showModal = isOpen !== undefined ? isOpen : Boolean(memberId);

    if (showModal && memberId) {
      setLoading(true);
      setError(null);

      getMemberProfile(memberId)
        .then((res) => {
          // Unwraps nested Axios payload structures safely
          const raw = res.data?.data || res.data;
          console.log("Fetched Profile Data Structure:", raw);
          setProfile(raw);
        })
        .catch((err) => {
          console.error("Error fetching member profile:", err);
          setError("Failed to load member details.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, memberId]);

  const active = isOpen !== undefined ? isOpen : Boolean(memberId);
  if (!active) return null;

  // Extract inner objects if nested inside profile/financialSummary
  const innerProfile = profile?.profile || profile;
  const financial = profile?.financialSummary || profile;

  // Safe extraction with fallbacks for both camelCase and snake_case
  const memberName = innerProfile?.full_name || innerProfile?.name || "Member Profile";
  const phone = innerProfile?.phone_number || innerProfile?.phone;

  const rawSavings =
    financial?.totalSavings ??
    financial?.total_savings ??
    profile?.total_savings ??
    0;

  const rawLoans =
    financial?.activeLoanBalance ??
    financial?.loan_balance ??
    financial?.total_loans ??
    profile?.loan_balance ??
    0;

  const rawShares =
    financial?.totalShares ??
    financial?.total_shares ??
    profile?.total_shares ??
    0;

  const fbiScore =
    financial?.behaviorIndicator ??
    financial?.fbi_score ??
    profile?.credit_score ??
    profile?.score ??
    "Good Standing";

  const savings = Number(rawSavings) || 0;
  const loanBalance = Number(rawLoans) || 0;
  const totalShares = Number(rawShares) || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full relative shadow-xl text-gray-800">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 font-bold text-xl"
        >
          &times;
        </button>

        {loading ? (
          <div className="py-8 text-center text-gray-600">
            <p className="animate-pulse font-medium">Loading profile & FBI details...</p>
          </div>
        ) : error ? (
          <div className="py-6 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : profile ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2 text-gray-900">
              {memberName}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded shadow-sm">
                <span className="text-xs text-gray-500 block uppercase font-semibold">
                  Total Savings
                </span>
                <span className="text-lg font-bold text-green-600">
                  MWK {savings.toLocaleString()}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded shadow-sm">
                <span className="text-xs text-gray-500 block uppercase font-semibold">
                  Loan Balance
                </span>
                <span className="text-lg font-bold text-red-600">
                  MWK {loanBalance.toLocaleString()}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded shadow-sm">
                <span className="text-xs text-gray-500 block uppercase font-semibold">
                  Total Shares
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {totalShares.toLocaleString()}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded shadow-sm">
                <span className="text-xs text-gray-500 block uppercase font-semibold">
                  FBI Score / Status
                </span>
                <span className="text-lg font-bold text-purple-600">
                  {fbiScore}
                </span>
              </div>
            </div>

            {phone && (
              <div className="text-sm text-gray-600 pt-2 border-t">
                <p><span className="font-semibold text-gray-700">Phone:</span> {phone}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-500">
            <p>No profile data available.</p>
          </div>
        )}
      </div>
    </div>
  );
}