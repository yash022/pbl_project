const { Router } = require('express');
const { User, MentorProfile, Project, ProjectMember, InternalEvaluation, PresentationEvaluation, PresentationSlot, PresentationEvent, FreezeSettings } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// GET /admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['STUDENT', 'MENTOR', 'PBL_FACULTY', 'ADMIN'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: `Role must be one of: ${validRoles.join(', ')}` } });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // If promoted to MENTOR, create mentor profile if not exists
    if (role === 'MENTOR') {
      const existing = await MentorProfile.findOne({ userId: user._id });
      if (!existing) {
        await MentorProfile.create({
          userId: user._id,
          specializationTags: [],
          capacity: 10,
          currentLoad: 0,
          acceptingRequests: true,
        });
      }
    }

    res.json({ message: `Role updated from ${oldRole} to ${role}`, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /admin/mentor-profiles/:id
router.patch('/mentor-profiles/:id', async (req, res) => {
  try {
    const profile = await MentorProfile.findOne({ userId: req.params.id });
    if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mentor profile not found' } });

    if (req.body.capacity !== undefined) profile.capacity = req.body.capacity;
    if (req.body.acceptingRequests !== undefined) profile.acceptingRequests = req.body.acceptingRequests;
    if (req.body.specializationTags) profile.specializationTags = req.body.specializationTags;

    await profile.save();
    res.json({ message: 'Mentor profile updated', profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /admin/freeze  (legacy: { target, frozen })
router.post('/freeze', async (req, res) => {
  try {
    const { target, frozen } = req.body;
    const validTargets = ['allocation', 'internalMarks', 'presentations'];

    if (!target || !validTargets.includes(target)) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: `Target must be one of: ${validTargets.join(', ')}` } });
    }

    const settings = await FreezeSettings.getSettings();
    settings[target] = frozen !== false;
    await settings.save();

    res.json({ message: `${target} freeze set to ${settings[target]}`, freezeSettings: settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /admin/freeze  (toggle: { allocation: true/false, ... })
router.patch('/freeze', async (req, res) => {
  try {
    const validTargets = ['allocation', 'internalMarks', 'presentations'];
    const settings = await FreezeSettings.getSettings();

    for (const key of validTargets) {
      if (key in req.body) {
        settings[key] = !!req.body[key];
      }
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /admin/freeze-settings
router.get('/freeze-settings', async (req, res) => {
  try {
    const settings = await FreezeSettings.getSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /admin/exports/allocation
router.get('/exports/allocation', async (req, res) => {
  try {
    const projects = await Project.find({});
    const data = [];

    for (const p of projects) {
      const mentor = await User.findById(p.mentorId);
      const members = await ProjectMember.find({ projectId: p._id, memberRole: 'STUDENT' });
      const students = [];
      for (const pm of members) {
        const student = await User.findById(pm.userId);
        students.push({ name: student?.name, email: student?.email, semester: student?.semester });
      }
      data.push({
        projectTitle: p.title,
        mentorName: mentor?.name,
        mentorEmail: mentor?.email,
        students,
        status: p.status,
      });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /admin/exports/internal-marks
router.get('/exports/internal-marks', async (req, res) => {
  try {
    const evals = await InternalEvaluation.find({});
    const data = [];

    for (const ev of evals) {
      const student = await User.findById(ev.studentId);
      const mentor = await User.findById(ev.mentorId);
      const project = await Project.findById(ev.projectId);
      data.push({
        studentName: student?.name,
        studentEmail: student?.email,
        mentorName: mentor?.name,
        projectTitle: project?.title,
        criteria: ev.criteriaJson,
        totalScore: ev.totalScore,
        remarks: ev.remarks,
        locked: ev.locked,
      });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /admin/exports/presentation-marks
router.get('/exports/presentation-marks', async (req, res) => {
  try {
    const evals = await PresentationEvaluation.find({});
    const data = [];

    for (const ev of evals) {
      const slot = await PresentationSlot.findById(ev.slotId);
      const event = slot ? await PresentationEvent.findById(slot.eventId) : null;
      const evaluator = await User.findById(ev.evaluatorId);
      const project = slot?.projectId ? await Project.findById(slot.projectId) : null;
      data.push({
        eventTitle: event?.title,
        eventType: event?.type,
        evaluatorName: evaluator?.name,
        projectTitle: project?.title,
        slotTime: slot?.startTime,
        attendance: ev.attendance,
        rubric: ev.rubricJson,
        totalScore: ev.totalScore,
        feedback: ev.feedback,
      });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /admin/exports/final-report
router.get('/exports/final-report', async (req, res) => {
  try {
    const projects = await Project.find({});
    const report = [];

    for (const p of projects) {
      const mentor = await User.findById(p.mentorId);
      const members = await ProjectMember.find({ projectId: p._id, memberRole: 'STUDENT' });
      const students = [];

      for (const pm of members) {
        const student = await User.findById(pm.userId);
        const internalEval = await InternalEvaluation.findOne({ projectId: p._id, studentId: pm.userId });
        const slots = await PresentationSlot.find({ projectId: p._id });
        const slotIds = slots.map((s) => s._id);
        const presEvals = await PresentationEvaluation.find({ slotId: { $in: slotIds } });

        students.push({
          name: student?.name,
          email: student?.email,
          internalScore: internalEval?.totalScore || null,
          presentationScores: presEvals.map((pe) => pe.totalScore),
        });
      }

      report.push({
        projectTitle: p.title,
        mentorName: mentor?.name,
        status: p.status,
        students,
      });
    }
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
