const { Router } = require('express');
const { User, Meeting, MeetingAttendance, Announcement, ActivityLog } = require('../models');
const { authenticate, authorize, projectMember } = require('../middleware/auth');

const router = Router();

// ==================== MEETINGS ====================

// POST /projects/:id/meetings — mentor creates meeting
router.post('/:id/meetings', authenticate, authorize('MENTOR', 'ADMIN'), projectMember, async (req, res) => {
  try {
    const { startsAt, agenda } = req.body;

    if (!startsAt || !agenda) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'startsAt and agenda are required' } });
    }

    const meeting = await Meeting.create({
      projectId: req.params.id,
      mentorId: req.user.id,
      startsAt: new Date(startsAt),
      agenda,
      notes: req.body.notes || '',
    });

    await ActivityLog.create({
      projectId: req.params.id,
      actorId: req.user.id,
      actionType: 'MEETING_CREATED',
      metadataJson: { agenda },
    });

    res.status(201).json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /projects/:id/meetings
router.get('/:id/meetings', authenticate, projectMember, async (req, res) => {
  try {
    const meetings = await Meeting.find({ projectId: req.params.id }).sort({ startsAt: -1 });
    const enriched = [];

    for (const m of meetings) {
      const attendances = await MeetingAttendance.find({ meetingId: m._id });
      const attendanceList = [];
      for (const a of attendances) {
        const student = await User.findById(a.studentId);
        attendanceList.push({ studentId: a.studentId.toString(), studentName: student?.name, status: a.status });
      }
      const obj = m.toJSON();
      obj.attendance = attendanceList;
      enriched.push(obj);
    }
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /meetings/:id — update notes
router.patch('/:meetingId', authenticate, authorize('MENTOR', 'ADMIN'), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.meetingId);
    if (!meeting) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Meeting not found' } });

    if (req.user.role === 'MENTOR' && meeting.mentorId.toString() !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your meeting' } });
    }

    if (req.body.notes !== undefined) meeting.notes = req.body.notes;
    if (req.body.agenda) meeting.agenda = req.body.agenda;
    if (req.body.startsAt) meeting.startsAt = new Date(req.body.startsAt);

    await meeting.save();
    res.json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /meetings/:id/attendance — mentor marks attendance
router.patch('/:meetingId/attendance', authenticate, authorize('MENTOR', 'ADMIN'), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.meetingId);
    if (!meeting) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Meeting not found' } });

    if (req.user.role === 'MENTOR' && meeting.mentorId.toString() !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your meeting' } });
    }

    const { attendance } = req.body; // [{ studentId, status }]
    if (!Array.isArray(attendance)) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'attendance must be an array of { studentId, status }' } });
    }

    for (const record of attendance) {
      if (!['PRESENT', 'ABSENT', 'LATE'].includes(record.status)) continue;

      await MeetingAttendance.findOneAndUpdate(
        { meetingId: meeting._id, studentId: record.studentId },
        { status: record.status },
        { upsert: true, new: true }
      );
    }

    const result = await MeetingAttendance.find({ meetingId: meeting._id });
    const enriched = [];
    for (const a of result) {
      const student = await User.findById(a.studentId);
      const obj = a.toJSON();
      obj.studentName = student?.name;
      enriched.push(obj);
    }

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// ==================== ANNOUNCEMENTS ====================

// POST /projects/:id/announcements — mentor posts
router.post('/:id/announcements', authenticate, authorize('MENTOR', 'ADMIN'), projectMember, async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'title and body are required' } });
    }

    const announcement = await Announcement.create({
      projectId: req.params.id,
      mentorId: req.user.id,
      title,
      body,
    });

    res.status(201).json(announcement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /projects/:id/announcements
router.get('/:id/announcements', authenticate, projectMember, async (req, res) => {
  try {
    const announcements = await Announcement.find({ projectId: req.params.id }).sort({ createdAt: -1 });
    const enriched = [];
    for (const a of announcements) {
      const mentor = await User.findById(a.mentorId);
      const obj = a.toJSON();
      obj.mentorName = mentor?.name;
      enriched.push(obj);
    }
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
