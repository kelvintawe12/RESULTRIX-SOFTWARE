import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { useAuth } from '../../hooks/useAuth';
import { Megaphone, Plus, Search, Filter, Eye, Pin, Edit, Trash2, X, Calendar, User } from 'lucide-react';
interface Announcement {
  id: string;
  school_id: string;
  class_id: string | null;
  title: string;
  body: string;
  is_pinned: boolean;
  pinned_until: string | null;
  posted_by: string;
  posted_at: string;
  views_count: number;
  poster_name?: string;
  poster_role?: string;
  class_name?: string;
}
export function AnnouncementsPage() {
  const {
    user
  } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [filterScope, setFilterScope] = useState('all');
  const [filterClass, setFilterClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    scope: 'school-wide',
    class_id: '',
    is_pinned: false,
    pinned_until: ''
  });
  const canCreate = ['school_admin', 'teacher'].includes(user?.role || '');
  const canPin = user?.role === 'school_admin';
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  useEffect(() => {
    applyFilters();
  }, [announcements, filterScope, filterClass, searchQuery]);
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch classes
      const {
        data: classesData
      } = await supabase.from('classes').select('id, name').eq('school_id', user?.school_id).order('name');
      setClasses(classesData || []);
      // Fetch announcements based on role
      let query = supabase.from('announcements').select('*').eq('school_id', user?.school_id);
      // Teachers only see school-wide + their classes
      if (user?.role === 'teacher') {
        const {
          data: teacherClasses
        } = await supabase.from('teacher_assignments').select('class_id').eq('teacher_id', user.id);
        const classIds = teacherClasses?.map(tc => tc.class_id) || [];
        query = query.or(`class_id.is.null,class_id.in.(${classIds.join(',')})`);
      }
      const {
        data: announcementsData,
        error: announcementsError
      } = await query.order('is_pinned', {
        ascending: false
      }).order('posted_at', {
        ascending: false
      });
      if (announcementsError) throw announcementsError;
      // Enrich with poster and class info
      const enriched = await Promise.all((announcementsData || []).map(async announcement => {
        const {
          data: poster
        } = await supabase.from('users').select('full_name, role').eq('id', announcement.posted_by).single();
        let className = null;
        if (announcement.class_id) {
          const classData = classesData?.find(c => c.id === announcement.class_id);
          className = classData?.name;
        }
        return {
          ...announcement,
          poster_name: poster?.full_name || 'Unknown',
          poster_role: poster?.role || '',
          class_name: className
        };
      }));
      setAnnouncements(enriched);
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = [...announcements];
    if (filterScope === 'school-wide') {
      filtered = filtered.filter(a => a.class_id === null);
    } else if (filterScope === 'my-classes' && user?.role === 'teacher') {
      filtered = filtered.filter(a => a.class_id !== null);
    }
    if (filterClass) {
      filtered = filtered.filter(a => a.class_id === filterClass);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.title.toLowerCase().includes(query) || a.body.toLowerCase().includes(query));
    }
    setFilteredAnnouncements(filtered);
  };
  const handleCreate = async () => {
    try {
      setLoading(true);
      setError('');
      const announcementData: any = {
        school_id: user?.school_id,
        title: formData.title,
        body: formData.body,
        class_id: formData.scope === 'class' ? formData.class_id : null,
        posted_by: user?.id,
        is_pinned: canPin ? formData.is_pinned : false,
        pinned_until: canPin && formData.is_pinned ? formData.pinned_until : null
      };
      const {
        error: insertError
      } = await supabase.from('announcements').insert(announcementData);
      if (insertError) throw insertError;
      setSuccess('Announcement created successfully');
      setCreateModalOpen(false);
      setFormData({
        title: '',
        body: '',
        scope: 'school-wide',
        class_id: '',
        is_pinned: false,
        pinned_until: ''
      });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = async () => {
    if (!selectedAnnouncement) return;
    try {
      setLoading(true);
      setError('');
      const updateData: any = {
        title: formData.title,
        body: formData.body,
        class_id: formData.scope === 'class' ? formData.class_id : null
      };
      if (canPin) {
        updateData.is_pinned = formData.is_pinned;
        updateData.pinned_until = formData.is_pinned ? formData.pinned_until : null;
      }
      const {
        error: updateError
      } = await supabase.from('announcements').update(updateData).eq('id', selectedAnnouncement.id);
      if (updateError) throw updateError;
      setSuccess('Announcement updated successfully');
      setEditModalOpen(false);
      setSelectedAnnouncement(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update announcement');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      setLoading(true);
      const {
        error: deleteError
      } = await supabase.from('announcements').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setSuccess('Announcement deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete announcement');
    } finally {
      setLoading(false);
    }
  };
  const handleView = async (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setViewModalOpen(true);
    // Increment view count
    try {
      await supabase.from('announcements').update({
        views_count: announcement.views_count + 1
      }).eq('id', announcement.id);
    } catch (err) {
      console.error('Failed to increment view count:', err);
    }
  };
  const openEditModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      body: announcement.body,
      scope: announcement.class_id ? 'class' : 'school-wide',
      class_id: announcement.class_id || '',
      is_pinned: announcement.is_pinned,
      pinned_until: announcement.pinned_until || ''
    });
    setEditModalOpen(true);
  };
  const canEditOrDelete = (announcement: Announcement) => {
    if (user?.role === 'school_admin') return true;
    if (user?.role === 'teacher' && announcement.posted_by === user.id) return true;
    return false;
  };
  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.is_pinned);
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.is_pinned);
  if (loading && announcements.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-7 w-7" />
            Announcements
          </h1>
          <p className="text-gray-500">View and manage school announcements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="h-4 w-4" />}>
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          {canCreate && <Button onClick={() => setCreateModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              New Announcement
            </Button>}
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      {showFilters && <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => {
            setFilterScope('all');
            setFilterClass('');
            setSearchQuery('');
          }} leftIcon={<X className="h-4 w-4" />}>
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search announcements..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>

              <Select value={filterScope} onValueChange={setFilterScope}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Announcements</SelectItem>
                  <SelectItem value="school-wide">School-wide Only</SelectItem>
                  {user?.role === 'teacher' && <SelectItem value="my-classes">My Classes Only</SelectItem>}
                </SelectContent>
              </Select>

              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>}

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Pin className="h-5 w-5 text-amber-500" />
            Pinned Announcements
          </h2>
          {pinnedAnnouncements.map(announcement => <Card key={announcement.id} className="border-l-4 border-l-amber-500 bg-amber-50/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {announcement.title}
                      </h3>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinned
                      </Badge>
                      {announcement.class_name && <Badge variant="secondary">
                          {announcement.class_name}
                        </Badge>}
                    </div>
                    <p className="text-gray-700 line-clamp-2 mb-3">
                      {announcement.body}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{announcement.poster_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(announcement.posted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{announcement.views_count} views</span>
                      </div>
                      {announcement.pinned_until && <span className="text-amber-600">
                          Until{' '}
                          {new Date(announcement.pinned_until).toLocaleDateString()}
                        </span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleView(announcement)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEditOrDelete(announcement) && <>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(announcement)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(announcement.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </>}
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>}

      {/* Regular Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Announcements ({regularAnnouncements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {regularAnnouncements.length === 0 ? <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No announcements found</p>
              <p className="text-gray-400 text-sm mt-2">
                {announcements.length === 0 ? 'Announcements will appear here once posted' : 'Try adjusting your filters'}
              </p>
            </div> : <div className="space-y-3">
              {regularAnnouncements.map(announcement => <div key={announcement.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {announcement.title}
                        </h3>
                        {announcement.class_name && <Badge variant="secondary">
                            {announcement.class_name}
                          </Badge>}
                      </div>
                      <p className="text-gray-700 line-clamp-2 mb-3">
                        {announcement.body}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{announcement.poster_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(announcement.posted_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{announcement.views_count} views</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleView(announcement)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEditOrDelete(announcement) && <>
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(announcement)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(announcement.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </>}
                    </div>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(createModalOpen || editModalOpen) && <Dialog isOpen={createModalOpen || editModalOpen} onClose={() => {
      setCreateModalOpen(false);
      setEditModalOpen(false);
      setFormData({
        title: '',
        body: '',
        scope: 'school-wide',
        class_id: '',
        is_pinned: false,
        pinned_until: ''
      });
    }} title={editModalOpen ? 'Edit Announcement' : 'Create Announcement'} size="lg">
          <div className="space-y-4">
            <Input label="Title" required value={formData.title} onChange={e => setFormData({
          ...formData,
          title: e.target.value
        })} placeholder="Enter announcement title" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Body
              </label>
              <textarea value={formData.body} onChange={e => setFormData({
            ...formData,
            body: e.target.value
          })} placeholder="Enter announcement details..." rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Scope
              </label>
              <Select value={formData.scope} onValueChange={value => setFormData({
            ...formData,
            scope: value
          })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school-wide">School-wide</SelectItem>
                  <SelectItem value="class">Specific Class</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scope === 'class' && <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Class
                </label>
                <Select value={formData.class_id} onValueChange={value => setFormData({
            ...formData,
            class_id: value
          })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}

            {canPin && <>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_pinned" checked={formData.is_pinned} onChange={e => setFormData({
              ...formData,
              is_pinned: e.target.checked
            })} className="rounded" />
                  <label htmlFor="is_pinned" className="text-sm font-medium text-gray-700">
                    Pin this announcement
                  </label>
                </div>

                {formData.is_pinned && <Input type="datetime-local" label="Pinned Until (Optional)" value={formData.pinned_until} onChange={e => setFormData({
            ...formData,
            pinned_until: e.target.value
          })} />}
              </>}

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
            setCreateModalOpen(false);
            setEditModalOpen(false);
          }}>
                Cancel
              </Button>
              <Button onClick={editModalOpen ? handleEdit : handleCreate}>
                {editModalOpen ? 'Update' : 'Publish'} Announcement
              </Button>
            </div>
          </div>
        </Dialog>}

      {/* View Modal */}
      {viewModalOpen && selectedAnnouncement && <Dialog isOpen={viewModalOpen} onClose={() => {
      setViewModalOpen(false);
      setSelectedAnnouncement(null);
    }} title={selectedAnnouncement.title} size="lg">
          <div className="space-y-4">
            {selectedAnnouncement.is_pinned && <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                <Pin className="h-3 w-3 mr-1" />
                Pinned Announcement
              </Badge>}

            {selectedAnnouncement.class_name && <div>
                <label className="text-sm font-medium text-gray-600">
                  Class
                </label>
                <p className="text-gray-900">
                  {selectedAnnouncement.class_name}
                </p>
              </div>}

            <div>
              <label className="text-sm font-medium text-gray-600">
                Message
              </label>
              <p className="text-gray-900 whitespace-pre-wrap mt-1">
                {selectedAnnouncement.body}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Posted By
                </label>
                <p className="text-gray-900">
                  {selectedAnnouncement.poster_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Posted On
                </label>
                <p className="text-gray-900">
                  {new Date(selectedAnnouncement.posted_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Views</label>
              <p className="text-gray-900">
                {selectedAnnouncement.views_count}
              </p>
            </div>
          </div>
        </Dialog>}
    </div>;
}