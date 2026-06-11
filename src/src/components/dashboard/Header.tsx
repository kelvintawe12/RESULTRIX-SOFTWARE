import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Mail, ChevronDown, Menu, User, Settings, LogOut, Shield, Building2, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Badge } from '../ui/Badge';
import { NotificationBell } from '../notifications/NotificationBell';
import { useTheme } from '../../contexts/ThemeContext';
interface HeaderProps {
  onMenuClick?: () => void;
}
export function Header({
  onMenuClick
}: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    role,
    signOut
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showMessages, setShowMessages] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const messagesRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (user?.school_id) {
      fetchSchoolInfo();
    }
  }, [user?.school_id]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const fetchSchoolInfo = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('schools').select('name, logo_path').eq('id', user?.school_id).single();
      if (error) throw error;
      setSchoolInfo(data);
    } catch (err) {
      console.error('Error fetching school info:', err);
    }
  };
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    return pathSegments.map((segment, index) => {
      const isLast = index === pathSegments.length - 1;
      const formattedSegment = segment.replace(/-/g, ' ').replace(/_/g, ' ');
      return <span key={segment} className="flex items-center">
          <span className={`capitalize ${isLast ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
            {formattedSegment}
          </span>
          {!isLast && <span className="mx-2 text-slate-400">/</span>}
        </span>;
    });
  };
  const getRoleColor = () => {
    switch (role) {
      case 'super_admin':
        return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'school_admin':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'bursar':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'teacher':
        return 'text-amber-600 bg-amber-100 border-amber-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };
  return <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-sm transition-all duration-200">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={onMenuClick} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>

        {/* Breadcrumbs / Title */}
        <div className="hidden sm:flex items-center text-sm">
          <span className="text-slate-500 mr-2">Pages</span>
          <span className="mx-2 text-slate-400">/</span>
          {getBreadcrumbs()}
        </div>
      </div>

      {/* Search Bar - Hidden on mobile */}
      <div className="hidden md:flex items-center max-w-md w-full mx-4">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200" />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Dark Mode Toggle */}
        <button onClick={toggleTheme} className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-yellow-400">
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Messages */}
        <div className="relative" ref={messagesRef}>
          <button onClick={() => {
          setShowMessages(!showMessages);
          setShowProfile(false);
        }} className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-colors">
            <Mail className="w-5 h-5" />
            {unreadMessages > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white ring-1 ring-white"></span>}
          </button>

          {showMessages && <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Messages</h3>
                <Badge variant="primary">{unreadMessages} new</Badge>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                      SA
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        School Admin
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Please review the new fee structure...
                      </p>
                      <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-sm">
                      T
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        Teacher
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Marks have been submitted for review
                      </p>
                      <p className="text-xs text-slate-400 mt-1">5 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-slate-200">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all messages
                </button>
              </div>
            </div>}
        </div>

        {/* Notifications */}
        <NotificationBell />

        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => {
          setShowProfile(!showProfile);
          setShowMessages(false);
        }} className="flex items-center gap-3 pl-2 hover:bg-slate-50 py-1.5 pr-3 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${getRoleColor()}`}>
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none truncate max-w-[100px]">
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-none capitalize">
                {role?.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 hidden sm:block transition-transform ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${getRoleColor()}`}>
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                    <Badge variant="secondary" className="mt-1 capitalize text-xs">
                      {role?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                {schoolInfo && role !== 'super_admin' && <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {schoolInfo.name}
                    </span>
                  </div>}
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button onClick={() => {
              setShowProfile(false);
              navigate('/profile');
            }} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button onClick={() => {
              setShowProfile(false);
              navigate('/settings');
            }} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                {role === 'super_admin' && <button onClick={() => {
              setShowProfile(false);
              navigate('/super-admin/platform-settings');
            }} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                    <Shield className="w-4 h-4" />
                    Platform Settings
                  </button>}
              </div>

              {/* Sign Out */}
              <div className="border-t border-slate-200 pt-2">
                <button onClick={handleSignOut} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>}
        </div>
      </div>
    </header>;
}