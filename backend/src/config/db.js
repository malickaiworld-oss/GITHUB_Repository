const mongoose = require('mongoose');

async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resume_parser';

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    console.log('MongoDB connected');
    return mongoose.connection;
  } catch (error) {
    console.warn('MongoDB connection failed. Starting the app without a database connection:', error.message);
    return null;
  }
}

module.exports = { connectMongo };
