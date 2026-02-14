const { Router } = require('express');
const { User, Project, ProjectMember, PresentationEvent, PresentationSlot, PresentationEvaluation, FreezeSettings } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

// POST /presentations/events — PBL Faculty creates event
router.post('/events', authenticate, authorize('PBL_FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { type, title, startDate, endDate, durationMinutes } = req.body;

    if (!type || !title || !startDate) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'type, title, and startDate are required' } });
    }

    if (!['MID_SEM', 'END_SEM'].includes(type)) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'type must be MID_SEM or END_SEM' } });
    }

    const event = await PresentationEvent.create({
      type,
      title,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : new Date(startDate),
      durationMinutes: durationMinutes || 15,
      createdById: req.user.id,
      locked: false,
    });

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /presentations/events
router.get('/events', authenticate, async (req, res) => {
  try {
    const events = await PresentationEvent.find({});
    const enriched = [];

    for (const e of events) {
      const creator = await User.findById(e.createdById);
      const slotCount = await PresentationSlot.countDocuments({ eventId: e._id });
      const obj = e.toJSON();
      obj.createdByName = creator?.name;
      obj.slotCount = slotCount;
      enriched.push(obj);
    }
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /presentations/events/:id
router.get('/events/:id', authenticate, async (req, res) => {
  try {
    const event = await PresentationEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } });

    const slots = await PresentationSlot.find({ eventId: event._id }).sort({ startTime: 1 });
    const enrichedSlots = [];

    for (const s of slots) {
      const project = s.projectId ? await Project.findById(s.projectId) : null;
      const student = s.studentId ? await User.findById(s.studentId) : null;
      const evaluations = await PresentationEvaluation.find({ slotId: s._id });

      const evalList = [];
      for (const pe of evaluations) {
        const evaluator = await User.findById(pe.evaluatorId);
        const peObj = pe.toJSON();
        peObj.evaluatorName = evaluator?.name;
        evalList.push(peObj);
      }

      const sObj = s.toJSON();
      sObj.projectTitle = project?.title || null;
      sObj.studentName = student?.name || null;
      sObj.evaluations = evalList;
      enrichedSlots.push(sObj);
    }

    const obj = event.toJSON();
    obj.slots = enrichedSlots;
    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /presentations/events/:id/slots/generate — generate time slots
router.post('/events/:id/slots/generate', authenticate, authorize('PBL_FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const event = await PresentationEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } });

    const { startTime, endTime, venue, count } = req.body;

    if (!startTime) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'startTime is required' } });
    }

    const slotsToGenerate = count || 10;
    const duration = event.durationMinutes;
    const slotsData = [];
    let currentStart = new Date(startTime);

    for (let i = 0; i < slotsToGenerate; i++) {
      const slotEnd = new Date(currentStart.getTime() + duration * 60 * 1000);

      if (endTime && slotEnd > new Date(endTime)) break;

      slotsData.push({
        eventId: event._id,
        startTime: new Date(currentStart),
        endTime: slotEnd,
        venue: venue || 'TBD',
        assignedToType: 'TEAM',
        projectId: null,
        studentId: null,
      });

      currentStart = slotEnd;
    }

    const slots = await PresentationSlot.insertMany(slotsData);
    res.status(201).json({ generated: slots.length, slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /presentations/slots/:id/assign — assign project/student to slot
router.patch('/slots/:id/assign', authenticate, authorize('PBL_FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const slot = await PresentationSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Slot not found' } });

    const event = await PresentationEvent.findById(slot.eventId);
    if (event?.locked) {
      return res.status(403).json({ error: { code: 'FROZEN', message: 'Event is locked' } });
    }

    if (req.body.projectId !== undefined) {
      slot.projectId = req.body.projectId;
      slot.assignedToType = 'TEAM';
    }
    if (req.body.studentId !== undefined) {
      slot.studentId = req.body.studentId;
      slot.assignedToType = 'STUDENT';
    }
    if (req.body.venue) slot.venue = req.body.venue;

    await slot.save();
    res.json(slot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /presentations/my-slot — student sees their assigned slot
router.get('/my-slot', authenticate, async (req, res) => {
  try {
    // Find slots assigned to student directly or via project
    const myMemberships = await ProjectMember.find({ userId: req.user.id });
    const myProjectIds = myMemberships.map((pm) => pm.projectId);

    const slots = await PresentationSlot.find({
      $or: [
        { studentId: req.user.id },
        { projectId: { $in: myProjectIds } },
      ],
    });

    const enriched = [];
    for (const s of slots) {
      const event = await PresentationEvent.findById(s.eventId);
      const project = s.projectId ? await Project.findById(s.projectId) : null;
      const obj = s.toJSON();
      obj.eventTitle = event?.title;
      obj.eventType = event?.type;
      obj.projectTitle = project?.title;
      enriched.push(obj);
    }

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /presentations/slots/:id/evaluation — evaluator records marks
router.post('/slots/:id/evaluation', authenticate, authorize('PBL_FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const slot = await PresentationSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Slot not found' } });

    const freezeSettings = await FreezeSettings.getSettings();
    if (freezeSettings.presentations) {
      return res.status(403).json({ error: { code: 'FROZEN', message: 'Presentation marks are frozen' } });
    }

    const { attendance, rubric, totalScore, feedback } = req.body;

    if (totalScore === undefined) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'totalScore is required' } });
    }

    const evaluation = await PresentationEvaluation.create({
      slotId: slot._id,
      evaluatorId: req.user.id,
      attendance: attendance || 'PRESENT',
      rubricJson: rubric || {},
      totalScore,
      feedback: feedback || '',
    });

    res.status(201).json(evaluation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /presentations/events/:id/lock — admin locks event
router.patch('/events/:id/lock', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const event = await PresentationEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Event not found' } });

    event.locked = req.body.locked !== false;
    await event.save();
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
