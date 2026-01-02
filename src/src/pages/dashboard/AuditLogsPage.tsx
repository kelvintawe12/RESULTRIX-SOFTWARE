import React, { useEffect, useState, createElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, Download, Shield, User, Calendar, Activity, FileText, AlertCircle } from 'lucide-react';
export function AuditLogsPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  useEffect(() => {
    if (user?.school_id) {
      fetchAuditLogs();
    }
  }, [user?.school_id, dateRange]);
  useEffect(() => {
    applyFilters();
  }, [logs, searchQuery, filterAction]);
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');
      // Calculate date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      const {
        data,
        error: logsError
      } = await supabase.from('audit_logs').select(`
          *,
          users(full_name, email, role)
        `).eq('school_id', user?.school_id).gte('timestamp', startDate.toISOString()).order('timestamp', {
        ascending: false
      }).limit(500);
      if (logsError) throw logsError;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = [...logs];
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(log => log.action_type?.toLowerCase().includes(searchQuery.toLowerCase()) || log.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || log.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) || JSON.stringify(log.details)?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    // Action type filter
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action_type === filterAction);
    }
    setFilteredLogs(filtered);
  };
  const getActionColor = (action: string) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('create') || actionLower.includes('insert')) return 'bg-green-100 text-green-700';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-blue-100 text-blue-700';
    if (actionLower.includes('delete') || actionLower.includes('remove')) return 'bg-red-100 text-red-700';
    if (actionLower.includes('login') || actionLower.includes('auth')) return 'bg-purple-100 text-purple-700';
    if (actionLower.includes('payment') || actionLower.includes('fee')) return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-700';
  };
  const getActionIcon = (action: string) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('login') || actionLower.includes('auth')) return <Shield className="h-4 w-4" />;
    if (actionLower.includes('payment') || actionLower.includes('fee')) return <FileText className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };
  const exportLogs = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Details'];
    const rows = filteredLogs.map(log => [new Date(log.timestamp).toLocaleString(), log.users?.full_name || 'System', log.users?.role || 'N/A', log.action_type, JSON.stringify(log.details || {})]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  // Get unique action types for filter
  const actionTypes = Array.from(new Set(logs.map(log => log.action_type).filter(Boolean))).sort();
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500">
            Track all system activities and changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onChange={e => setDateRange(e.target.value)} options={[{
          value: '1',
          label: 'Last 24 hours'
        }, {
          value: '7',
          label: 'Last 7 days'
        }, {
          value: '30',
          label: 'Last 30 days'
        }, {
          value: '90',
          label: 'Last 90 days'
        }]} />
          <Button variant="outline" onClick={exportLogs} leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Logs</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {filteredLogs.length}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Unique Users
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {new Set(logs.map(l => l.user_id).filter(Boolean)).size}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Action Types
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {actionTypes.length}
                </h3>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Time Range</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {dateRange}d
                </h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Logs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Activity Log</CardTitle>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input placeholder="Search logs..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <Select value={filterAction} onChange={e => setFilterAction(e.target.value)} options={[{
              value: 'all',
              label: 'All Actions'
            }, ...actionTypes.map(action => ({
              value: action,
              label: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }))]} />
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? <div className="space-y-3">
              {filteredLogs.map(log => <div key={log.id} className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-lg ${getActionColor(log.action_type)}`}>
                      {getActionIcon(log.action_type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getActionColor(log.action_type)}>
                            {log.action_type?.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.users?.full_name || 'System'}{' '}
                          <span className="text-gray-500 font-normal">
                            ({log.users?.role || 'system'})
                          </span>
                        </p>
                        {log.details && <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </div>}
                      </div>
                    </div>
                  </div>
                </div>)}
            </div> : <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No audit logs found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery || filterAction !== 'all' ? 'Try adjusting your filters' : 'Audit logs will appear here as actions are performed'}
              </p>
            </div>}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                About Audit Logs
              </h3>
              <p className="text-sm text-blue-800">
                Audit logs track all important system activities including user
                logins, data modifications, payments, and administrative
                actions. These logs are automatically generated and cannot be
                modified, ensuring complete transparency and accountability.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}