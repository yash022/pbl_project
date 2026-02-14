const { Router } = require('express');
const { User, MentorProfile, MentorRequest, Project, ProjectMember, ActivityLog, FreezeSettings } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

// GET /mentors — list mentors with profiles
router.get('/', authenticate, async (req, res) => {
  try {
    const mentors = await User.find({ role: 'MENTOR' });
    const result = [];

    for (const u of mentors) {
      const profile = await MentorProfile.findOne({ userId: u._id });
      result.push({
        id: u.id,
        name: u.name,
        email: u.email,
        department: u.department,
        specialization: profile?.specializationTags || [],
        capacity: profile?.capacity || 0,
        currentLoad: profile?.currentLoad || 0,
        acceptingRequests: profile?.acceptingRequests || false,
        remainingSlots: (profile?.capacity || 0) - (profile?.currentLoad || 0),
      });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /mentor-requests — student sends request to mentor
router.post('/requests', authenticate, authorize('STUDENT'), async (req, res) => {
  try {
    const { mentorId, message } = req.body;

    if (!mentorId) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'mentorId is required' } });
    }

    const freezeSettings = await FreezeSettings.getSettings();
    if (freezeSettings.allocation) {
      return res.status(403).json({ error: { code: 'FROZEN', message: 'Mentor allocation is currently frozen' } });
    }

    // Check mentor exists
    const mentor = await User.findOne({ _id: mentorId, role: 'MENTOR' });
    if (!mentor) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mentor not found' } });

    // Check mentor profile & capacity
    const profile = await MentorProfile.findOne({ userId: mentorId });
    if (!profile || !profile.acceptingRequests) {
      return res.status(400).json({ error: { code: 'NOT_ACCEPTING', message: 'Mentor is not accepting requests' } });
    }

    if (profile.currentLoad >= profile.capacity) {
      return res.status(400).json({ error: { code: 'CAPACITY_FULL', message: 'Mentor has reached full capacity' } });
    }

    // Check student already has accepted mentor
    const alreadyAccepted = await MentorRequest.findOne({ studentId: req.user.id, status: 'ACCEPTED' });
    if (alreadyAccepted) {
      return res.status(400).json({ error: { code: 'ALREADY_ALLOCATED', message: 'You already have a mentor assigned' } });
    }

    // Check max 3 pending requests
    const pendingCount = await MentorRequest.countDocuments({ studentId: req.user.id, status: 'PENDING' });
    if (pendingCount >= 3) {
      return res.status(400).json({ error: { code: 'MAX_PENDING', message: 'Maximum 3 pending requests allowed' } });
    }

    // Check duplicate pending request to same mentor
    const duplicate = await MentorRequest.findOne({ studentId: req.user.id, mentorId, status: 'PENDING' });
    if (duplicate) {
      return res.status(409).json({ error: { code: 'DUPLICATE', message: 'You already have a pending request to this mentor' } });
    }

    const request = await MentorRequest.create({
      studentId: req.user.id,
      mentorId,
      status: 'PENDING',
      message: message || '',
    });

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /mentor-requests — mentor sees incoming, student sees own
router.get('/requests', authenticate, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'MENTOR') {
      filter = { mentorId: req.user.id };
    } else if (req.user.role === 'STUDENT') {
      filter = { studentId: req.user.id };
    } else if (req.user.role === 'ADMIN') {
      filter = {};
    } else {
      return res.json([]);
    }

    const requests = await MentorRequest.find(filter);

    // Enrich with user names
    const enriched = [];
    for (const r of requests) {
      const student = await User.findById(r.studentId);
      const mentor = await User.findById(r.mentorId);
      const obj = r.toJSON();
      obj.studentName = student?.name;
      obj.studentEmail = student?.email;
      obj.mentorName = mentor?.name;
      obj.mentorEmail = mentor?.email;
      enriched.push(obj);
    }

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /mentor-requests/:id — accept/reject/withdraw
router.patch('/requests/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await MentorRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Request not found' } });

    const freezeSettings = await FreezeSettings.getSettings();
    if (freezeSettings.allocation) {
      return res.status(403).json({ error: { code: 'FROZEN', message: 'Allocation is frozen' } });
    }

    // Mentor can ACCEPT or REJECT
    if (req.user.role === 'MENTOR') {
      if (request.mentorId.toString() !== req.user.id) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your request' } });
      }
      if (!['ACCEPTED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'Status must be ACCEPTED or REJECTED' } });
      }
      if (request.status !== 'PENDING') {
        return res.status(400).json({ error: { code: 'INVALID_STATE', message: 'Request is no longer pending' } });
      }

      request.status = status;
      await request.save();

      if (status === 'ACCEPTED') {
        // Update mentor load
        await MentorProfile.findOneAndUpdate({ userId: req.user.id }, { $inc: { currentLoad: 1 } });

        // Reject all other pending requests from this student
        await MentorRequest.updateMany(
          { studentId: request.studentId, status: 'PENDING', _id: { $ne: request._id } },
          { status: 'REJECTED' }
        );

        // Create project
        const student = await User.findById(request.studentId);
        const project = await Project.create({
          title: `Project — ${student?.name || 'Student'}`,
          description: request.message || 'To be defined',
          mentorId: req.user.id,
          techStack: [],
          status: 'ACTIVE',
        });

        await ProjectMember.create([
          { projectId: project._id, userId: req.user.id, memberRole: 'MENTOR' },
          { projectId: project._id, userId: request.studentId, memberRole: 'STUDENT' },
        ]);

        await ActivityLog.create({
          projectId: project._id,
          actorId: req.user.id,
          actionType: 'MENTOR_ACCEPTED',
          metadataJson: { studentId: request.studentId },
        });
      }
    }
    // Student can WITHDRAW
    else if (req.user.role === 'STUDENT') {
      if (request.studentId.toString() !== req.user.id) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your request' } });
      }
      if (status !== 'WITHDRAWN') {
        return res.status(400).json({ error: { code: 'VALIDATION', message: 'Students can only WITHDRAW' } });
      }
      if (request.status !== 'PENDING') {
        return res.status(400).json({ error: { code: 'INVALID_STATE', message: 'Request is no longer pending' } });
      }
      request.status = 'WITHDRAWN';
      await request.save();
    } else {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only mentors and students can update requests' } });
    }

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
