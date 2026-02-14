const mongoose = require('mongoose');
const { MONGO_URI } = require('../config');

let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  console.log('MongoDB connected');
  return cached.conn;
}

module.exports = connectDB;
