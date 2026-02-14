import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, ListTodo, BookOpen, Users, CalendarDays,
  MessageSquare, ClipboardCheck, Presentation, Settings, LogOut, Menu, X,
  GraduationCap, Shield, ChevronDown, Bell, UserCircle
} from 'lucide-react';

const NAV_BY_ROLE = {
  STUDENT: [
    { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
    { label: 'Find Mentor', to: '/student/find-mentor', icon: Users },
    { label: 'My Project', to: '/student/project', icon: FolderKanban },
    { label: 'Tasks', to: '/student/tasks', icon: ListTodo },
    { label: 'Daily Diary', to: '/student/diary', icon: BookOpen },
    { label: 'Meetings', to: '/student/meetings', icon: CalendarDays },
    { label: 'Announcements', to: '/student/announcements', icon: MessageSquare },
    { label: 'Presentations', to: '/student/presentations', icon: Presentation },
  ],
  MENTOR: [
    { label: 'Dashboard', to: '/mentor', icon: LayoutDashboard },
    { label: 'Requests', to: '/mentor/requests', icon: Bell },
    { label: 'Projects', to: '/mentor/projects', icon: FolderKanban },
    { label: 'Meetings', to: '/mentor/meetings', icon: CalendarDays },
    { label: 'Announcements', to: '/mentor/announcements', icon: MessageSquare },
    { label: 'Daily Diary', to: '/mentor/diary', icon: BookOpen },
    { label: 'Evaluation', to: '/mentor/evaluation', icon: ClipboardCheck },
  ],
  PBL_FACULTY: [
    { label: 'Dashboard', to: '/faculty', icon: LayoutDashboard },
    { label: 'Events', to: '/faculty/events', icon: CalendarDays },
    { label: 'Slot Management', to: '/faculty/slots', icon: Presentation },
    { label: 'Evaluation', to: '/faculty/evaluation', icon: ClipboardCheck },
  ],
  ADMIN: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Freeze Controls', to: '/admin/freeze', icon: Shield },
    { label: 'Exports', to: '/admin/exports', icon: ClipboardCheck },
  ],
};

const ROLE_LABELS = {
  STUDENT: 'Student',
  MENTOR: 'Mentor',
  PBL_FACULTY: 'PBL Faculty',
  ADMIN: 'Admin',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = NAV_BY_ROLE[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-muj-beige">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-muj-charcoal text-white transform transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <GraduationCap className="w-8 h-8 text-muj-orange" />
          <div>
            <h1 className="font-black text-lg leading-tight">MPMS</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Manipal University Jaipur</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-muj-orange text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white w-full transition-colors">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-md hover:bg-gray-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-xs font-semibold text-muj-orange uppercase tracking-wider">{ROLE_LABELS[user?.role]} Panel</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-muj-orange/10 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-muj-orange" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
