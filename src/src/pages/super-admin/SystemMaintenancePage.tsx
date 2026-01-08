import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Wrench, Plus, Eye, Edit, Trash2, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Calendar, Building2, PlayCircle, StopCircle, Download, LayoutGrid, List as ListIcon, ArrowUpDown, Search, Filter, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

interface Maintenance {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  affects_all_schools: boolean;
  affected_school_ids: string[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
export function SystemMaintenancePage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [filteredMaintenances, setFilteredMaintenances] = useState<Maintenance[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'start_time', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [platformStatus, setPlatformStatus] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    affects_all_schools: true,
    affected_school_ids: [] as string[]
  });
  const [stats, setStats] = useState({
    total: 0,
    planned: 0,
    inProgress: 0,
    completed: 0
  });

  const statusChartData = useMemo(() => {
    const counts = { planned: 0, in_progress: 0, completed: 0, cancelled: 0 };
    maintenances.forEach(m => {
      if (counts[m.status] !== undefined) counts[m.status]++;
    });
    return [
      { name: 'Planned', value: counts.planned, color: '#3b82f6' },
      { name: 'In Progress', value: counts.in_progress, color: '#f59e0b' },
      { name: 'Completed', value: counts.completed, color: '#22c55e' },
      { name: 'Cancelled', value: counts.cancelled, color: '#ef4444' }
    ].filter(i => i.value > 0);
  }, [maintenances]);

  const frequencyChartData = useMemo(() => {
    const data: Record<string, number> = {};
    // Sort by date first
    const sorted = [...maintenances].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    sorted.forEach(m => {
      const date = new Date(m.start_time);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      data[key] = (data[key] || 0) + 1;
    });
    return Object.entries(data).map(([name, count]) => ({ name, count }));
  }, [maintenances]);

  useEffect(() => {
    fetchMaintenances();
    fetchSchools();
    fetchPlatformStatus();
  }, []);

  useEffect(() => {
    let result = maintenances;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => m.title.toLowerCase().includes(query) || m.description.toLowerCase().includes(query));
    }
    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }
    if (sortConfig.key) {
      result.sort((a: any, b: any) => {
        return sortConfig.direction === 'asc' ? (a[sortConfig.key] > b[sortConfig.key] ? 1 : -1) : (a[sortConfig.key] < b[sortConfig.key] ? 1 : -1);
      });
    }
    setFilteredMaintenances(result);
  }, [maintenances, searchQuery, statusFilter, sortConfig]);

  const fetchPlatformStatus = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('platform_status').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      setPlatformStatus(data);
    } catch (err: any) {
      console.error('Error fetching platform status:', err);
    }
  };
  const fetchSchools = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('schools').select('id, name').order('name');
      if (error) throw error;
      setSchools(data || []);
    } catch (err: any) {
      console.error('Error fetching schools:', err);
    }
  };
  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data,
        error
      } = await supabase.from('system_maintenance').select('*').order('start_time', {
        ascending: false
      });
      if (error) throw error;
      setMaintenances(data || []);
      setFilteredMaintenances(data || []);
      // Calculate stats
      setStats({
        total: data?.length || 0,
        planned: data?.filter(m => m.status === 'planned').length || 0,
        inProgress: data?.filter(m => m.status === 'in_progress').length || 0,
        completed: data?.filter(m => m.status === 'completed').length || 0
      });
    } catch (err: any) {
      setError('Failed to fetch maintenance windows');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Description', 'Start Time', 'End Time', 'Status', 'Scope'];
    const csvContent = [
      headers.join(','),
      ...filteredMaintenances.map(m => [
        `"${m.title}"`,
        `"${m.description}"`,
        new Date(m.start_time).toLocaleString(),
        new Date(m.end_time).toLocaleString(),
        m.status,
        m.affects_all_schools ? 'All Schools' : 'Specific Schools'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `maintenance_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredMaintenances.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredMaintenances.map(m => m.id)));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} maintenance records?`)) return;
    try {
      const { error } = await supabase.from('system_maintenance').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      setSelectedIds(new Set());
      fetchMaintenances();
    } catch (err: any) {
      alert('Failed to delete records: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const {
        error
      } = await supabase.from('system_maintenance').insert({
        title: formData.title,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        affects_all_schools: formData.affects_all_schools,
        affected_school_ids: formData.affects_all_schools ? null : formData.affected_school_ids,
        created_by: user?.id,
        status: 'planned'
      });
      if (error) throw error;
      setShowAddModal(false);
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        affects_all_schools: true,
        affected_school_ids: []
      });
      fetchMaintenances();
      fetchPlatformStatus();
    } catch (err: any) {
      console.error('Error creating maintenance:', err);
      alert('Failed to create maintenance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const {
        error
      } = await supabase.from('system_maintenance').update({
        status: newStatus,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      fetchMaintenances();
      fetchPlatformStatus();
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance window?')) return;
    try {
      const {
        error
      } = await supabase.from('system_maintenance').delete().eq('id', id);
      if (error) throw error;
      fetchMaintenances();
    } catch (err: any) {
      console.error('Error deleting maintenance:', err);
      alert('Failed to delete maintenance: ' + err.message);
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="default" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Planned
          </Badge>;
      case 'in_progress':
        return <Badge variant="warning" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            In Progress
          </Badge>;
      case 'completed':
        return <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Completed
          </Badge>;
      case 'cancelled':
        return <Badge variant="danger" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  const getPlatformStatusBadge = () => {
    if (!platformStatus) return null;
    const statusConfig = {
      operational: {
        variant: 'success' as const,
        icon: CheckCircle,
        text: 'Operational'
      },
      degraded: {
        variant: 'warning' as const,
        icon: AlertTriangle,
        text: 'Degraded'
      },
      maintenance: {
        variant: 'warning' as const,
        icon: Wrench,
        text: 'Maintenance'
      },
      outage: {
        variant: 'danger' as const,
        icon: XCircle,
        text: 'Outage'
      }
    };
    const config = statusConfig[platformStatus.current_status as keyof typeof statusConfig];
    if (!config) return null;
    return <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="w-3 h-3" />
        {config.text}
      </Badge>;
  };
  if (loading && maintenances.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            System Maintenance
          </h1>
          <p className="text-slate-500 mt-1">
            Schedule and manage platform maintenance windows
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportToCSV} leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button variant="secondary" onClick={fetchMaintenances} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Schedule Maintenance
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Platform Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Current Platform Status
              </h3>
              <p className="text-sm text-slate-500">
                {platformStatus?.message || 'Loading...'}
              </p>
            </div>
          </div>
          {getPlatformStatusBadge()}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Total Windows
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Planned</p>
              <p className="text-3xl font-bold text-slate-600 mt-2">
                {stats.planned}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">In Progress</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {stats.inProgress}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.completed}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequency Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Maintenance Frequency</h3>
              <p className="text-sm text-slate-500">Events over time</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Status Distribution</h3>
              <p className="text-sm text-slate-500">Breakdown by current status</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
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
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search maintenance..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
              <Filter className="w-4 h-4 text-slate-500" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm focus:outline-none bg-transparent min-w-[120px]">
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <ListIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-900">{selectedIds.size} selected</span>
            <span className="text-sm text-indigo-600">({filteredMaintenances.length} total in view)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedIds(new Set())}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleBulkDelete} leftIcon={<Trash2 className="w-4 h-4" />}>Delete Selected</Button>
          </div>
        </div>
      )}

      {/* Maintenance Table */}
      <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${viewMode === 'grid' ? 'p-6' : 'overflow-hidden'}`}>
        {filteredMaintenances.length > 0 ? (
          <div>
            {viewMode === 'grid' && <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === filteredMaintenances.length} 
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Select All</span>
              </div>
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-900">{filteredMaintenances.length}</span> of <span className="font-semibold text-slate-900">{maintenances.length}</span> records
              </p>
            </div>}

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaintenances.map(maintenance => (
                  <Card key={maintenance.id} className={`p-5 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow relative ${selectedIds.has(maintenance.id) ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}>
                    <div className="absolute top-4 right-4 z-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(maintenance.id)}
                        onChange={() => toggleSelection(maintenance.id)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <Wrench className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-900 line-clamp-1">{maintenance.title}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{maintenance.description}</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Start:</span>
                        <span className="font-medium text-slate-900">{new Date(maintenance.start_time).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">End:</span>
                        <span className="font-medium text-slate-900">{new Date(maintenance.end_time).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-xs text-slate-500">Status:</span>
                        {getStatusBadge(maintenance.status)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Button size="sm" variant="secondary" leftIcon={<Eye className="w-4 h-4" />} onClick={() => { setSelectedMaintenance(maintenance); setShowViewModal(true); }}>
                        View
                      </Button>
                      {maintenance.status === 'planned' && <Button size="sm" variant="primary" onClick={() => handleUpdateStatus(maintenance.id, 'in_progress')}>Start</Button>}
                      {maintenance.status === 'in_progress' && <Button size="sm" variant="success" onClick={() => handleUpdateStatus(maintenance.id, 'completed')}>Complete</Button>}
                      <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(maintenance.id)}>
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 w-12">
                        <input type="checkbox" checked={selectedIds.size === filteredMaintenances.length && filteredMaintenances.length > 0} onChange={toggleAll} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('title')}>
                        <div className="flex items-center gap-1">Title <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('start_time')}>
                        <div className="flex items-center gap-1">Schedule <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Scope</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                        <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMaintenances.map(maintenance => (
                      <tr key={maintenance.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(maintenance.id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <input type="checkbox" checked={selectedIds.has(maintenance.id)} onChange={() => toggleSelection(maintenance.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-slate-900">{maintenance.title}</div>
                            <div className="text-xs text-slate-500 line-clamp-1">{maintenance.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-slate-700">{new Date(maintenance.start_time).toLocaleString()}</div>
                            <div className="text-xs text-slate-500">to {new Date(maintenance.end_time).toLocaleString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">{maintenance.affects_all_schools ? 'All Schools' : `${maintenance.affected_school_ids?.length || 0} Schools`}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(maintenance.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => { setSelectedMaintenance(maintenance); setShowViewModal(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {maintenance.status === 'planned' && <Button size="sm" variant="primary" onClick={() => handleUpdateStatus(maintenance.id, 'in_progress')}><PlayCircle className="w-4 h-4" /></Button>}
                            {maintenance.status === 'in_progress' && <Button size="sm" variant="success" onClick={() => handleUpdateStatus(maintenance.id, 'completed')}><CheckCircle className="w-4 h-4" /></Button>}
                            <Button size="sm" variant="danger" onClick={() => handleDelete(maintenance.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Maintenance Scheduled
            </h3>
            <p className="text-slate-500 mb-6">
              Schedule maintenance windows to notify schools
            </p>
            <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Schedule Maintenance
            </Button>
          </div>
        )}
      </div>

      {/* Add Maintenance Modal */}
      <Dialog isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Schedule Maintenance" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" required value={formData.title} onChange={e => setFormData({
          ...formData,
          title: e.target.value
        })} placeholder="e.g., Platform Update - New Features" />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea required value={formData.description} onChange={e => setFormData({
            ...formData,
            description: e.target.value
          })} placeholder="Describe what will happen during maintenance..." rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" type="datetime-local" required value={formData.start_time} onChange={e => setFormData({
            ...formData,
            start_time: e.target.value
          })} />
            <Input label="End Time" type="datetime-local" required value={formData.end_time} onChange={e => setFormData({
            ...formData,
            end_time: e.target.value
          })} />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <input type="checkbox" id="affects_all" checked={formData.affects_all_schools} onChange={e => setFormData({
            ...formData,
            affects_all_schools: e.target.checked
          })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
            <label htmlFor="affects_all" className="text-sm font-medium text-slate-700">
              Affects all schools (platform-wide maintenance)
            </label>
          </div>

          {!formData.affects_all_schools && <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Select Affected Schools
              </label>
              <select multiple value={formData.affected_school_ids} onChange={e => setFormData({
            ...formData,
            affected_school_ids: Array.from(e.target.selectedOptions, option => option.value)
          })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32">
                {schools.map(school => <option key={school.id} value={school.id}>
                    {school.name}
                  </option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Hold Ctrl/Cmd to select multiple
              </p>
            </div>}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Schedule Maintenance
            </Button>
          </div>
        </form>
      </Dialog>

      {/* View Maintenance Modal */}
      <Dialog isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Maintenance Details" size="lg">
        {selectedMaintenance && <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedMaintenance.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  ID: {selectedMaintenance.id}
                </p>
              </div>
              {getStatusBadge(selectedMaintenance.status)}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Description
              </h4>
              <p className="text-slate-700 whitespace-pre-wrap">
                {selectedMaintenance.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Schedule
                </h4>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-slate-600">Start Time</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {new Date(selectedMaintenance.start_time).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-600">End Time</dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {new Date(selectedMaintenance.end_time).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Scope
                </h4>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="font-medium text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    {selectedMaintenance.affects_all_schools ? 'All Schools' : `${selectedMaintenance.affected_school_ids?.length || 0} Specific Schools`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </div>
          </div>}
      </Dialog>
    </div>;
}