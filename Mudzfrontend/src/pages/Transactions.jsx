import React from 'react';
import Navbar from '../components/navbar';

export default function Transaction() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Transaction History</h2>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center text-slate-500">
          All transactions are automatically logged under member profiles and group dashboard summaries.
        </div>
      </div>
    </div>
  );
}