const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { MONGO_URI } = require('../config');
const {
  User, MentorProfile, MentorRequest, Project, ProjectMember,
  Task, TaskComment, ActivityLog, Meeting, MeetingAttendance,
  Announcement, DiaryEntry, FreezeSettings,
} = require('../models');

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    MentorProfile.deleteMany({}),
    MentorRequest.deleteMany({}),
    Project.deleteMany({}),
    ProjectMember.deleteMany({}),
    Task.deleteMany({}),
    TaskComment.deleteMany({}),
    ActivityLog.deleteMany({}),
    Meeting.deleteMany({}),
    MeetingAttendance.deleteMany({}),
    Announcement.deleteMany({}),
    DiaryEntry.deleteMany({}),
    FreezeSettings.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // --- Users ---
  const admin = await User.create({
    name: 'Dr. Rajesh Kumar',
    email: 'admin@jaipur.manipal.edu',
    passwordHash: bcrypt.hashSync('Admin@123', 10),
    role: 'ADMIN',
    department: 'Computer Science',
  });

  const mentor1 = await User.create({
    name: 'Dr. Rahul Sharma',
    email: 'rahul.sharma@jaipur.manipal.edu',
    passwordHash: bcrypt.hashSync('Mentor@123', 10),
    role: 'MENTOR',
    department: 'Computer Science',
  });

  const mentor2 = await User.create({
    name: 'Dr. Priya Verma',
    email: 'priya.verma@jaipur.manipal.edu',
    passwordHash: bcrypt.hashSync('Mentor@123', 10),
    role: 'MENTOR',
    department: 'Information Technology',
  });

  const student1 = await User.create({
    name: 'Yash Sehgal',
    email: 'yash.sehgal@jaipur.manipal.edu',
    passwordHash: bcrypt.hashSync('Student@123', 10),
    role: 'STUDENT',
    department: 'Computer Science',
    semester: 5,
  });

  const student2 = await User.create({
    name: 'Ananya Gupta',
    email: 'ananya.gupta@jaipur.manipal.edu',
    passwordHash: bcrypt.hashSync('Student@123', 10),
    role: 'STUDENT',
    department: 'Computer Science',
    semester: 5,
  });

  const student3 = await User.create({
    name: 'Rohan Kumar',
    email: 'rohan.kumar@jaipur.manipal.edu',
    passwordHash: bcrypt.hashSync('Student@123', 10),
    role: 'STUDENT',
    department: 'Information Technology',
    semester: 7,
  });

  const faculty = await User.create({
    name: 'Dr. Deepak Mishra',
    email: 'deepak.mishra@jaipur.manipal.edu',
    passwordHash: bcrypt.hashSync('Faculty@123', 10),
    role: 'PBL_FACULTY',
    department: 'Computer Science',
  });

  console.log('Users created');

  // --- Mentor Profiles ---
  await MentorProfile.create([
    {
      userId: mentor1._id,
      specializationTags: ['Machine Learning', 'Web Development', 'Cloud Computing'],
      capacity: 10,
      currentLoad: 2,
      acceptingRequests: true,
    },
    {
      userId: mentor2._id,
      specializationTags: ['Data Science', 'IoT', 'Mobile Development'],
      capacity: 8,
      currentLoad: 1,
      acceptingRequests: true,
    },
  ]);
  console.log('Mentor profiles created');

  // --- Mentor Requests ---
  await MentorRequest.create({
    studentId: student3._id,
    mentorId: mentor2._id,
    status: 'PENDING',
    message: 'Interested in IoT-based smart agriculture monitoring system',
  });
  console.log('Mentor requests created');

  // --- Project ---
  const project1 = await Project.create({
    title: 'Smart Campus Navigation System',
    description: 'An AI-powered indoor navigation system for MUJ campus using BLE beacons and computer vision for real-time pathfinding.',
    mentorId: mentor1._id,
    techStack: ['React Native', 'Node.js', 'TensorFlow', 'BLE'],
    status: 'ACTIVE',
  });
  console.log('Projects created');

  // --- Project Members ---
  await ProjectMember.create([
    { projectId: project1._id, userId: mentor1._id, memberRole: 'MENTOR' },
    { projectId: project1._id, userId: student1._id, memberRole: 'STUDENT' },
    { projectId: project1._id, userId: student2._id, memberRole: 'STUDENT' },
  ]);
  console.log('Project members created');

  // --- Tasks ---
  const task1 = await Task.create({
    projectId: project1._id,
    title: 'Design system architecture diagram',
    description: 'Create a comprehensive architecture diagram showing all components and their interactions.',
    status: 'DONE',
    priority: 'HIGH',
    dueDate: new Date('2025-07-15'),
    assigneeId: student1._id,
    tags: ['documentation', 'architecture'],
  });

  const task2 = await Task.create({
    projectId: project1._id,
    title: 'Set up BLE beacon detection module',
    description: 'Implement React Native module for detecting and ranging BLE beacons within the campus.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: new Date('2025-08-01'),
    assigneeId: student1._id,
    tags: ['mobile', 'ble', 'core'],
  });

  const task3 = await Task.create({
    projectId: project1._id,
    title: 'Build REST API for indoor maps',
    description: 'Create Express API endpoints for CRUD operations on indoor map data and waypoints.',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: new Date('2025-08-10'),
    assigneeId: student2._id,
    tags: ['backend', 'api'],
  });
  console.log('Tasks created');

  // --- Task Comments ---
  await TaskComment.create([
    {
      taskId: task1._id,
      userId: mentor1._id,
      body: 'Great work on the architecture diagram. Consider adding a caching layer.',
    },
    {
      taskId: task2._id,
      userId: student1._id,
      body: 'BLE scanning works on Android. Testing on iOS next.',
    },
  ]);
  console.log('Task comments created');

  // --- Activity Logs ---
  await ActivityLog.create([
    {
      projectId: project1._id,
      actorId: student1._id,
      actionType: 'TASK_COMPLETED',
      metadataJson: { taskTitle: 'Design system architecture diagram' },
    },
    {
      projectId: project1._id,
      actorId: mentor1._id,
      actionType: 'MEETING_CREATED',
      metadataJson: { agenda: 'Sprint 1 Review' },
    },
  ]);
  console.log('Activity logs created');

  // --- Meeting ---
  const meeting1 = await Meeting.create({
    projectId: project1._id,
    mentorId: mentor1._id,
    startsAt: new Date('2025-07-12T10:00:00'),
    agenda: 'Sprint 1 Review — discuss architecture decisions and BLE module progress',
    notes: 'Architecture approved. BLE module needs calibration testing. Next sprint focus: API development.',
  });
  console.log('Meetings created');

  // --- Meeting Attendance ---
  await MeetingAttendance.create([
    { meetingId: meeting1._id, studentId: student1._id, status: 'PRESENT' },
    { meetingId: meeting1._id, studentId: student2._id, status: 'PRESENT' },
  ]);
  console.log('Meeting attendance created');

  // --- Announcements ---
  await Announcement.create({
    projectId: project1._id,
    mentorId: mentor1._id,
    title: 'Mid-sem evaluation preparation',
    body: 'Please prepare a 10-minute demo of your progress for the upcoming mid-semester evaluation. Focus on working prototypes.',
  });
  console.log('Announcements created');

  // --- Diary Entries ---
  await DiaryEntry.create([
    {
      projectId: project1._id,
      studentId: student1._id,
      date: new Date('2025-07-18'),
      workDone: 'Implemented BLE beacon scanning service. Tested with 3 beacons in lab environment. Achieved 2m accuracy.',
      hoursSpent: 4,
      blockers: 'iOS CoreBluetooth requires specific permissions flow',
      nextPlan: 'Implement iOS-specific permission handling and test beacon ranging accuracy',
      verifiedByMentorId: mentor1._id,
    },
    {
      projectId: project1._id,
      studentId: student1._id,
      date: new Date('2025-07-19'),
      workDone: 'Fixed iOS permission flow. Both platforms now scan beacons correctly. Started trilateration algorithm.',
      hoursSpent: 5,
      blockers: 'None',
      nextPlan: 'Complete trilateration and test with campus beacon layout',
      verifiedByMentorId: null,
    },
    {
      projectId: project1._id,
      studentId: student2._id,
      date: new Date('2025-07-18'),
      workDone: 'Researched indoor mapping formats. Evaluated GeoJSON and custom SVG approaches for floor plans.',
      hoursSpent: 3,
      blockers: 'Need actual floor plan SVGs from campus admin',
      nextPlan: 'Create mock floor plan data and begin API endpoint design',
      verifiedByMentorId: null,
    },
  ]);
  console.log('Diary entries created');

  // --- Freeze Settings ---
  await FreezeSettings.create({
    _id: 'freeze_settings',
    allocation: false,
    internalMarks: false,
    presentations: false,
  });
  console.log('Freeze settings created');

  console.log('\n  Seed completed successfully!');
  console.log('  ─────────────────────────────────────────────────');
  console.log('  Test Accounts:');
  console.log('  Admin:   admin@jaipur.manipal.edu       / Admin@123');
  console.log('  Mentor:  rahul.sharma@jaipur.manipal.edu / Mentor@123');
  console.log('  Student: yash.sehgal@jaipur.manipal.edu  / Student@123');
  console.log('  Faculty: deepak.mishra@jaipur.manipal.edu/ Faculty@123');
  console.log('  ─────────────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
