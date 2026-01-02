import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../dashboard/Sidebar';
import { Header } from '../dashboard/Header';
import { MaintenanceBanner } from '../common/MaintenanceBanner';
import { PWAInstallPrompt } from '../common/PWAInstallPrompt';
import { IdleSecurityScreen } from '../common/IdleSecurityScreen';
import { UserRole } from '../../types';
interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: UserRole;
}
export function DashboardLayout({
  children,
  role
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);
  return <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Idle Security Screen - Shows after 5 minutes of inactivity */}
      <IdleSecurityScreen />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Sidebar with mobile toggle */}
      <Sidebar role={role} onClose={() => setSidebarOpen(false)} isOpen={sidebarOpen} />

      {/* Main Content - Added lg:pl-64 to accommodate fixed sidebar on desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Maintenance Banner */}
        <MaintenanceBanner />

        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto scroll-smooth">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>;
}