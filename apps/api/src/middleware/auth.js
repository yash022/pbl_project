const jwt = require('jsonwebtoken');
const { JWT_SECRET, ROLES } = require('../config');
const { User, Project, ProjectMember } = require('../models');

// Authenticate JWT access token
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Access token required' } });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'User not found' } });
    }
    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Invalid or expired access token' } });
  }
}

// Role-based access: accepts one or more roles
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
    next();
  };
}

// Check if user is a member of the project
async function projectMember(req, res, next) {
  const projectId = req.params.id || req.params.projectId;
  if (!projectId) return next();

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  if (req.user.role === 'ADMIN') return next();

  const isMember = await ProjectMember.exists({
    projectId: projectId,
    userId: req.user.id,
  });

  if (!isMember) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a member of this project' } });
  }

  next();
}

module.exports = { authenticate, authorize, projectMember };
