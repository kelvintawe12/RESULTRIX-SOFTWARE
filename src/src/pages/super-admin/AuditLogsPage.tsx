import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Alert } from '../../components/ui/Alert';
import { Search, Filter, Download, RefreshCw, Shield, Activity, AlertTriangle, CheckCircle, Clock, FileText, User, Building2, Eye, XCircle, Info, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

interface AuditLog {
  id: string;
  user_id: string | null;
  school_id: string | null;
  action_type: string;
  details: string | any;
  ip_address?: string | null;
  status?: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  users?: {
    full_name: string;
    email: string;
    role: string;
  } | null;
  schools?: {
    name: string;
  } | null;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    warnings: 0,
    errors: 0
  });

  const activityChartData = useMemo(() => {
    const data: Record<string, number> = {};
    // Sort by date
    const sorted = [...filteredLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    sorted.forEach(log => {
      const date = new Date(log.timestamp);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      data[key] = (data[key] || 0) + 1;
    });
    
    // Take last 7 days or entries if sparse
    return Object.entries(data).map(([name, count]) => ({ name, count }));
  }, [filteredLogs]);

  const statusChartData = useMemo(() => {
    return [
      { name: 'Success', value: stats.success, color: '#22c55e' },
      { name: 'Warning', value: stats.warnings, color: '#f59e0b' },
      { name: 'Error', value: stats.errors, color: '#ef4444' }
    ].filter(i => i.value > 0);
  }, [stats]);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let result = logs;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.action_type.toLowerCase().includes(query) || 
        l.details.toLowerCase().includes(query) ||
        l.users?.full_name.toLowerCase().includes(query) ||
        l.schools?.name.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(l => (l.status || 'info') === statusFilter);
    }
    setFilteredLogs(result);

    // Update stats based on filtered view
    setStats({
      total: result.length,
      success: result.filter(l => (l.status || 'info') === 'success').length,
      warnings: result.filter(l => (l.status || 'info') === 'warning').length,
      errors: result.filter(l => (l.status || 'info') === 'error').length
    });
  }, [logs, searchQuery, statusFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Assuming an 'audit_logs' table exists. If not, this will need to be adapted to your schema.
      // We join with users and schools to get readable names.
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users (
            full_name,
            email,
            role
          ),
          schools (
            name
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(500); // Limit to recent 500 logs for performance

      if (error) throw error;

      setLogs(data || []);
      setFilteredLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      // Fallback for demo if table doesn't exist yet
      if (err.code === '42P01') { // Undefined table
        setError('Audit logs table not found. Please ensure database migration is applied.');
      } else {
        setError('Failed to fetch audit logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Action', 'Status', 'User', 'Role', 'School', 'Details', 'IP Address'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        `"${log.action_type}"`,
        log.status || 'info',
        `"${log.users?.full_name || 'System'}"`,
        log.users?.role || 'N/A',
        `"${log.schools?.name || 'N/A'}"`,
        `"${(typeof log.details === 'string' ? log.details : JSON.stringify(log.details)).replace(/"/g, '""')}"`,
        log.ip_address || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Success</Badge>;
      case 'warning':
        return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Warning</Badge>;
      case 'error':
        return <Badge variant="danger" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Error</Badge>;
      case 'info':
        return <Badge variant="primary" className="flex items-center gap-1"><Info className="w-3 h-3" /> Info</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 mt-1">
            Track system activity and security events
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportToCSV} leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={fetchLogs} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Events</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Successful</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.success}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Warnings</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{stats.warnings}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Errors</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.errors}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Activity Volume</h3>
              <p className="text-sm text-slate-500">System events over time</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Event Status</h3>
              <p className="text-sm text-slate-500">Distribution by type</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search logs by action, user, or details..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
              <Filter className="w-4 h-4 text-slate-500" />
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)} 
                className="text-sm focus:outline-none bg-transparent min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">School</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">{log.action_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <div className="text-sm">
                          <div className="text-slate-900 font-medium">{log.users?.full_name || 'System'}</div>
                          <div className="text-xs text-slate-500">{log.users?.role || 'Automated'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {log.schools?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(log.status || 'info')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedLog(log)} leftIcon={<Eye className="w-4 h-4" />}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Logs Found</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No system activity recorded yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      <Dialog isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Log Details" size="md">
        {selectedLog && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedLog.action_type}</h3>
                <p className="text-sm text-slate-500">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              {getStatusBadge(selectedLog.status || 'info')}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Details</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-700 font-mono whitespace-pre-wrap">
                  {typeof selectedLog.details === 'object' ? JSON.stringify(selectedLog.details, null, 2) : selectedLog.details}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">User</h4>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <User className="w-4 h-4 text-slate-400" />
                    {selectedLog.users?.full_name || 'System'}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">IP Address</h4>
                  <div className="text-sm text-slate-700 font-mono">
                    {selectedLog.ip_address || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>;
}