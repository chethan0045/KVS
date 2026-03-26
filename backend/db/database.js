const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://todoUser:chethan45@cluster0.etbmi2g.mongodb.net/kvs?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 30000,
});

const db = mongoose.connection;

db.on('connected', () => {
  console.log('MongoDB connected successfully to kvs database on Atlas cluster');
});

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

module.exports = mongoose;
