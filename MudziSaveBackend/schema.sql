-- 1. Users (Group Officials)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Savings Groups
CREATE TABLE savings_groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    created_by INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Group Members
CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INT REFERENCES savings_groups(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    national_id VARCHAR(50),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Savings Contributions
CREATE TABLE savings (
    id SERIAL PRIMARY KEY,
    member_id INT REFERENCES group_members(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    contribution_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Loans
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    member_id INT REFERENCES group_members(id) ON DELETE CASCADE,
    principal_amount DECIMAL(12, 2) NOT NULL,
    interest_rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 10.0,
    total_due DECIMAL(12, 2) NOT NULL, -- Principal + Calculated Interest
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE' or 'PAID'
    issued_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL
);

-- 6. Loan Repayments
CREATE TABLE loan_repayments (
    id SERIAL PRIMARY KEY,
    loan_id INT REFERENCES loans(id) ON DELETE CASCADE,
    amount_paid DECIMAL(12, 2) NOT NULL,
    repayment_date DATE DEFAULT CURRENT_DATE
);