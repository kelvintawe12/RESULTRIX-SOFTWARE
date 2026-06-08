import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { supabase } from '../../lib/supabaseClient';
import { School, Mail, Phone, MapPin, Calendar, Edit, ArrowLeft } from 'lucide-react';

export function SchoolDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [school, setSchool] = useState<any>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [counts, setCounts] = useState({ students: 0, teachers: 0, users: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'activity' | 'users'>('users');

  useEffect(() => {
    if (id) fetchSchool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSchool = async () => {
    try {
      setLoading(true);
      setError(null);

      const [schoolRes, usersRes, studentCountRes, teacherCountRes, activityRes] = await Promise.all([
        supabase.from('schools').select('*').eq('id', id).maybeSingle(),
        supabase.from('users').select('id, full_name, email, role, phone, created_at').eq('school_id', id).order('created_at', { ascending: false }),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', id),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('school_id', id).eq('role', 'teacher'),
        supabase.from('audit_logs').select('id, action_type, details, timestamp, users(full_name)').eq('school_id', id).order('timestamp', { ascending: false }).limit(20),
      ]);

      if (schoolRes.error) throw schoolRes.error;
      if (!schoolRes.data) {
        setError('School not found');
        return;
      }
      setSchool(schoolRes.data);

      const userList = usersRes.data || [];
      setUsers(userList);
      setAdmin(userList.find(u => u.role === 'school_admin') || null);
      setCounts({
        students: studentCountRes.count || 0,
        teachers: teacherCountRes.count || 0,
        users: userList.length,
      });
      setActivity(activityRes.data || []);
    } catch (err: any) {
      console.error('Error fetching school details:', err);
      setError(err.message || 'Failed to load school details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="w-10 h-10" />
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="p-6 space-y-4">
        <Alert type="error" title="Error">{error || 'School not found'}</Alert>
        <Button variant="outline" onClick={() => navigate('/super-admin/schools')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Schools
        </Button>
      </div>
    );
  }

  const joined = school.created_at ? new Date(school.created_at).toLocaleDateString() : 'N/A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 overflow-hidden">
            {school.logo_path ? <img src={school.logo_path} alt="" className="w-full h-full object-cover" /> : <School className="w-8 h-8" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {school.name}
              <Badge variant={school.approved ? 'success' : 'warning'}>{school.approved ? 'Approved' : 'Pending'}</Badge>
            </h1>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4" /> {school.address || 'No address on file'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/super-admin/schools')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <Button variant="primary" onClick={() => navigate(`/super-admin/schools`)} leftIcon={<Edit className="w-4 h-4" />}>
            Manage
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="School Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administrator</label>
                <p className="text-sm font-medium text-slate-900 mt-1">{admin?.full_name || 'No admin assigned'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {admin?.email ? (
                    <a href={`mailto:${admin.email}`} className="text-sm font-medium text-blue-600 hover:underline">{admin.email}</a>
                  ) : (
                    <span className="text-sm text-slate-500">N/A</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-medium text-slate-900">{admin?.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined Date</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-medium text-slate-900">{joined}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1" role="tablist">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Users ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'activity' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Activity Log ({activity.length})
            </button>
          </div>

          <Card>
            {activeTab === 'users' && (
              users.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No users in this school.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{u.full_name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                      <Badge variant="info">{u.role}</Badge>
                    </div>
                  ))}
                </div>
              )
            )}
            {activeTab === 'activity' && (
              activity.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No recent activity recorded.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activity.map(a => {
                    const actor = Array.isArray(a.users) ? a.users[0] : a.users;
                    return (
                      <div key={a.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{a.action_type}</p>
                          <p className="text-xs text-slate-500">{actor?.full_name || 'System'}</p>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(a.timestamp).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </Card>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card title="Overview Stats">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Total Students</span>
                <span className="text-lg font-bold text-slate-900">{counts.students}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Total Teachers</span>
                <span className="text-lg font-bold text-slate-900">{counts.teachers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Total Users</span>
                <span className="text-lg font-bold text-slate-900">{counts.users}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Grading Scale</span>
                <Badge variant="info">{school.grading_scale || 'percentage'}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Currency</span>
                <Badge variant="neutral">{school.currency_code || 'USD'}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
