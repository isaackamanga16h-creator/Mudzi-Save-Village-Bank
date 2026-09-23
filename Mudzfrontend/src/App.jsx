import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import Members from './pages/Members';
import Savings from './pages/Savings';
import Loans from './pages/Loans';
import Repayments from './pages/Repayments';
import Transactions from './pages/Transactions';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/group" element={<Groups />} />
        <Route path="/members" element={<Members />} />
        <Route path="/saving" element={<Savings />} />
        <Route path="/loan" element={<Loans />} />
        <Route path="/repayment" element={<Repayments />} />
        <Route path="/transaction" element={<Transactions />} />
      </Routes>
    </Router>
  );
}