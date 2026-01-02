import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Mail, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../../src/hooks/useAuth';
interface HeaderProps {
  onMenuClick?: () => void;
}
export function Header({
  onMenuClick
}: HeaderProps) {
  const location = useLocation();
  const {
    user,
    role
  } = useAuth();
  // Generate breadcrumbs from path
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
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-colors">
          <Mail className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white ring-1 ring-white"></span>
        </button>

        <button className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white ring-1 ring-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        <button className="flex items-center gap-3 pl-2 hover:bg-slate-50 py-1.5 pr-3 rounded-lg transition-all duration-200 border border-transparent hover:border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold border border-blue-200">
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
          <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
        </button>
      </div>
    </header>;
}