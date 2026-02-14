const { Router } = require('express');
const { User, Project, ProjectMember, Task, TaskComment, ActivityLog } = require('../models');
const { authenticate, authorize, projectMember } = require('../middleware/auth');

const router = Router();

// GET /projects — role-based project listing
router.get('/', authenticate, async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'ADMIN' || req.user.role === 'PBL_FACULTY') {
      projects = await Project.find({});
    } else {
      const myMemberships = await ProjectMember.find({ userId: req.user.id });
      const myProjectIds = myMemberships.map((pm) => pm.projectId);
      projects = await Project.find({ _id: { $in: myProjectIds } });
    }

    const enriched = [];
    for (const p of projects) {
      const mentor = await User.findById(p.mentorId);
      const members = await ProjectMember.find({ projectId: p._id });
      const memberList = [];
      for (const pm of members) {
        const u = await User.findById(pm.userId);
        memberList.push({ userId: pm.userId.toString(), name: u?.name, role: pm.memberRole });
      }
      const taskCount = await Task.countDocuments({ projectId: p._id });
      const obj = p.toJSON();
      obj.mentorName = mentor?.name;
      obj.members = memberList;
      obj.taskCount = taskCount;
      enriched.push(obj);
    }

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /projects/ideas — browse all project ideas (for students)
router.get('/ideas', authenticate, async (req, res) => {
  try {
    const ideas = await Project.find({ status: { $in: ['IDEA', 'ACTIVE'] } });

    const enriched = [];
    for (const p of ideas) {
      const mentor = await User.findById(p.mentorId);
      const members = await ProjectMember.find({ projectId: p._id });
      const studentCount = members.filter((m) => m.memberRole === 'STUDENT').length;
      const memberList = [];
      for (const pm of members) {
        const u = await User.findById(pm.userId);
        memberList.push({ userId: pm.userId.toString(), name: u?.name, role: pm.memberRole });
      }
      const obj = p.toJSON();
      obj.mentorName = mentor?.name;
      obj.mentorEmail = mentor?.email;
      obj.members = memberList;
      obj.studentCount = studentCount;
      obj.slotsAvailable = (p.maxTeamSize || 4) - studentCount;
      enriched.push(obj);
    }

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /projects/available-students — list students not in any project (for mentor to assign)
router.get('/available-students', authenticate, authorize('MENTOR', 'ADMIN'), async (req, res) => {
  try {
    const allStudents = await User.find({ role: 'STUDENT' });
    const assignedMembers = await ProjectMember.find({ memberRole: 'STUDENT' });
    const assignedIds = new Set(assignedMembers.map((m) => m.userId.toString()));

    const available = allStudents
      .filter((s) => !assignedIds.has(s._id.toString()))
      .map((s) => ({ id: s.id, name: s.name, email: s.email, department: s.department, semester: s.semester }));

    res.json(available);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /projects/:id
router.get('/:id', authenticate, projectMember, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });

    const mentor = await User.findById(project.mentorId);
    const members = await ProjectMember.find({ projectId: project._id });
    const memberList = [];
    for (const pm of members) {
      const u = await User.findById(pm.userId);
      memberList.push({ userId: pm.userId.toString(), name: u?.name, email: u?.email, role: pm.memberRole });
    }
    const tasks = await Task.find({ projectId: project._id });

    const obj = project.toJSON();
    obj.mentorName = mentor?.name;
    obj.members = memberList;
    obj.tasks = tasks;

    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /projects — mentor creates a project idea
router.post('/', authenticate, authorize('ADMIN', 'MENTOR'), async (req, res) => {
  try {
    const { title, description, mentorId, techStack, maxTeamSize } = req.body;

    if (!title) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Title is required' } });

    const project = await Project.create({
      title,
      description: description || '',
      mentorId: mentorId || req.user.id,
      techStack: techStack || [],
      maxTeamSize: maxTeamSize || 4,
      status: 'IDEA',
    });

    await ProjectMember.create({ projectId: project._id, userId: project.mentorId, memberRole: 'MENTOR' });

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /projects/:id/add-student — mentor adds a student to project
router.post('/:id/add-student', authenticate, authorize('MENTOR', 'ADMIN'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });

    if (req.user.role === 'MENTOR' && project.mentorId.toString() !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your project' } });
    }

    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: { code: 'VALIDATION', message: 'studentId is required' } });

    const student = await User.findOne({ _id: studentId, role: 'STUDENT' });
    if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found' } });

    // Check if student already in this project
    const existing = await ProjectMember.findOne({ projectId: project._id, userId: studentId });
    if (existing) return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Student already in this project' } });

    // Check max team size
    const currentStudents = await ProjectMember.countDocuments({ projectId: project._id, memberRole: 'STUDENT' });
    if (currentStudents >= (project.maxTeamSize || 4)) {
      return res.status(400).json({ error: { code: 'TEAM_FULL', message: 'Project team is full' } });
    }

    await ProjectMember.create({ projectId: project._id, userId: studentId, memberRole: 'STUDENT' });

    // Activate project if it was just an idea
    if (project.status === 'IDEA') {
      project.status = 'ACTIVE';
      await project.save();
    }

    await ActivityLog.create({
      projectId: project._id,
      actorId: req.user.id,
      actionType: 'STUDENT_ADDED',
      metadataJson: { studentId, studentName: student.name },
    });

    res.json({ message: `${student.name} added to project` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// DELETE /projects/:id/remove-student/:studentId — mentor removes student
router.delete('/:id/remove-student/:studentId', authenticate, authorize('MENTOR', 'ADMIN'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });

    if (req.user.role === 'MENTOR' && project.mentorId.toString() !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your project' } });
    }

    const removed = await ProjectMember.findOneAndDelete({ projectId: project._id, userId: req.params.studentId, memberRole: 'STUDENT' });
    if (!removed) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not in this project' } });

    const student = await User.findById(req.params.studentId);

    await ActivityLog.create({
      projectId: project._id,
      actorId: req.user.id,
      actionType: 'STUDENT_REMOVED',
      metadataJson: { studentId: req.params.studentId, studentName: student?.name },
    });

    res.json({ message: 'Student removed from project' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /projects/:id
router.patch('/:id', authenticate, projectMember, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });

    if (req.user.role !== 'ADMIN' && req.user.role !== 'MENTOR') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only mentors and admins can update project details' } });
    }

    if (req.body.title) project.title = req.body.title;
    if (req.body.description) project.description = req.body.description;
    if (req.body.techStack) project.techStack = req.body.techStack;
    if (req.body.status) project.status = req.body.status;

    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// ==================== TASKS ====================

// POST /projects/:id/tasks
router.post('/:id/tasks', authenticate, projectMember, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId, tags } = req.body;

    if (!title) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Task title is required' } });

    const task = await Task.create({
      projectId: req.params.id,
      title,
      description: description || '',
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId || null,
      tags: tags || [],
    });

    await ActivityLog.create({
      projectId: req.params.id,
      actorId: req.user.id,
      actionType: 'TASK_CREATED',
      metadataJson: { taskTitle: title },
    });

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /projects/:id/tasks
router.get('/:id/tasks', authenticate, projectMember, async (req, res) => {
  try {
    const filter = { projectId: req.params.id };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assigneeId) filter.assigneeId = req.query.assigneeId;

    let tasks = await Task.find(filter);

    if (req.query.search) {
      const s = req.query.search.toLowerCase();
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s));
    }

    // Enrich with assignee name
    const enriched = [];
    for (const t of tasks) {
      const assignee = t.assigneeId ? await User.findById(t.assigneeId) : null;
      const obj = t.toJSON();
      obj.assigneeName = assignee?.name || null;
      enriched.push(obj);
    }

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /tasks/:taskId
router.patch('/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });

    // IDOR check: must be project member
    const isMember = await ProjectMember.exists({ projectId: task.projectId, userId: req.user.id });
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a member of this project' } });
    }

    // Students can only update status of tasks assigned to them
    if (req.user.role === 'STUDENT') {
      if (task.assigneeId?.toString() !== req.user.id) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Can only update your assigned tasks' } });
      }
      if (req.body.status) task.status = req.body.status;
    } else {
      if (req.body.title) task.title = req.body.title;
      if (req.body.description !== undefined) task.description = req.body.description;
      if (req.body.status) task.status = req.body.status;
      if (req.body.priority) task.priority = req.body.priority;
      if (req.body.dueDate) task.dueDate = new Date(req.body.dueDate);
      if (req.body.assigneeId !== undefined) task.assigneeId = req.body.assigneeId;
      if (req.body.tags) task.tags = req.body.tags;
    }

    await task.save();

    await ActivityLog.create({
      projectId: task.projectId,
      actorId: req.user.id,
      actionType: 'TASK_UPDATED',
      metadataJson: { taskTitle: task.title, changes: req.body },
    });

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// ==================== TASK COMMENTS ====================

// POST /tasks/:taskId/comments
router.post('/tasks/:taskId/comments', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });

    const isMember = await ProjectMember.exists({ projectId: task.projectId, userId: req.user.id });
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a project member' } });
    }

    if (!req.body.body) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Comment body is required' } });

    const comment = await TaskComment.create({
      taskId: task._id,
      userId: req.user.id,
      body: req.body.body,
    });

    const obj = comment.toJSON();
    obj.userName = req.user.name;
    res.status(201).json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /tasks/:taskId/comments
router.get('/tasks/:taskId/comments', authenticate, async (req, res) => {
  try {
    const comments = await TaskComment.find({ taskId: req.params.taskId });
    const enriched = [];
    for (const c of comments) {
      const user = await User.findById(c.userId);
      const obj = c.toJSON();
      obj.userName = user?.name;
      enriched.push(obj);
    }
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// ==================== ACTIVITY LOG ====================

// GET /projects/:id/activity
router.get('/:id/activity', authenticate, projectMember, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ projectId: req.params.id }).sort({ createdAt: -1 });
    const enriched = [];
    for (const l of logs) {
      const actor = await User.findById(l.actorId);
      const obj = l.toJSON();
      obj.actorName = actor?.name;
      enriched.push(obj);
    }
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
