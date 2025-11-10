-- ============================================
-- Seed Data for Users
-- ============================================
-- This script populates tblUser table
-- Phù hợp với schema mới (4 modules)
-- ============================================

-- Clear existing data (optional)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tblUser;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- INSERT USERS
-- ============================================
-- Note: Passwords should be hashed with bcrypt in production
-- These are example hashes for 'password123'

INSERT INTO tblUser (username, password, email) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@example.com'),
('user1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user1@example.com'),
('datascientist', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'datascientist@example.com'),
('testuser', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'nguyenthituanh135@gmail.com');

-- ============================================
-- VERIFY DATA
-- ============================================

SELECT 
    id,
    username,
    email,
    created_at
FROM tblUser
ORDER BY id;

SELECT 
    'Total Users' AS 'Metric',
    COUNT(*) AS 'Count'
FROM tblUser;
