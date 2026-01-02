import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Megaphone, Plus, Eye, Edit, Trash2, RefreshCw, Pin, Building2, Calendar, User } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
interface Announcement {
  id: string;
  school_id: string | null;
  title: string;
  body: string;
  is_pinned: boolean;
  pinned_until: string | null;
  posted_by: string;
  posted_at: string;
  views_count: number;
  schools: {
    name: string;
  } | null;
  users: {
    full_name: string;
  } | null;
}
export function SuperAdminAnnouncementsPage() {
  const {
    user
  } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    is_pinned: false,
    target_all_schools: true
  });
  useEffect(() => {
    fetchAnnouncements();
  }, []);
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data,
        error
      } = await supabase.from('announcements').select(`
          *,
          schools (name),
          users (full_name)
        `).is('school_id', null) // Only platform-wide announcements
      .order('posted_at', {
        ascending: false
      });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err: any) {
      setError('Failed to fetch announcements');
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
      } = await supabase.from('announcements').insert({
        school_id: null,
        title: formData.title,
        body: formData.body,
        is_pinned: formData.is_pinned,
        posted_by: user?.id
      });
      if (error) throw error;
      setShowAddModal(false);
      setFormData({
        title: '',
        body: '',
        is_pinned: false,
        target_all_schools: true
      });
      fetchAnnouncements();
    } catch (err: any) {
      console.error('Error creating announcement:', err);
      alert('Failed to create announcement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const {
        error
      } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      fetchAnnouncements();
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
      alert('Failed to delete announcement: ' + err.message);
    }
  };
  const handlePin = async (id: string, currentPinned: boolean) => {
    try {
      const {
        error
      } = await supabase.from('announcements').update({
        is_pinned: !currentPinned
      }).eq('id', id);
      if (error) throw error;
      fetchAnnouncements();
    } catch (err: any) {
      console.error('Error updating announcement:', err);
      alert('Failed to update announcement: ' + err.message);
    }
  };
  const columns = [{
    header: 'Title',
    accessor: 'title' as const,
    render: (row: Announcement) => <div className="flex items-center gap-2">
          {row.is_pinned && <Pin className="w-4 h-4 text-blue-600 flex-shrink-0" />}
          <div>
            <div className="font-semibold text-slate-900">{row.title}</div>
            <div className="text-xs text-slate-500 line-clamp-1">
              {row.body}
            </div>
          </div>
        </div>
  }, {
    header: 'Scope',
    accessor: 'school_id' as const,
    render: (row: Announcement) => <Badge variant="primary" className="flex items-center gap-1 w-fit">
          <Building2 className="w-3 h-3" />
          Platform-wide
        </Badge>
  }, {
    header: 'Posted By',
    accessor: 'users' as const,
    render: (row: Announcement) => <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700">
            {row.users?.full_name || 'Unknown'}
          </span>
        </div>
  }, {
    header: 'Posted',
    accessor: 'posted_at' as const,
    render: (row: Announcement) => <div className="text-sm text-slate-600">
          {new Date(row.posted_at).toLocaleDateString()}
        </div>
  }, {
    header: 'Views',
    accessor: 'views_count' as const,
    render: (row: Announcement) => <span className="text-sm font-medium text-slate-700">
          {row.views_count || 0}
        </span>
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: Announcement) => <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => {
        setSelectedAnnouncement(row);
        setShowViewModal(true);
      }} leftIcon={<Eye className="w-4 h-4" />}>
            View
          </Button>
          <Button size="sm" variant={row.is_pinned ? 'warning' : 'primary'} onClick={() => handlePin(row.id, row.is_pinned)}>
            {row.is_pinned ? 'Unpin' : 'Pin'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
            Delete
          </Button>
        </div>
  }];
  if (loading && announcements.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Platform Announcements
          </h1>
          <p className="text-slate-500 mt-1">
            Create announcements visible to all schools
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetchAnnouncements} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New Announcement
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Total Announcements
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {announcements.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Pinned</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {announcements.filter(a => a.is_pinned).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Pin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Views</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {announcements.reduce((sum, a) => sum + (a.views_count || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Announcements Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {announcements.length > 0 ? <div className="p-6">
            <Table data={announcements} columns={columns} />
          </div> : <div className="text-center py-16 px-6">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Announcements Yet
            </h3>
            <p className="text-slate-500 mb-6">
              Create your first platform-wide announcement
            </p>
            <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Announcement
            </Button>
          </div>}
      </div>

      {/* Add Announcement Modal */}
      <Dialog isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Platform Announcement" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" required value={formData.title} onChange={e => setFormData({
          ...formData,
          title: e.target.value
        })} placeholder="Enter announcement title" />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea required value={formData.body} onChange={e => setFormData({
            ...formData,
            body: e.target.value
          })} placeholder="Enter announcement message" rows={5} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <input type="checkbox" id="is_pinned" checked={formData.is_pinned} onChange={e => setFormData({
            ...formData,
            is_pinned: e.target.checked
          })} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500" />
            <label htmlFor="is_pinned" className="text-sm font-medium text-slate-700">
              Pin this announcement to the top
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Create Announcement
            </Button>
          </div>
        </form>
      </Dialog>

      {/* View Announcement Modal */}
      <Dialog isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Announcement Details" size="lg">
        {selectedAnnouncement && <div className="space-y-4">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {selectedAnnouncement.is_pinned && <Pin className="w-5 h-5 text-blue-600" />}
                  {selectedAnnouncement.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedAnnouncement.users?.full_name || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedAnnouncement.posted_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedAnnouncement.views_count || 0} views
                  </span>
                </div>
              </div>
              <Badge variant="primary">Platform-wide</Badge>
            </div>

            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap">
                {selectedAnnouncement.body}
              </p>
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