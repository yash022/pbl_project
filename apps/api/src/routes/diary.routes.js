const { Router } = require('express');
const { User, DiaryEntry, ProjectMember, ActivityLog } = require('../models');
const { authenticate, authorize, projectMember } = require('../middleware/auth');

const router = Router();

// POST /projects/:id/diary — student submits daily diary
router.post('/:id/diary', authenticate, authorize('STUDENT'), projectMember, async (req, res) => {
  try {
    const { date, workDone, hoursSpent, blockers, nextPlan } = req.body;

    if (!workDone) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'workDone is required' } });
    }

    const entryDate = date ? new Date(date) : new Date();

    // Check if already submitted for this date
    const startOfDay = new Date(entryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(entryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await DiaryEntry.findOne({
      projectId: req.params.id,
      studentId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Diary entry already exists for this date' } });
    }

    const entry = await DiaryEntry.create({
      projectId: req.params.id,
      studentId: req.user.id,
      date: entryDate,
      workDone,
      hoursSpent: hoursSpent || 0,
      blockers: blockers || '',
      nextPlan: nextPlan || '',
      verifiedByMentorId: null,
    });

    await ActivityLog.create({
      projectId: req.params.id,
      actorId: req.user.id,
      actionType: 'DIARY_SUBMITTED',
      metadataJson: { date: entryDate.toISOString().split('T')[0] },
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /projects/:id/diary
router.get('/:id/diary', authenticate, projectMember, async (req, res) => {
  try {
    const filter = { projectId: req.params.id };

    // Students can only see their own
    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.id;
    }

    // Filter by student if query param
    if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }

    const entries = await DiaryEntry.find(filter).sort({ date: -1 });

    const enriched = [];
    for (const d of entries) {
      const student = await User.findById(d.studentId);
      const verifier = d.verifiedByMentorId ? await User.findById(d.verifiedByMentorId) : null;
      const obj = d.toJSON();
      obj.studentName = student?.name;
      obj.verifiedByMentorName = verifier?.name || null;
      enriched.push(obj);
    }

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /diary/:id/verify — mentor verifies diary entry
router.patch('/verify/:id', authenticate, authorize('MENTOR', 'ADMIN'), async (req, res) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Diary entry not found' } });

    // IDOR: mentor must be project member
    if (req.user.role === 'MENTOR') {
      const isMember = await ProjectMember.exists({
        projectId: entry.projectId,
        userId: req.user.id,
      });
      if (!isMember) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not the mentor for this project' } });
      }
    }

    entry.verifiedByMentorId = req.user.id;
    await entry.save();
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
