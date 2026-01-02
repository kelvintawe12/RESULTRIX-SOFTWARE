import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { LayoutDashboard, GraduationCap, Users, CreditCard, BookOpen, BarChart3, Settings, LogOut, School, CheckSquare, Globe, ClipboardCheck, Calendar, FileSpreadsheet, Building2, X, UserCog, DollarSign, Receipt, UserCheck, BookMarked, ClipboardList, UsersRound, FileEdit, Award, FileText, Layout, Download, Mail, Send, Megaphone, FolderOpen } from 'lucide-react';
interface SidebarProps {
  role?: UserRole;
  onClose?: () => void;
  isOpen?: boolean;
}
export function Sidebar({
  role,
  onClose,
  isOpen
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
          icon: Building2,
          label: 'Schools',
          path: '/super-admin/schools'
        }, {
          icon: UserCog,
          label: 'Administrators',
          path: '/super-admin/administrators'
        }, {
          icon: CheckSquare,
          label: 'Approvals',
          path: '/super-admin/approvals'
        }, {
          icon: Globe,
          label: 'Analytics',
          path: '/super-admin/analytics'
        }, {
          icon: Users,
          label: 'All Users',
          path: '/super-admin/users'
        }, {
          icon: BarChart3,
          label: 'Platform Reports',
          path: '/super-admin/reports'
        }, {
          icon: DollarSign,
          label: 'Billing & Subscriptions',
          path: '/super-admin/billing'
        }, {
          icon: Mail,
          label: 'System Emails',
          path: '/super-admin/emails'
        }, {
          icon: Megaphone,
          label: 'Announcements',
          path: '/super-admin/announcements'
        }, {
          icon: FileSpreadsheet,
          label: 'Database Inspector',
          path: '/super-admin/database'
        }, {
          icon: Calendar,
          label: 'System Maintenance',
          path: '/super-admin/maintenance'
        }, {
          icon: FileSpreadsheet,
          label: 'Audit Logs',
          path: '/super-admin/audit-logs'
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
          icon: FolderOpen,
          label: 'Academic Records',
          path: '/dashboard/students/records'
        }, {
          icon: Users,
          label: 'Teachers',
          path: '/dashboard/teachers'
        }, {
          icon: DollarSign,
          label: 'Bursars',
          path: '/dashboard/bursars'
        }, {
          icon: CreditCard,
          label: 'Fees & Finance',
          path: '/dashboard/fees'
        }, {
          icon: Receipt,
          label: 'Fee Structure',
          path: '/dashboard/fee-structure'
        }, {
          icon: Receipt,
          label: 'Receipts',
          path: '/dashboard/receipts'
        }, {
          icon: BookOpen,
          label: 'Academics',
          path: '/dashboard/academics'
        }, {
          icon: UserCheck,
          label: 'Teacher Assignments',
          path: '/dashboard/teacher-assignments'
        }, {
          icon: BookMarked,
          label: 'Student Enrollment',
          path: '/dashboard/student-enrollment'
        }, {
          icon: UsersRound,
          label: 'Bulk Enrollment',
          path: '/dashboard/bulk-enrollment'
        }, {
          icon: ClipboardList,
          label: 'Marks Review',
          path: '/dashboard/marks-review'
        }, {
          icon: FileEdit,
          label: 'Marks Submission',
          path: '/dashboard/marks-submission'
        }, {
          icon: Award,
          label: 'Class Master Sheet',
          path: '/dashboard/class-mastersheet'
        }, {
          icon: FileText,
          label: 'Report Cards',
          path: '/dashboard/report-cards'
        }, {
          icon: Layout,
          label: 'Report Templates',
          path: '/dashboard/report-templates'
        }, {
          icon: Download,
          label: 'Bulk Reports',
          path: '/dashboard/bulk-reports'
        }, {
          icon: Mail,
          label: 'Email Templates',
          path: '/dashboard/email-templates'
        }, {
          icon: Send,
          label: 'Send Emails',
          path: '/dashboard/email-communication'
        }, {
          icon: Megaphone,
          label: 'Announcements',
          path: '/dashboard/announcements'
        }, {
          icon: BarChart3,
          label: 'Reports',
          path: '/dashboard/reports'
        }, {
          icon: Settings,
          label: 'Setup',
          path: '/dashboard/setup'
        }, {
          icon: Calendar,
          label: 'Academic Management',
          path: '/dashboard/academic-management'
        }, {
          icon: BookOpen,
          label: 'Subjects Management',
          path: '/dashboard/subjects'
        }, {
          icon: FileSpreadsheet,
          label: 'Audit Logs',
          path: '/dashboard/audit-logs'
        }];
      case 'bursar':
        return [{
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/bursar'
        }, {
          icon: Users,
          label: 'Students',
          path: '/bursar/students'
        }, {
          icon: FileText,
          label: 'Invoicing',
          path: '/bursar/invoicing'
        }, {
          icon: CreditCard,
          label: 'Record Payment',
          path: '/bursar/payments'
        }, {
          icon: Receipt,
          label: 'Receipts',
          path: '/bursar/receipts'
        }, {
          icon: Users,
          label: 'Manage Classes',
          path: '/bursar/classes'
        }, {
          icon: Receipt,
          label: 'Fee Structure',
          path: '/bursar/fee-structure'
        }, {
          icon: Users,
          label: 'Student Balances',
          path: '/bursar/student-balances'
        }, {
          icon: DollarSign,
          label: 'Payment Trends',
          path: '/bursar/payment-trends'
        }, {
          icon: BarChart3,
          label: 'Class Payments',
          path: '/bursar/class-payments'
        }, {
          icon: Receipt,
          label: 'Outstanding Payments',
          path: '/bursar/outstanding'
        }, {
          icon: Mail,
          label: 'Email Templates',
          path: '/dashboard/email-templates'
        }, {
          icon: Send,
          label: 'Send Emails',
          path: '/dashboard/email-communication'
        }, {
          icon: Megaphone,
          label: 'Announcements',
          path: '/bursar/announcements'
        }, {
          icon: FileSpreadsheet,
          label: 'Reports & Export',
          path: '/bursar/reports'
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
          label: 'Marks Entry',
          path: '/teacher/marks'
        }, {
          icon: Calendar,
          label: 'Attendance',
          path: '/teacher/attendance'
        }, {
          icon: BarChart3,
          label: 'Reports',
          path: '/teacher/reports'
        }, {
          icon: Calendar,
          label: 'My Schedule',
          path: '/teacher/schedule'
        }, {
          icon: Megaphone,
          label: 'Announcements',
          path: '/teacher/announcements'
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
  return <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />}

      {/* Sidebar */}
      <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white shadow-xl flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/20">
              <School className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-100">
              EduMaster
            </span>
          </div>

          {/* Close button for mobile */}
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="px-3 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Main Menu
          </div>
          {menuItems.map(item => <Link key={item.path} to={item.path} onClick={onClose} className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                ${isActive(item.path) ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 translate-x-1' : 'text-slate-400 hover:text-white hover:bg-slate-800 hover:translate-x-1'}
              `}>
              <item.icon className={`w-5 h-5 transition-colors ${isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {item.label}
            </Link>)}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-bold ring-2 ring-slate-800 shadow-sm">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
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
            <LogOut className="w-4 h-4 group-hover:text-rose-400 transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>
    </>;
}