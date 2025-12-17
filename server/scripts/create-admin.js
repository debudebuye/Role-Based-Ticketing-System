/**
 * Quick Admin User Creation Script
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../features/users/user.model.js';
import { ROLES } from '../shared/constants/roles.js';

// Load environment variables
dotenv.config();

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'daoebaba1@gmail.com',
      password: 'password123',
      role: ROLES.ADMIN,
      department: 'IT',
      phone: '+1234567890'
    };
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: adminData.email });
    if (existingUser) {
      console.log('⚠️  User already exists:', adminData.email);
      console.log('✅ You can login with:', adminData.email, '/ password123');
    } else {
      const user = await User.create(adminData);
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', user.email);
      console.log('🔑 Password: password123');
      console.log('👤 Role:', user.role);
    }
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();