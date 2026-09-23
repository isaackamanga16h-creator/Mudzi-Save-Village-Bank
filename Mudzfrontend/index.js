
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const JWT_SECRET = '@16h';


// POSTGRESQL CONNECTION SETUP
const pool = new Pool({
  user: 'postgres',          // Postgres username
  host: 'localhost',          //  host
  database: 'MudziSave_db',   // database name
  password: 'retnay16',  // Postgres password
  port: 5432,                 // Default Postgres port
});

// Verify connection on startup
pool.connect((err) => {
  if (err) console.error('Database connection error:', err.stack);
  else console.log('Successfully connected to PostgreSQL database for MudziSave!');
});


// Middleware
app.use(cors());
app.use(express.json());

// JWT Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// AUTHENTICATION & OFFICIALS

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
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

// SAVINGS GROUPS

app.post('/api/groups', authenticate, async (req, res) => {
  const { group_name, location } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO savings_groups (group_name, location, created_by) VALUES ($1, $2, $3) RETURNING *',
      [group_name, location, req.user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/groups', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM savings_groups WHERE created_by = $1', [req.user.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MEMBER MANAGEMENT & SEARCH
app.post('/api/members', authenticate, async (req, res) => {
  const { group_id, full_name, phone_number, national_id } = req.body;
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

// Issue Loan (Auto-calculates total due with interest)
app.post('/api/loans', authenticate, async (req, res) => {
  const { member_id, principal_amount, interest_rate_percent, due_date } = req.body;
  
  const interestRate = interest_rate_percent || 10.0; // Default 10%
  const interestAmount = (parseFloat(principal_amount) * interestRate) / 100;
  const totalDue = parseFloat(principal_amount) + interestAmount;

  try {
    const result = await pool.query(
      `INSERT INTO loans (member_id, principal_amount, interest_rate_percent, total_due, due_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [member_id, principal_amount, interestRate, totalDue, due_date]
    );
    res.status(201).json({ message: 'Loan issued successfully', loan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record Repayment
app.post('/api/repayments', authenticate, async (req, res) => {
  const { loan_id, amount_paid } = req.body;
  try {
    // Record Repayment
    const repayment = await pool.query(
      'INSERT INTO loan_repayments (loan_id, amount_paid) VALUES ($1, $2) RETURNING *',
      [loan_id, amount_paid]
    );

    // 2. Check total paid vs total due
    const loanRes = await pool.query('SELECT total_due FROM loans WHERE id = $1', [loan_id]);
    const totalDue = parseFloat(loanRes.rows[0].total_due);

    const paidRes = await pool.query('SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM loan_repayments WHERE loan_id = $1', [loan_id]);
    const totalPaid = parseFloat(paidRes.rows[0].total_paid);

    // Update status to PAID if cleared
    if (totalPaid >= totalDue) {
      await pool.query("UPDATE loans SET status = 'PAID' WHERE id = $1", [loan_id]);
    }

    const remainingBalance = Math.max(0, totalDue - totalPaid);

    res.status(201).json({
      message: 'Repayment recorded successfully',
      repayment: repayment.rows[0],
      remainingBalance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//MEMBER FINANCIAL PROFILE & BEHAVIOR INDICATOR

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

app.get('/api/groups/:groupId/dashboard', authenticate, async (req, res) => {
  const { groupId } = req.params;
  try {
    // Total Members
    const membersRes = await pool.query('SELECT COUNT(*) FROM group_members WHERE group_id = $1', [groupId]);
    
    // Group Savings
    const savingsRes = await pool.query(`
      SELECT COALESCE(SUM(s.amount), 0) as group_savings 
      FROM savings s
      JOIN group_members m ON m.id = s.member_id
      WHERE m.group_id = $1
    `, [groupId]);

    // Outstanding Loans
    const loansRes = await pool.query(`
      SELECT 
        COALESCE(SUM(l.total_due), 0) as total_issued
      FROM loans l
      JOIN group_members m ON m.id = l.member_id
      WHERE m.group_id = $1
    `, [groupId]);

    const repaymentsRes = await pool.query(`
      SELECT COALESCE(SUM(lr.amount_paid), 0) as total_repaid
      FROM loan_repayments lr
      JOIN loans l ON l.id = lr.loan_id
      JOIN group_members m ON m.id = l.member_id
      WHERE m.group_id = $1
    `, [groupId]);

    const totalIssued = parseFloat(loansRes.rows[0].total_issued);
    const totalRepaid = parseFloat(repaymentsRes.rows[0].total_repaid);
    const outstandingBalance = Math.max(0, totalIssued - totalRepaid);

    res.json({
      totalMembers: parseInt(membersRes.rows[0].count),
      totalGroupSavings: parseFloat(savingsRes.rows[0].group_savings),
      totalLoansIssued: totalIssued,
      outstandingLoanBalance: outstandingBalance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MudziSave API running on http://localhost:${PORT}`)
});

