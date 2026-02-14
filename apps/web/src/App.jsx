import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout & guards
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import FindMentor from './pages/student/FindMentor';
import MyProject from './pages/student/MyProject';
import StudentTasks from './pages/student/Tasks';
import StudentDiary from './pages/student/Diary';
import StudentPresentations from './pages/student/Presentations';
import StudentAnnouncements from './pages/student/Announcements';
import StudentMeetings from './pages/student/Meetings';

// Mentor pages
import MentorDashboard from './pages/mentor/Dashboard';
import MentorRequests from './pages/mentor/Requests';
import MentorProjects from './pages/mentor/Projects';
import MentorMeetings from './pages/mentor/Meetings';
import MentorAnnouncements from './pages/mentor/Announcements';
import MentorEvaluation from './pages/mentor/Evaluation';
import MentorDiary from './pages/mentor/Diary';

// Faculty pages
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyEvents from './pages/faculty/Events';
import FacultySlots from './pages/faculty/Slots';
import FacultyEvaluation from './pages/faculty/Evaluation';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import FreezeControls from './pages/admin/FreezeControls';
import AdminExports from './pages/admin/Exports';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  const map = {
    STUDENT: '/student',
    MENTOR: '/mentor',
    PBL_FACULTY: '/faculty',
    ADMIN: '/admin',
  };
  return <Navigate to={map[user.role] || '/'} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login/:role" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="/dashboard" element={<RoleRedirect />} />

      {/* Student */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route element={<Layout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/find-mentor" element={<FindMentor />} />
          <Route path="/student/project" element={<MyProject />} />
          <Route path="/student/tasks" element={<StudentTasks />} />
          <Route path="/student/diary" element={<StudentDiary />} />
          <Route path="/student/announcements" element={<StudentAnnouncements />} />
          <Route path="/student/meetings" element={<StudentMeetings />} />
          <Route path="/student/presentations" element={<StudentPresentations />} />
        </Route>
      </Route>

      {/* Mentor */}
      <Route element={<ProtectedRoute allowedRoles={['MENTOR']} />}>
        <Route element={<Layout />}>
          <Route path="/mentor" element={<MentorDashboard />} />
          <Route path="/mentor/requests" element={<MentorRequests />} />
          <Route path="/mentor/projects" element={<MentorProjects />} />
          <Route path="/mentor/meetings" element={<MentorMeetings />} />
          <Route path="/mentor/announcements" element={<MentorAnnouncements />} />
          <Route path="/mentor/diary" element={<MentorDiary />} />
          <Route path="/mentor/evaluation" element={<MentorEvaluation />} />
        </Route>
      </Route>

      {/* Faculty */}
      <Route element={<ProtectedRoute allowedRoles={['PBL_FACULTY']} />}>
        <Route element={<Layout />}>
          <Route path="/faculty" element={<FacultyDashboard />} />
          <Route path="/faculty/events" element={<FacultyEvents />} />
          <Route path="/faculty/slots" element={<FacultySlots />} />
          <Route path="/faculty/evaluation" element={<FacultyEvaluation />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/freeze" element={<FreezeControls />} />
          <Route path="/admin/exports" element={<AdminExports />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
