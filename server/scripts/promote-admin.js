/* eslint-disable no-console */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const email = process.argv[2] || 'admin@example.com';
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket-system';

await mongoose.connect(mongoURI);

const result = await mongoose.connection
  .collection('users')
  .updateOne({ email }, { $set: { role: 'admin' } });

if (result.modifiedCount === 1) {
  console.log(`✅ ${email} is now an admin.`);
} else if (result.matchedCount === 0) {
  console.log(`❌ No user found with email: ${email}`);
} else {
  console.log(`ℹ️  ${email} was already an admin.`);
}

await mongoose.disconnect();
process.exit(0);
