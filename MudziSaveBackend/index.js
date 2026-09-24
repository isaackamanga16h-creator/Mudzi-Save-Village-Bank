
//CORE FRAMEWORK & MIDDLEWARE
// Express framework for building the REST API routing architecture

//import express from 'express';
const express = require('express');
require('dotenv').config(); // Load environment variables from .env
const bcrypt = require('bcryptjs'); //for hashing and comparing passwords
const jwt = require('jsonwebtoken'); //for generating and verifying JWT tokens
const cors = require('cors');    //allow cross-origin requests
const { Pool } = require('pg');  // PostgreSQL client for Node.js

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mudzisave_hackathon_secret_2026'; // Secret key for signing JWT tokens


// POSTGRESQL CONNECTION SETUP (UPDATED FOR SUPABASE)
const pool = new Pool({
  // This automatically handles user, host, database, password, and port from your URL string!
  connectionString: process.env.DATABASE_URL, 
  ssl: {
    rejectUnauthorized: false // Mandated by Supabase to encrypt traffic securely
  }
});

// Verify connection on startup
pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Successfully connected to Supabase PostgreSQL database for MudziSave!');
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If there's no token or it's the mock token, bypass verification for the hackathon demo
  if (!token || token.startsWith('mock-')) {
    req.user = { id: 1, role: 'official', name: 'Demo User' };
    return next();
  }

  // Real JWT verification fallback
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Even if invalid, allow request through during hackathon demo
      req.user = { id: 1, role: 'official', name: 'Demo User' };
      return next();
    }
    req.user = user;
    next();
  });
};

// AUTHENTICATION & OFFICIALS
// Register a new official
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  // Guard against missing fields before hashing
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: 'Official registered successfully', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login an official
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL SAVINGS GROUPS FOR LOGGED-IN OFFICIAL
app.get('/api/groups', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM savings_groups WHERE created_by = $1 ORDER BY id DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch groups error:', err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE NEW SAVINGS GROUP
app.post('/api/groups', authenticate, async (req, res) => {
  const group_name = req.body.group_name || req.body.name;
  const location = req.body.location || null;
  const created_by = req.user?.id || req.user?.userId;

  if (!group_name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO savings_groups (group_name, location, created_by) 
       VALUES ($1, $2, $3) RETURNING *`,
      [group_name, location, created_by]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: err.message });
  }
});

// MEMBER MANAGEMENT & SEARCH
// Add a new member to a savings group
app.post('/api/members', authenticate, async (req, res) => {
  const group_id = req.body.group_id || req.body.groupId;
  const full_name = req.body.full_name || req.body.fullName;
  const phone_number = req.body.phone_number || req.body.phone;
  const national_id = req.body.national_id || req.body.address || null;

  if (!group_id || !full_name) {
    return res.status(400).json({ error: 'group_id and full_name are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO group_members (group_id, full_name, phone_number, national_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [group_id, full_name, phone_number, national_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get members with optional search query (?search=Grace)
// This endpoint allows searching by full name or phone number
app.get('/api/groups/:groupId/members', authenticate, async (req, res) => {
  const { groupId } = req.params;
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM group_members WHERE group_id = $1';
    let params = [groupId];

    if (search) {
      query += ' AND (full_name ILIKE $2 OR phone_number ILIKE $2)';
      params.push(`%${search}%`);
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// FINANCIAL TRANSACTIONS (SAVINGS & LOANS)

// Record Savings
app.post('/api/savings', authenticate, async (req, res) => {
  const { member_id, amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO savings (member_id, amount) VALUES ($1, $2) RETURNING *',
      [member_id, amount]
    );
    res.status(201).json({ message: 'Savings recorded successfully', savings: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET MEMBER SAVINGS HISTORY
app.get('/api/members/:memberId/savings', authenticate, async (req, res) => {
  const { memberId } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, member_id, amount, created_at FROM savings WHERE member_id = $1 ORDER BY created_at DESC',
      [memberId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch savings history error:', err);
    res.status(500).json({ error: err.message });
  }
});
// GET MEMBER PROFILE & FINANCIAL SUMMARY (FBI SCORE)
app.get('/api/members/:memberId/profile', authenticate, async (req, res) => {
  const { memberId } = req.params;

  try {
    // 1. Fetch member core information
    const memberResult = await pool.query(
      'SELECT id, group_id, full_name, phone_number, national_id, joined_at FROM group_members WHERE id = $1',
      [memberId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberResult.rows[0];

    // 2. Calculate Total Savings
    const savingsResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total_savings FROM savings WHERE member_id = $1',
      [memberId]
    );
    const totalSavings = parseFloat(savingsResult.rows[0].total_savings) || 0;

    // 3. Calculate Active Loans & Repayments
    // Active loans total_due
    const loansResult = await pool.query(
      "SELECT COALESCE(SUM(total_due), 0) AS total_loan_due FROM loans WHERE member_id = $1 AND status = 'ACTIVE'",
      [memberId]
    );
    const totalLoanDue = parseFloat(loansResult.rows[0].total_loan_due) || 0;

    // Total repayments made against ACTIVE loans
    const repaymentsResult = await pool.query(
      `SELECT COALESCE(SUM(r.amount_paid), 0) AS total_repaid 
       FROM loan_repayments r 
       JOIN loans l ON r.loan_id = l.id 
       WHERE l.member_id = $1 AND l.status = 'ACTIVE'`,
      [memberId]
    );
    const totalRepaid = parseFloat(repaymentsResult.rows[0].total_repaid) || 0;

    // Remaining loan balance
    const activeLoanBalance = Math.max(0, totalLoanDue - totalRepaid);

    // 4. Calculate Total Shares (1 share = MWK 1,000 savings)
    const shareValue = 1000;
    const totalShares = Math.floor(totalSavings / shareValue);

    // 5. Financial Behaviour Indicator (FBI Credit Score Calculation)
    let creditPoints = 650; // Base score
    let fbiStatus = "Good Standing";

    if (totalSavings >= 10000) creditPoints += 50;
    if (totalSavings >= 50000) creditPoints += 50;
    if (totalSavings >= 100000) creditPoints += 50;

    if (activeLoanBalance > 0) {
      if (activeLoanBalance > totalSavings * 2) {
        creditPoints -= 150;
        fbiStatus = "High Risk";
      } else {
        creditPoints -= 30;
        fbiStatus = "Moderate Risk";
      }
    } else if (totalSavings > 20000) {
      fbiStatus = "Excellent Standing";
    }

    // Clamp score between 300 and 850
    creditPoints = Math.max(300, Math.min(850, creditPoints));

    // Send payload aligned with both frontend naming styles
    res.json({
      id: member.id,
      full_name: member.full_name,
      phone_number: member.phone_number,
      national_id: member.national_id,
      joined_at: member.joined_at,
      total_savings: totalSavings,
      loan_balance: activeLoanBalance,
      total_loan: activeLoanBalance,
      total_shares: totalShares,
      shares: totalShares,
      fbi_score: fbiStatus,
      credit_score: `${creditPoints} (${fbiStatus})`
    });

  } catch (err) {
    console.error('Fetch member profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1. ISSUE NEW LOAN (POST)
app.post('/api/loans', authenticate, async (req, res) => {
  const member_id = req.body.member_id;
  const principal_amount = req.body.principal_amount || req.body.amount;
  const interest_rate_percent = req.body.interest_rate_percent || req.body.interest_rate || 10.0;
  
  if (!member_id || !principal_amount) {
    return res.status(400).json({ error: 'member_id and principal_amount are required' });
  }

  // Fallback to 30 days from today if due_date is omitted
  let due_date = req.body.due_date;
  if (!due_date) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    due_date = defaultDate.toISOString().split('T')[0];
  }

  const principal = parseFloat(principal_amount);
  const rate = parseFloat(interest_rate_percent);
  const total_due = principal * (1 + rate / 100);

  try {
    const result = await pool.query(
      `INSERT INTO loans (
        member_id, 
        principal_amount, 
        interest_rate_percent, 
        total_due, 
        due_date, 
        status
      ) 
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE') 
      RETURNING *`,
      [parseInt(member_id, 10), principal, rate, total_due, due_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Issue loan error:', err);
    res.status(500).json({ error: err.message });
  }
});


// 2. GET LOANS FOR A SPECIFIC MEMBER (GET) - KEEP THIS!
app.get('/api/members/:memberId/loans', authenticate, async (req, res) => {
  const { memberId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM loans WHERE member_id = $1 ORDER BY id DESC',
      [memberId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch member loans error:', err);
    res.status(500).json({ error: err.message });
  }
});
// POST /api/repayments
app.post('/api/repayments', authenticate, async (req, res) => {
  const { member_id, loan_id, amount_paid } = req.body;

  try {
    let targetLoanId = loan_id;

    // 1. Look up active loan by member (matches status = 'ACTIVE' from your schema)
    if (!targetLoanId && member_id) {
      const activeLoan = await pool.query(
        `SELECT id FROM loans 
         WHERE member_id = $1 
         AND LOWER(status) = 'active'
         ORDER BY id DESC LIMIT 1`,
        [member_id]
      );

      if (activeLoan.rows.length === 0) {
        return res.status(404).json({ error: 'No active loan found for this member.' });
      }

      targetLoanId = activeLoan.rows[0].id;
    }

    if (!targetLoanId) {
      return res.status(400).json({ error: 'Loan ID or Member ID is required.' });
    }

    // 2. Insert repayment into loan_repayments table
    const insertQuery = `
      INSERT INTO loan_repayments (loan_id, amount_paid)
      VALUES ($1, $2)
      RETURNING *
    `;
    const repaymentResult = await pool.query(insertQuery, [targetLoanId, amount_paid]);

    // 3. Calculate total paid so far to check if loan is fully paid off
    const totalsResult = await pool.query(
      `SELECT 
         l.total_due, 
         COALESCE(SUM(r.amount_paid), 0) AS total_paid
       FROM loans l
       LEFT JOIN loan_repayments r ON l.id = r.loan_id
       WHERE l.id = $1
       GROUP BY l.id, l.total_due`,
      [targetLoanId]
    );

    if (totalsResult.rows.length > 0) {
      const { total_due, total_paid } = totalsResult.rows[0];
      
      // If sum of repayments >= total_due, mark loan as PAID
      if (parseFloat(total_paid) >= parseFloat(total_due)) {
        await pool.query(
          "UPDATE loans SET status = 'PAID' WHERE id = $1",
          [targetLoanId]
        );
      }
    }

    res.status(201).json({
      message: 'Repayment recorded successfully',
      repayment: repaymentResult.rows[0]
    });

  } catch (err) {
    console.error('Repayment error:', err);
    res.status(500).json({ error: err.message });
  }
});

//MEMBER FINANCIAL PROFILE & BEHAVIOR INDICATOR
// Get a member's financial profile and calculate the Financial Behaviour Indicator
app.get('/api/members/:memberId/profile', authenticate, async (req, res) => {
  const { memberId } = req.params;
  try {
    // Member Details
    const memberRes = await pool.query('SELECT * FROM group_members WHERE id = $1', [memberId]);
    if (memberRes.rows.length === 0) return res.status(404).json({ message: 'Member not found' });
    const member = memberRes.rows[0];

    // Total Savings
    const savingsRes = await pool.query('SELECT COALESCE(SUM(amount), 0) as total_savings FROM savings WHERE member_id = $1', [memberId]);
    const totalSavings = parseFloat(savingsRes.rows[0].total_savings);

    // Loans Summary
    const loansRes = await pool.query(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(CASE WHEN status = 'PAID' THEN 1 END) as loans_repaid,
        COALESCE(SUM(total_due), 0) as total_borrowed
      FROM loans WHERE member_id = $1
    `, [memberId]);
    const loanStats = loansRes.rows[0];

    // Repayments Sum
    const repaymentsRes = await pool.query(`
      SELECT COALESCE(SUM(lr.amount_paid), 0) as total_repaid 
      FROM loan_repayments lr
      JOIN loans l ON l.id = lr.loan_id
      WHERE l.member_id = $1
    `, [memberId]);
    const totalRepaid = parseFloat(repaymentsRes.rows[0].total_repaid);
    const currentOutstanding = Math.max(0, parseFloat(loanStats.total_borrowed) - totalRepaid);

    // Calculate Financial Behaviour Indicator (0 - 100)
    let score = 50; // Base score
    score += Math.min(30, Math.floor(totalSavings / 10000)); // +1 per MWK 10,000 saved (max +30)
    score += parseInt(loanStats.loans_repaid) * 10; // +10 for each fully repaid loan
    score = Math.min(100, Math.max(0, score)); // Keep between 0 and 100

    res.json({
      member,
      metrics: {
        totalSavings,
        totalLoansTaken: parseInt(loanStats.total_loans),
        loansRepaid: parseInt(loanStats.loans_repaid),
        totalBorrowed: parseFloat(loanStats.total_borrowed),
        currentOutstanding,
        financialBehaviourIndicator: score
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 6. GROUP DASHBOARD & SUMMARIES
// Get group dashboard summary
app.get('/api/groups/:groupId/dashboard', authenticate, async (req, res) => {
  const { groupId } = req.params;
  try {
    // 1. Total Members
    const membersRes = await pool.query(
      'SELECT COUNT(*) FROM group_members WHERE group_id = $1', 
      [groupId]
    );
    
    // 2. Group Savings
    const savingsRes = await pool.query(`
      SELECT COALESCE(SUM(s.amount), 0) as group_savings 
      FROM savings s
      JOIN group_members m ON m.id = s.member_id
      WHERE m.group_id = $1
    `, [groupId]);

    // 3. Loans Principal Issued & Total Due (Principal + Interest)
    const loansRes = await pool.query(`
      SELECT 
        COALESCE(SUM(l.principal_amount), 0) as total_principal,
        COALESCE(SUM(l.total_due), 0) as total_due
      FROM loans l
      JOIN group_members m ON m.id = l.member_id
      WHERE m.group_id = $1
    `, [groupId]);

    // 4. Total Repayments Made
    const repaymentsRes = await pool.query(`
      SELECT COALESCE(SUM(lr.amount_paid), 0) as total_repaid
      FROM loan_repayments lr
      JOIN loans l ON l.id = lr.loan_id
      JOIN group_members m ON m.id = l.member_id
      WHERE m.group_id = $1
    `, [groupId]);

    const totalPrincipal = parseFloat(loansRes.rows[0].total_principal);
    const totalDue = parseFloat(loansRes.rows[0].total_due);
    const totalRepaid = parseFloat(repaymentsRes.rows[0].total_repaid);
    
    // Outstanding balance is what is owed (Total Due) minus what was paid back
    const outstandingBalance = Math.max(0, totalDue - totalRepaid);

    res.json({
      totalMembers: parseInt(membersRes.rows[0].count, 10),
      totalGroupSavings: parseFloat(savingsRes.rows[0].group_savings),
      totalLoansIssued: totalPrincipal,
      outstandingLoanBalance: outstandingBalance
    });
  } catch (err) {
    console.error('Dashboard endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

//start server
app.listen(PORT, () => {
    console.log(`MudziSave API running on http://localhost:${PORT}`)
});
