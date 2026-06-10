import mongoose from 'mongoose';

const email = process.argv[2] || 'admin@example.com';

await mongoose.connect('mongodb://localhost:27017/ticket-system');

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
