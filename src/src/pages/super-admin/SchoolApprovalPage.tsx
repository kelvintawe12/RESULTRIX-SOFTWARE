import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Alert } from '../../components/ui/Alert';
import { Check, X, Search, Filter, RefreshCw, Eye, MapPin, Calendar, DollarSign, GraduationCap, Building2, Clock, LayoutGrid, List as ListIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface PendingSchool {
  id: string;
  name: string;
  address: string | null;
  currency_code: string | null;
  grading_scale: string | null;
  created_at: string;
  default_exam_out_of?: number;
  logo_path?: string | null;
}

export function SchoolApprovalPage() {
  const [schools, setSchools] = useState<PendingSchool[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<PendingSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSchool, setSelectedSchool] = useState<PendingSchool | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingSchools();
  }, []);

  useEffect(() => {
    let result = schools;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) || 
        (s.address || '').toLowerCase().includes(query)
      );
    }
    setFilteredSchools(result);
  }, [schools, searchQuery]);

  const fetchPendingSchools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchools(data || []);
      setFilteredSchools(data || []);
    } catch (err: any) {
      setError('Failed to fetch pending approvals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      const { error } = await supabase
        .from('schools')
        .update({ approved: true })
        .eq('id', id);

      if (error) throw error;
      
      setSchools(prev => prev.filter(s => s.id !== id));
      if (selectedSchool?.id === id) setSelectedSchool(null);
    } catch (err: any) {
      console.error('Error approving school:', err);
      alert('Failed to approve school');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this school application? This will permanently delete the registration request.')) return;
    try {
      setActionLoading(id);
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSchools(prev => prev.filter(s => s.id !== id));
      if (selectedSchool?.id === id) setSelectedSchool(null);
    } catch (err: any) {
      console.error('Error rejecting school:', err);
      alert('Failed to reject school');
    } finally {
      setActionLoading(null);
    }
  };

  const stats = useMemo(() => {
    const total = schools.length;
    const today = schools.filter(s => {
      const date = new Date(s.created_at);
      const now = new Date();
      return date.getDate() === now.getDate() && 
             date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    }).length;
    return { total, today };
  }, [schools]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
          <p className="text-slate-500 mt-1">Review and manage new school registration requests</p>
        </div>
        <Button variant="secondary" onClick={fetchPendingSchools} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Pending Requests</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">New Today</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.today}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
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
              placeholder="Search by school name or address..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          <div className="flex items-center gap-2">
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

      {/* Content */}
      <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${viewMode === 'grid' ? 'p-6' : 'overflow-hidden'}`}>
        {filteredSchools.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchools.map(school => (
                <Card key={school.id} className="p-5 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-amber-400">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                        {school.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 line-clamp-1">{school.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(school.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{school.address || 'No address'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span>{school.currency_code || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <span className="capitalize">{school.grading_scale?.replace(/_/g, ' ') || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="flex-1" 
                      onClick={() => setSelectedSchool(school)}
                    >
                      Review
                    </Button>
                    <Button 
                      size="sm" 
                      variant="primary" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(school.id)}
                      isLoading={actionLoading === school.id}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => handleReject(school.id)}
                      disabled={actionLoading === school.id}
                    >
                      <X className="w-4 h-4" />
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
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">School</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applied On</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchools.map(school => (
                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                            {school.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{school.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {school.address || 'No address'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">{school.currency_code}</span>
                            <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600 capitalize">{school.grading_scale?.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(school.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setSelectedSchool(school)}>
                            Review
                          </Button>
                          <Button 
                            size="sm" 
                            variant="primary" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(school.id)}
                            isLoading={actionLoading === school.id}
                          >
                            Approve
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="text-center py-16 px-6">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">All Caught Up!</h3>
            <p className="text-slate-500">There are no pending school approvals at this time.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Dialog isOpen={!!selectedSchool} onClose={() => setSelectedSchool(null)} title="Review Application" size="lg">
        {selectedSchool && (
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedSchool.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedSchool.name}</h3>
                  <Badge variant="warning" className="mt-2">Pending Approval</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Basic Information</h4>
                <dl className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <dt className="text-sm text-slate-600 flex items-center gap-2"><MapPin className="w-4 h-4" /> Address</dt>
                    <dd className="text-sm font-medium text-slate-900 text-right">{selectedSchool.address || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <dt className="text-sm text-slate-600 flex items-center gap-2"><Calendar className="w-4 h-4" /> Applied On</dt>
                    <dd className="text-sm font-medium text-slate-900">{new Date(selectedSchool.created_at).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Academic Settings</h4>
                <dl className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <dt className="text-sm text-slate-600 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Currency</dt>
                    <dd className="text-sm font-medium text-slate-900">{selectedSchool.currency_code || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <dt className="text-sm text-slate-600 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Grading Scale</dt>
                    <dd className="text-sm font-medium text-slate-900 capitalize">{selectedSchool.grading_scale?.replace(/_/g, ' ') || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Approval Action</p>
                <p>Approving this school will activate their account and allow them to start adding students and staff. Rejecting will permanently delete this request.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setSelectedSchool(null)}>Cancel</Button>
              <Button 
                variant="danger" 
                onClick={() => handleReject(selectedSchool.id)}
                isLoading={actionLoading === selectedSchool.id}
                leftIcon={<X className="w-4 h-4" />}
              >
                Reject
              </Button>
              <Button 
                variant="primary" 
                className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                onClick={() => handleApprove(selectedSchool.id)}
                isLoading={actionLoading === selectedSchool.id}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Approve School
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
