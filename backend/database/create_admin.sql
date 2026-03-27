-- Create admin user
-- Email: harshamaheshwari1711@gmail.com
-- Password: Harsh@1711
-- Note: Password hash is generated using bcrypt (salt rounds: 10)

-- First, check if user exists and delete if present
DELETE FROM users WHERE email = 'harshamaheshwari1711@gmail.com';

-- Insert admin user
-- Password hash for 'Harsh@1711' using bcrypt (you can generate this using create_admin.js script)
-- For now, this is a placeholder - run the create_admin.js script to generate the correct hash
INSERT INTO users (name, email, phone, password_hash, role, status)
VALUES (
  'Admin',
  'harshamaheshwari1711@gmail.com',
  '',
  '$2a$10$YOUR_HASHED_PASSWORD_HERE',  -- Replace with actual bcrypt hash
  'admin',
  'active'
);

-- To generate the correct password hash, run: node server/create_admin.js

