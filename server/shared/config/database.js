import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45_000,
      serverSelectionTimeoutMS: 5_000,
      retryWrites: true
    });
    logger.info('MongoDB connected', { host: conn.connection.host });

    mongoose.connection.on('error',        (err) => logger.error('MongoDB error', { err }));
    mongoose.connection.on('disconnected', ()    => logger.warn('MongoDB disconnected'));
    mongoose.connection.on('reconnected',  ()    => logger.info('MongoDB reconnected'));
  } catch (error) {
    logger.error('Database connection failed', { err: error });
    process.exit(1);
  }
};