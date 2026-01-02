import React from 'react';
import { UserPlus, CreditCard, FileText, Megaphone, Plus } from 'lucide-react';
export function QuickActions() {
  const actions = [{
    label: 'Add Student',
    icon: UserPlus,
    color: 'bg-blue-600 hover:bg-blue-700'
  }, {
    label: 'Collect Fees',
    icon: CreditCard,
    color: 'bg-emerald-600 hover:bg-emerald-700'
  }, {
    label: 'New Report',
    icon: FileText,
    color: 'bg-slate-600 hover:bg-slate-700'
  }, {
    label: 'Announcement',
    icon: Megaphone,
    color: 'bg-indigo-600 hover:bg-indigo-700'
  }];
  return <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
          <Plus className="w-4 h-4 mr-1" />
          Customize
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {actions.map(action => <button key={action.label} className="flex flex-col items-center justify-center p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-all group">
            <div className={`p-3 rounded-full text-white mb-3 shadow-sm transition-transform group-hover:scale-110 ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-700">
              {action.label}
            </span>
          </button>)}
      </div>
    </div>;
}