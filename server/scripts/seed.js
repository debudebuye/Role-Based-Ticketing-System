/**
 * Database Seeding Script
 * Creates initial admin user and sample data
 */

import dotenv from 'dotenv';
import { connectDB } from '../shared/config/database.js';
import { User } from '../features/users/user.model.js';
import { ROLES } from '../shared/constants/roles.js';

// Load environment variables
dotenv.config();

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: ROLES.ADMIN,
    department: 'IT',
    phone: '+1234567890'
  },
  {
    name: 'Manager User',
    email: 'manager@example.com',
    password: 'manager123',
    role: ROLES.MANAGER,
    department: 'Support',
    phone: '+1234567891'
  },
  {
    name: 'Agent User',
    email: 'agent@example.com',
    password: 'agent123',
    role: ROLES.AGENT,
    department: 'Support',
    phone: '+1234567892'
  },
  {
    name: 'Customer User',
    email: 'customer@example.com',
    password: 'customer123',
    role: ROLES.CUSTOMER,
    department: 'Sales',
    phone: '+1234567893'
  },
  {
    name: 'Test User',
    email: 'daoebaba1@gmail.com',
    password: 'password123',
    role: ROLES.ADMIN,
    department: 'IT',
    phone: '+1234567894'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing users (optional - comment out if you want to keep existing users)
    console.log('🗑️  Clearing existing users...');
    await User.deleteMany({});
    
    // Create seed users
    console.log('👥 Creating seed users...');
    for (const userData of seedUsers) {
      try {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const user = await User.create(userData);
          console.log(`✅ Created user: ${user.name} (${user.email}) - Role: ${user.role}`);
        } else {
          console.log(`⚠️  User already exists: ${userData.email}`);
        }
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }
    
    console.log('\n🎉 Database seeding completed!');
    console.log('\n📋 Available Test Accounts:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Manager: manager@example.com / manager123');
    console.log('Agent: agent@example.com / agent123');
    console.log('Customer: customer@example.com / customer123');
    console.log('Your Account: daoebaba1@gmail.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase };