import React from 'react';
import { CheckCircle2, AlertCircle, User, FileCheck, DollarSign } from 'lucide-react';
export function ActivityFeed() {
  const activities = [{
    id: 1,
    title: 'New student admission approved',
    description: 'Sarah Johnson (Grade 5) - Application #2024-892',
    time: '2 hours ago',
    icon: User,
    color: 'bg-blue-100 text-blue-600'
  }, {
    id: 2,
    title: 'Fee payment received',
    description: '$2,400 received from Michael Chen (Grade 8)',
    time: '4 hours ago',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-600'
  }, {
    id: 3,
    title: 'Report card generated',
    description: 'Term 1 reports for Grade 10-A are ready for review',
    time: '5 hours ago',
    icon: FileCheck,
    color: 'bg-indigo-100 text-indigo-600'
  }, {
    id: 4,
    title: 'System alert',
    description: 'Library database maintenance scheduled for tonight',
    time: '1 day ago',
    icon: AlertCircle,
    color: 'bg-amber-100 text-amber-600'
  }, {
    id: 5,
    title: 'Teacher leave request',
    description: 'Mr. Robert Wilson requested leave for Oct 12-14',
    time: '1 day ago',
    icon: CheckCircle2,
    color: 'bg-slate-100 text-slate-600'
  }];
  return <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Recent Activity
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-6">
        {activities.map((activity, index) => <div key={activity.id} className="relative flex gap-4">
            {index !== activities.length - 1 && <div className="absolute left-[19px] top-10 bottom-[-24px] w-px bg-slate-100" />}

            <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}>
              <activity.icon className="w-5 h-5" />
            </div>

            <div className="flex-1 pt-0.5">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-slate-900">
                  {activity.title}
                </h4>
                <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                  {activity.time}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {activity.description}
              </p>
            </div>
          </div>)}
      </div>
    </div>;
}