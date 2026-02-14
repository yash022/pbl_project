import { Link } from 'react-router-dom';
import { GraduationCap, Users, ClipboardCheck, BookOpen, Shield, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: Users, title: 'Mentor Allocation', desc: 'Capacity-based mentor matching with request workflow' },
  { icon: ClipboardCheck, title: 'Task Management', desc: 'Track project progress with tasks, status, and deadlines' },
  { icon: BookOpen, title: 'Daily Diary', desc: 'Log daily work, hours, and progress for mentor review' },
  { icon: Shield, title: 'Evaluation System', desc: 'Internal marks, mid-sem & end-sem presentation grading' },
];

const LOGIN_ROLES = [
  { label: 'Student', to: '/login/student', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Mentor', to: '/login/mentor', color: 'bg-green-50 text-green-700 border-green-200' },
  { label: 'Faculty', to: '/login/faculty', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Admin', to: '/login/admin', color: 'bg-muj-orange/10 text-muj-orange border-muj-orange/20' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-muj-beige">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-muj-orange" />
            <div>
              <h1 className="font-black text-xl text-muj-charcoal">MPMS</h1>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">Manipal University Jaipur</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login/student" className="btn-secondary text-xs">Login</Link>
            <Link to="/register" className="btn-primary text-xs">Register</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-muj-orange/10 text-muj-orange text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <GraduationCap className="w-3.5 h-3.5" />
          Project Based Learning Platform
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-muj-charcoal mb-4 leading-tight">
          Major Project<br />Management System
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-10 text-lg">
          Digitize the complete PBL workflow — from mentor allocation to final evaluation — for Manipal University Jaipur.
        </p>

        {/* Role Login Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-16">
          {LOGIN_ROLES.map((role) => (
            <Link
              key={role.to}
              to={role.to}
              className={`${role.color} border rounded-lg px-4 py-3 text-sm font-semibold hover:shadow-md transition-shadow flex items-center justify-center gap-2`}
            >
              {role.label}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ))}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card p-5 text-left">
                <div className="w-10 h-10 bg-muj-orange/10 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-muj-orange" />
                </div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muj-charcoal text-white/60 py-6 text-center text-xs">
        <p>&copy; 2026 MPMS — Manipal University Jaipur. All rights reserved.</p>
      </footer>
    </div>
  );
}
