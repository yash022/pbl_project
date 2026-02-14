if (!process.env.MONGO_URI) throw new Error('Missing required env var: MONGO_URI');
if (!process.env.JWT_SECRET) throw new Error('Missing required env var: JWT_SECRET');
if (!process.env.JWT_REFRESH_SECRET) throw new Error('Missing required env var: JWT_REFRESH_SECRET');

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY: '30m',
  JWT_REFRESH_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
  PORT: process.env.PORT || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ALLOWED_EMAIL_DOMAIN: '@jaipur.manipal.edu',
  ROLES: {
    STUDENT: 'STUDENT',
    MENTOR: 'MENTOR',
    PBL_FACULTY: 'PBL_FACULTY',
    ADMIN: 'ADMIN',
  },
};
