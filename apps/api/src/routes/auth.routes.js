const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY_MS, ALLOWED_EMAIL_DOMAIN } = require('../config');
const { User, RefreshToken } = require('../models');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests, try again later' } },
});

function generateAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
}

async function generateRefreshToken(user) {
  const token = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + JWT_REFRESH_EXPIRY_MS);

  await RefreshToken.create({
    userId: user.id,
    tokenHash: hash,
    expiresAt,
  });

  return token;
}

// POST /auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'Name, email, and password are required' } });
    }

    if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: `Only ${ALLOWED_EMAIL_DOMAIN} emails are allowed` } });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'Password must be at least 6 characters' } });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Email already registered' } });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: 'STUDENT',
      department: req.body.department || 'Unassigned',
      semester: req.body.semester || null,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: JWT_REFRESH_EXPIRY_MS,
      path: '/',
    });

    res.status(201).json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, semester: user.semester },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'Email and password are required' } });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    // Need to access passwordHash which is excluded from toJSON but still on the document
    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: JWT_REFRESH_EXPIRY_MS,
      path: '/',
    });

    res.json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, semester: user.semester },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token not found' } });
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await RefreshToken.findOne({
      tokenHash: hash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!stored) {
      return res.status(401).json({ error: { code: 'INVALID_REFRESH', message: 'Invalid or expired refresh token' } });
    }

    // Revoke old
    stored.revokedAt = new Date();
    await stored.save();

    const user = await User.findById(stored.userId);
    if (!user) {
      return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: JWT_REFRESH_EXPIRY_MS,
      path: '/',
    });

    res.json({ accessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      await RefreshToken.findOneAndUpdate({ tokenHash: hash }, { revokedAt: new Date() });
    }

    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      semester: user.semester,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
