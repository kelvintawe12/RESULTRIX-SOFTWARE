import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../src/hooks/useAuth';
import { UserRole } from '../../src/types';
import { LayoutDashboard, GraduationCap, Users, FileText, CreditCard, BookOpen, BarChart3, Settings, LogOut, School, CheckSquare, Globe, ClipboardCheck, Calendar, FileSpreadsheet } from 'lucide-react';
interface SidebarProps {
  role?: UserRole;
  onClose?: () => void;
}
export function Sidebar({
  role,
  onClose
}: SidebarProps) {
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const getMenuItems = (role?: UserRole) => {
    switch (role) {
      case 'super_admin':
        return [{
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/super-admin'
        }, {
          icon: CheckSquare,
          label: 'School Approvals',
          path: '/super-admin/approvals'
        }, {
          icon: Globe,
          label: 'Global Analytics',
          path: '/super-admin/analytics'
        }, {
          icon: Settings,
          label: 'Settings',
          path: '/super-admin/settings'
        }];
      case 'school_admin':
        return [{
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/dashboard'
        }, {
          icon: GraduationCap,
          label: 'Students',
          path: '/dashboard/students'
        }, {
          icon: Users,
          label: 'Teachers',
          path: '/dashboard/teachers'
        }, {
          icon: CreditCard,
          label: 'Fees & Payments',
          path: '/dashboard/fees'
        }, {
          icon: BookOpen,
          label: 'Academics',
          path: '/dashboard/academics'
        }, {
          icon: BarChart3,
          label: 'Reports',
          path: '/dashboard/reports'
        }, {
          icon: Settings,
          label: 'School Setup',
          path: '/dashboard/setup'
        }];
      case 'bursar':
        return [{
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/bursar'
        }, {
          icon: CreditCard,
          label: 'Record Payment',
          path: '/bursar/payments'
        }, {
          icon: FileSpreadsheet,
          label: 'Fee Reports',
          path: '/bursar/reports'
        }, {
          icon: Settings,
          label: 'Settings',
          path: '/bursar/settings'
        }];
      case 'teacher':
        return [{
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/teacher'
        }, {
          icon: BookOpen,
          label: 'My Classes',
          path: '/teacher/classes'
        }, {
          icon: ClipboardCheck,
          label: 'Submit Marks',
          path: '/teacher/marks'
        }, {
          icon: Calendar,
          label: 'Attendance',
          path: '/teacher/attendance'
        }, {
          icon: Settings,
          label: 'Settings',
          path: '/teacher/settings'
        }];
      default:
        return [];
    }
  };
  const menuItems = getMenuItems(role);
  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/super-admin' || path === '/bursar' || path === '/teacher') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  return <aside className="flex flex-col w-64 bg-slate-900 text-white h-full border-r border-slate-800 shadow-xl">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/20">
            <School className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-100">
            EduMaster
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="px-3 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Menu
        </div>
        {menuItems.map(item => <Link key={item.path} to={item.path} onClick={onClose} className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
              ${isActive(item.path) ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 translate-x-1' : 'text-slate-400 hover:text-white hover:bg-slate-800 hover:translate-x-1'}
            `}>
            {isActive(item.path) && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full" />}
            <item.icon className={`w-5 h-5 transition-colors ${isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
            {item.label}
          </Link>)}
      </nav>

      {/* User Profile / Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">
              {role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button onClick={() => signOut()} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors group">
          <LogOut className="w-5 h-5 group-hover:text-rose-400 transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>;
}