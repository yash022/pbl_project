const crypto = require('crypto');
const bcrypt = require('bcrypt');

const id = () => crypto.randomUUID();

function createStore() {
  const now = new Date();

  // --- User IDs ---
  const adminId = id();
  const mentor1Id = id();
  const mentor2Id = id();
  const student1Id = id();
  const student2Id = id();
  const student3Id = id();
  const facultyId = id();

  // --- Project & related IDs ---
  const project1Id = id();
  const task1Id = id();
  const task2Id = id();
  const task3Id = id();
  const meeting1Id = id();
  const announcement1Id = id();
  const diary1Id = id();

  const store = {
    // ==================== USERS ====================
    users: [
      {
        id: adminId,
        name: 'Dr. Rajesh Kumar',
        email: 'admin@jaipur.manipal.edu',
        passwordHash: bcrypt.hashSync('Admin@123', 10),
        role: 'ADMIN',
        department: 'Computer Science',
        semester: null,
        createdAt: new Date('2025-01-01'),
      },
      {
        id: mentor1Id,
        name: 'Dr. Rahul Sharma',
        email: 'rahul.sharma@jaipur.manipal.edu',
        passwordHash: bcrypt.hashSync('Mentor@123', 10),
        role: 'MENTOR',
        department: 'Computer Science',
        semester: null,
        createdAt: new Date('2025-01-05'),
      },
      {
        id: mentor2Id,
        name: 'Dr. Priya Verma',
        email: 'priya.verma@jaipur.manipal.edu',
        passwordHash: bcrypt.hashSync('Mentor@123', 10),
        role: 'MENTOR',
        department: 'Information Technology',
        semester: null,
        createdAt: new Date('2025-01-05'),
      },
      {
        id: student1Id,
        name: 'Yash Sehgal',
        email: 'yash.sehgal@jaipur.manipal.edu',
        passwordHash: bcrypt.hashSync('Student@123', 10),
        role: 'STUDENT',
        department: 'Computer Science',
        semester: 5,
        createdAt: new Date('2025-06-01'),
      },
      {
        id: student2Id,
        name: 'Ananya Gupta',
        email: 'ananya.gupta@jaipur.manipal.edu',
        passwordHash: bcrypt.hashSync('Student@123', 10),
        role: 'STUDENT',
        department: 'Computer Science',
        semester: 5,
        createdAt: new Date('2025-06-01'),
      },
      {
        id: student3Id,
        name: 'Rohan Kumar',
        email: 'rohan.kumar@jaipur.manipal.edu',
        passwordHash: bcrypt.hashSync('Student@123', 10),
        role: 'STUDENT',
        department: 'Information Technology',
        semester: 7,
        createdAt: new Date('2025-06-01'),
      },
      {
        id: facultyId,
        name: 'Dr. Deepak Mishra',
        email: 'deepak.mishra@jaipur.manipal.edu',
        passwordHash: bcrypt.hashSync('Faculty@123', 10),
        role: 'PBL_FACULTY',
        department: 'Computer Science',
        semester: null,
        createdAt: new Date('2025-01-10'),
      },
    ],

    // ==================== MENTOR PROFILES ====================
    mentorProfiles: [
      {
        userId: mentor1Id,
        specializationTags: ['Machine Learning', 'Web Development', 'Cloud Computing'],
        capacity: 10,
        currentLoad: 2,
        acceptingRequests: true,
      },
      {
        userId: mentor2Id,
        specializationTags: ['Data Science', 'IoT', 'Mobile Development'],
        capacity: 8,
        currentLoad: 1,
        acceptingRequests: true,
      },
    ],

    // ==================== MENTOR REQUESTS ====================
    mentorRequests: [
      {
        id: id(),
        studentId: student3Id,
        mentorId: mentor2Id,
        status: 'PENDING',
        message: 'Interested in IoT-based smart agriculture monitoring system',
        createdAt: new Date('2025-07-10'),
      },
    ],

    // ==================== PROJECTS ====================
    projects: [
      {
        id: project1Id,
        title: 'Smart Campus Navigation System',
        description: 'An AI-powered indoor navigation system for MUJ campus using BLE beacons and computer vision for real-time pathfinding.',
        mentorId: mentor1Id,
        techStack: ['React Native', 'Node.js', 'TensorFlow', 'BLE'],
        status: 'ACTIVE',
        createdAt: new Date('2025-07-01'),
      },
    ],

    // ==================== PROJECT MEMBERS ====================
    projectMembers: [
      { projectId: project1Id, userId: mentor1Id, memberRole: 'MENTOR' },
      { projectId: project1Id, userId: student1Id, memberRole: 'STUDENT' },
      { projectId: project1Id, userId: student2Id, memberRole: 'STUDENT' },
    ],

    // ==================== TASKS ====================
    tasks: [
      {
        id: task1Id,
        projectId: project1Id,
        title: 'Design system architecture diagram',
        description: 'Create a comprehensive architecture diagram showing all components and their interactions.',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: new Date('2025-07-15'),
        assigneeId: student1Id,
        tags: ['documentation', 'architecture'],
        createdAt: new Date('2025-07-02'),
        updatedAt: new Date('2025-07-14'),
      },
      {
        id: task2Id,
        projectId: project1Id,
        title: 'Set up BLE beacon detection module',
        description: 'Implement React Native module for detecting and ranging BLE beacons within the campus.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2025-08-01'),
        assigneeId: student1Id,
        tags: ['mobile', 'ble', 'core'],
        createdAt: new Date('2025-07-05'),
        updatedAt: new Date('2025-07-20'),
      },
      {
        id: task3Id,
        projectId: project1Id,
        title: 'Build REST API for indoor maps',
        description: 'Create Express API endpoints for CRUD operations on indoor map data and waypoints.',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2025-08-10'),
        assigneeId: student2Id,
        tags: ['backend', 'api'],
        createdAt: new Date('2025-07-05'),
        updatedAt: new Date('2025-07-05'),
      },
    ],

    // ==================== TASK COMMENTS ====================
    taskComments: [
      {
        id: id(),
        taskId: task1Id,
        userId: mentor1Id,
        body: 'Great work on the architecture diagram. Consider adding a caching layer.',
        createdAt: new Date('2025-07-14'),
      },
      {
        id: id(),
        taskId: task2Id,
        userId: student1Id,
        body: 'BLE scanning works on Android. Testing on iOS next.',
        createdAt: new Date('2025-07-18'),
      },
    ],

    // ==================== ACTIVITY LOG ====================
    activityLogs: [
      {
        id: id(),
        projectId: project1Id,
        actorId: student1Id,
        actionType: 'TASK_COMPLETED',
        metadataJson: { taskTitle: 'Design system architecture diagram' },
        createdAt: new Date('2025-07-14'),
      },
      {
        id: id(),
        projectId: project1Id,
        actorId: mentor1Id,
        actionType: 'MEETING_CREATED',
        metadataJson: { agenda: 'Sprint 1 Review' },
        createdAt: new Date('2025-07-10'),
      },
    ],

    // ==================== MEETINGS ====================
    meetings: [
      {
        id: meeting1Id,
        projectId: project1Id,
        mentorId: mentor1Id,
        startsAt: new Date('2025-07-12T10:00:00'),
        agenda: 'Sprint 1 Review — discuss architecture decisions and BLE module progress',
        notes: 'Architecture approved. BLE module needs calibration testing. Next sprint focus: API development.',
        createdAt: new Date('2025-07-10'),
      },
    ],

    // ==================== MEETING ATTENDANCE ====================
    meetingAttendances: [
      { meetingId: meeting1Id, studentId: student1Id, status: 'PRESENT' },
      { meetingId: meeting1Id, studentId: student2Id, status: 'PRESENT' },
    ],

    // ==================== ANNOUNCEMENTS ====================
    announcements: [
      {
        id: announcement1Id,
        projectId: project1Id,
        mentorId: mentor1Id,
        title: 'Mid-sem evaluation preparation',
        body: 'Please prepare a 10-minute demo of your progress for the upcoming mid-semester evaluation. Focus on working prototypes.',
        createdAt: new Date('2025-07-20'),
      },
    ],

    // ==================== DIARY ENTRIES ====================
    diaryEntries: [
      {
        id: diary1Id,
        projectId: project1Id,
        studentId: student1Id,
        date: new Date('2025-07-18'),
        workDone: 'Implemented BLE beacon scanning service. Tested with 3 beacons in lab environment. Achieved 2m accuracy.',
        hoursSpent: 4,
        blockers: 'iOS CoreBluetooth requires specific permissions flow',
        nextPlan: 'Implement iOS-specific permission handling and test beacon ranging accuracy',
        verifiedByMentorId: mentor1Id,
        createdAt: new Date('2025-07-18'),
      },
      {
        id: id(),
        projectId: project1Id,
        studentId: student1Id,
        date: new Date('2025-07-19'),
        workDone: 'Fixed iOS permission flow. Both platforms now scan beacons correctly. Started trilateration algorithm.',
        hoursSpent: 5,
        blockers: 'None',
        nextPlan: 'Complete trilateration and test with campus beacon layout',
        verifiedByMentorId: null,
        createdAt: new Date('2025-07-19'),
      },
      {
        id: id(),
        projectId: project1Id,
        studentId: student2Id,
        date: new Date('2025-07-18'),
        workDone: 'Researched indoor mapping formats. Evaluated GeoJSON and custom SVG approaches for floor plans.',
        hoursSpent: 3,
        blockers: 'Need actual floor plan SVGs from campus admin',
        nextPlan: 'Create mock floor plan data and begin API endpoint design',
        verifiedByMentorId: null,
        createdAt: new Date('2025-07-18'),
      },
    ],

    // ==================== INTERNAL EVALUATIONS ====================
    internalEvaluations: [],

    // ==================== PRESENTATION EVENTS ====================
    presentationEvents: [],

    // ==================== PRESENTATION SLOTS ====================
    presentationSlots: [],

    // ==================== PRESENTATION EVALUATIONS ====================
    presentationEvaluations: [],

    // ==================== REFRESH TOKENS ====================
    refreshTokens: [],

    // ==================== FREEZE SETTINGS ====================
    freezeSettings: {
      allocation: false,
      internalMarks: false,
      presentations: false,
    },
  };

  return store;
}

const db = createStore();

module.exports = db;
