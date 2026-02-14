require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { PORT, FRONTEND_URL } = require('./config');
const connectDB = require('./data/db');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const mentorRoutes = require('./routes/mentor.routes');
const projectRoutes = require('./routes/project.routes');
const meetingRoutes = require('./routes/meeting.routes');
const diaryRoutes = require('./routes/diary.routes');
const evaluationRoutes = require('./routes/evaluation.routes');
const presentationRoutes = require('./routes/presentation.routes');

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// Parsing
app.use(express.json());
app.use(cookieParser());

// DB connection middleware — ensures MongoDB is connected before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).json({ error: { code: 'DB_ERROR', message: 'Database connection failed' } });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'MPMS API', version: '1.0.0' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/presentations', presentationRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

// Only listen when running directly (not on Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`\n  🚀 MPMS API running at http://localhost:${PORT}`);
    console.log(`  📋 Health check: http://localhost:${PORT}/api/health\n`);
    console.log('  📧 Test Accounts:');
    console.log('  ─────────────────────────────────────────────────');
    console.log('  Admin:   admin@jaipur.manipal.edu       / Admin@123');
    console.log('  Mentor:  rahul.sharma@jaipur.manipal.edu / Mentor@123');
    console.log('  Student: yash.sehgal@jaipur.manipal.edu  / Student@123');
    console.log('  Faculty: deepak.mishra@jaipur.manipal.edu/ Faculty@123');
    console.log('  ─────────────────────────────────────────────────\n');
  });
}

// Export for Vercel serverless
module.exports = app;
