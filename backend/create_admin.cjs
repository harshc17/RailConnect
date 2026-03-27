const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' }); // Ensure this path is correct

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Root@123',
  database: process.env.DB_NAME || 'railconnect'
};

async function createAdmin() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Get user details from command line arguments
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4];

    if (!email || !password || !name) {
      console.error('Usage: node create_admin.cjs <email> <password> "<name>"');
      console.log('\nExample: node create_admin.cjs new.admin@example.com securepass123 "New Admin"');
      process.exit(1);
    }
    
    console.log(`Attempting to create or update admin: ${email}`);

    // Check if user already exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      console.log('Admin user already exists with this email.');
      // Update the existing user's password and ensure their role is admin
      const hashedPassword = await bcrypt.hash(password, 10);
      await connection.execute(
        'UPDATE users SET password_hash = ?, role = ?, name = ? WHERE email = ?',
        [hashedPassword, 'admin', name, email]
      );
      console.log('Admin user updated successfully!');
      console.log('  Email:', email);
      console.log('Password:', password);
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    await connection.execute(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, '', hashedPassword, 'admin']
    );
    
    console.log('Admin user created successfully!');
    console.log('  Email:', email);
    console.log('  Password:', password);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await connection.end();
  }
}

createAdmin();