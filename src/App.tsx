import React, { useState } from 'react';
import { Sidebar } from './components/dashboard/Sidebar';
import { Header } from './components/dashboard/Header';
import { MetricCard } from './components/dashboard/MetricCard';
import { QuickActions } from './components/dashboard/QuickActions';
import { ActivityFeed } from './components/dashboard/ActivityFeed';
import { Users, DollarSign, FileClock, GraduationCap, Menu } from 'lucide-react';
export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-0">
        <Header />

        {/* Mobile Header Bar (visible only on small screens) */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <span className="font-bold text-lg text-slate-900">EduMaster</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Dashboard Overview
                </h1>
                <p className="text-slate-500 mt-1">
                  Welcome back, here's what's happening at your school today.
                </p>
              </div>
              <div className="flex gap-3">
                <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                  <option>Academic Year 2023-24</option>
                  <option>Term 1</option>
                  <option>Term 2</option>
                </select>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                  Download Report
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard title="Total Students" value="2,847" trend={{
              value: '12%',
              direction: 'up'
            }} icon={GraduationCap} color="blue" />
              <MetricCard title="Fee Collection" value="94.2%" trend={{
              value: '2.1%',
              direction: 'up'
            }} icon={DollarSign} color="green" />
              <MetricCard title="Pending Approvals" value="23" trend={{
              value: '5',
              direction: 'neutral'
            }} icon={FileClock} color="amber" />
              <MetricCard title="Active Teachers" value="142" trend={{
              value: 'Stable',
              direction: 'neutral'
            }} icon={Users} color="purple" />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Chart Area (Placeholder for now, using Quick Actions as requested) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Chart Placeholder */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Attendance Overview
                    </h3>
                    <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg p-2">
                      <option>Last 30 Days</option>
                      <option>This Week</option>
                    </select>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2 px-2">
                    {[65, 78, 82, 75, 88, 92, 85, 78, 90, 95, 88, 82].map((h, i) => <div key={i} className="w-full bg-blue-50 rounded-t-sm relative group">
                          <div className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-sm transition-all duration-500 group-hover:bg-blue-600" style={{
                      height: `${h}%`
                    }}></div>
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded transition-opacity">
                            {h}%
                          </div>
                        </div>)}
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-slate-400 font-medium uppercase tracking-wide">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                  </div>
                </div>

                <QuickActions />
              </div>

              {/* Right Column */}
              <div className="lg:col-span-1">
                <ActivityFeed />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>;
}