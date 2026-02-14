const { Router } = require('express');
const { User, Project, ProjectMember, InternalEvaluation, ActivityLog, FreezeSettings } = require('../models');
const { authenticate, authorize, projectMember } = require('../middleware/auth');

const router = Router();

// POST /projects/:id/internal-evaluations — mentor enters internal marks
router.post('/:id/internal-evaluations', authenticate, authorize('MENTOR', 'ADMIN'), projectMember, async (req, res) => {
  try {
    const { studentId, criteria, totalScore, remarks } = req.body;

    const freezeSettings = await FreezeSettings.getSettings();
    if (freezeSettings.internalMarks) {
      return res.status(403).json({ error: { code: 'FROZEN', message: 'Internal marks entry is currently frozen' } });
    }

    if (!studentId || totalScore === undefined) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'studentId and totalScore are required' } });
    }

    // Check student is a member of the project
    const isMember = await ProjectMember.exists({
      projectId: req.params.id,
      userId: studentId,
      memberRole: 'STUDENT',
    });
    if (!isMember) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'Student is not a member of this project' } });
    }

    // Check if already evaluated
    const existing = await InternalEvaluation.findOne({
      projectId: req.params.id,
      studentId,
      mentorId: req.user.id,
    });

    if (existing) {
      // Update existing
      if (criteria) existing.criteriaJson = criteria;
      existing.totalScore = totalScore;
      if (remarks) existing.remarks = remarks;
      await existing.save();
      return res.json(existing);
    }

    const evaluation = await InternalEvaluation.create({
      projectId: req.params.id,
      studentId,
      mentorId: req.user.id,
      criteriaJson: criteria || {
        attendance: 0,
        diaryConsistency: 0,
        progressShown: 0,
        contribution: 0,
      },
      totalScore,
      remarks: remarks || '',
      locked: false,
    });

    await ActivityLog.create({
      projectId: req.params.id,
      actorId: req.user.id,
      actionType: 'INTERNAL_EVALUATION',
      metadataJson: { studentId, totalScore },
    });

    res.status(201).json(evaluation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /projects/:id/internal-evaluations
router.get('/:id/internal-evaluations', authenticate, projectMember, async (req, res) => {
  try {
    const filter = { projectId: req.params.id };

    // Students can only see their own
    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.id;
    }

    const evals = await InternalEvaluation.find(filter);

    const enriched = [];
    for (const e of evals) {
      const student = await User.findById(e.studentId);
      const mentor = await User.findById(e.mentorId);
      const obj = e.toJSON();
      obj.studentName = student?.name;
      obj.mentorName = mentor?.name;
      enriched.push(obj);
    }

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /internal-evaluations/:id/lock — admin locks/unlocks evaluation
router.patch('/lock/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const evaluation = await InternalEvaluation.findById(req.params.id);
    if (!evaluation) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Evaluation not found' } });

    evaluation.locked = req.body.locked !== false;
    await evaluation.save();
    res.json(evaluation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
