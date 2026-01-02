import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Wrench, Plus, Eye, Edit, Trash2, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Calendar, Building2, PlayCircle, StopCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
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
  useEffect(() => {
    fetchMaintenances();
    fetchSchools();
    fetchPlatformStatus();
  }, []);
  const fetchPlatformStatus = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('platform_status').select('*').eq('id', 1).single();
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
  const columns = [{
    header: 'Title',
    accessor: 'title' as const,
    render: (row: Maintenance) => <div>
          <div className="font-semibold text-slate-900">{row.title}</div>
          <div className="text-xs text-slate-500 line-clamp-1">
            {row.description}
          </div>
        </div>
  }, {
    header: 'Schedule',
    accessor: 'start_time' as const,
    render: (row: Maintenance) => <div className="text-sm">
          <div className="text-slate-700">
            {new Date(row.start_time).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
          </div>
          <div className="text-xs text-slate-500">
            to{' '}
            {new Date(row.end_time).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
          </div>
        </div>
  }, {
    header: 'Scope',
    accessor: 'affects_all_schools' as const,
    render: (row: Maintenance) => <div className="flex items-center gap-1 text-sm">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700">
            {row.affects_all_schools ? 'All Schools' : `${row.affected_school_ids?.length || 0} Schools`}
          </span>
        </div>
  }, {
    header: 'Status',
    accessor: 'status' as const,
    render: (row: Maintenance) => getStatusBadge(row.status)
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: Maintenance) => <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => {
        setSelectedMaintenance(row);
        setShowViewModal(true);
      }} leftIcon={<Eye className="w-4 h-4" />}>
            View
          </Button>
          {row.status === 'planned' && <Button size="sm" variant="primary" onClick={() => handleUpdateStatus(row.id, 'in_progress')} leftIcon={<PlayCircle className="w-4 h-4" />}>
              Start
            </Button>}
          {row.status === 'in_progress' && <Button size="sm" variant="success" onClick={() => handleUpdateStatus(row.id, 'completed')} leftIcon={<CheckCircle className="w-4 h-4" />}>
              Complete
            </Button>}
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
            Delete
          </Button>
        </div>
  }];
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

      {/* Maintenance Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {maintenances.length > 0 ? <div className="p-6">
            <Table data={maintenances} columns={columns} />
          </div> : <div className="text-center py-16 px-6">
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
          </div>}
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