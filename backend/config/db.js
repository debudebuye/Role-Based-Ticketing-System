const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    // MongoDB connection URI from environment variables
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ticketing-system';

    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Exit the process if the connection fails
    process.exit(1);
  }
};

module.exports = connectDB;