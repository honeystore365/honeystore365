-- Add email verification and password reset tables for Auth.js

-- Email verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Password resets table
CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_customer ON email_verifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_customer ON password_resets(customer_id);
