import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, BoxIcon } from 'lucide-react';
interface MetricCardProps {
  title: string;
  value: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon: BoxIcon;
  color?: 'blue' | 'green' | 'amber' | 'purple';
}
export function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  color = 'blue'
}: MetricCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-indigo-50 text-indigo-600'
  };
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-rose-600',
    neutral: 'text-slate-500'
  };
  const TrendIcon = trend?.direction === 'up' ? ArrowUpRight : trend?.direction === 'down' ? ArrowDownRight : Minus;
  return <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && <div className="mt-4 flex items-center text-sm">
          <span className={`flex items-center font-medium ${trendColors[trend.direction]}`}>
            <TrendIcon className="w-4 h-4 mr-1" />
            {trend.value}
          </span>
          <span className="text-slate-400 ml-2">vs last month</span>
        </div>}
    </div>;
}