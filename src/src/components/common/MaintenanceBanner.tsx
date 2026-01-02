import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Wrench, Info } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
interface PlatformStatus {
  current_status: 'operational' | 'degraded' | 'maintenance' | 'outage';
  message: string;
  updated_at: string;
}
interface ActiveMaintenance {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}
export function MaintenanceBanner() {
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus | null>(null);
  const [activeMaintenance, setActiveMaintenance] = useState<ActiveMaintenance | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    fetchPlatformStatus();
    fetchActiveMaintenance();
    // Poll every 60 seconds
    const interval = setInterval(() => {
      fetchPlatformStatus();
      fetchActiveMaintenance();
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  const fetchPlatformStatus = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('platform_status').select('*').eq('id', 1).maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully
      // Ignore PGRST116 error (no rows found)
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching platform status:', error);
        return;
      }
      // If no data, assume operational
      if (!data) {
        setPlatformStatus({
          current_status: 'operational',
          message: 'All systems operational',
          updated_at: new Date().toISOString()
        });
        return;
      }
      setPlatformStatus(data);
    } catch (err) {
      console.error('Error fetching platform status:', err);
      // Fail silently - don't show banner if we can't fetch status
    }
  };
  const fetchActiveMaintenance = async () => {
    try {
      const now = new Date().toISOString();
      const {
        data,
        error
      } = await supabase.from('system_maintenance').select('title, description, start_time, end_time').eq('status', 'in_progress').lte('start_time', now).gte('end_time', now).limit(1).maybeSingle(); // Use maybeSingle() instead of single()
      // Ignore PGRST116 error (no rows found)
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching active maintenance:', error);
        return;
      }
      setActiveMaintenance(data);
    } catch (err) {
      console.error('Error fetching active maintenance:', err);
      // Fail silently
    }
  };
  // Don't show banner if dismissed, no status, or operational
  if (dismissed || !platformStatus || platformStatus.current_status === 'operational') {
    return null;
  }
  const getStatusConfig = () => {
    switch (platformStatus.current_status) {
      case 'maintenance':
        return {
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-900',
          iconColor: 'text-amber-600',
          icon: Wrench
        };
      case 'degraded':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-900',
          iconColor: 'text-yellow-600',
          icon: AlertTriangle
        };
      case 'outage':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          iconColor: 'text-red-600',
          icon: AlertTriangle
        };
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          icon: Info
        };
    }
  };
  const config = getStatusConfig();
  const Icon = config.icon;
  return <div className={`${config.bgColor} border-b ${config.borderColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${config.textColor}`}>
                {platformStatus.message}
              </p>
              {activeMaintenance && <div className="mt-2">
                  <p className={`text-sm font-medium ${config.textColor}`}>
                    {activeMaintenance.title}
                  </p>
                  <p className={`text-xs ${config.textColor} opacity-90 mt-1`}>
                    {activeMaintenance.description}
                  </p>
                  <p className={`text-xs ${config.textColor} opacity-75 mt-1`}>
                    Expected completion:{' '}
                    {new Date(activeMaintenance.end_time).toLocaleString()}
                  </p>
                </div>}
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className={`${config.iconColor} hover:opacity-75 transition-opacity flex-shrink-0`} aria-label="Dismiss">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>;
}