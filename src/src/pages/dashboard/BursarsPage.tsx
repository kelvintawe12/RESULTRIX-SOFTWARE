import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { Plus, Search, Trash2, Mail, Phone, DollarSign, Eye, Calendar, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { AddBursarForm } from '../../components/forms/AddBursarForm';
import { MetricCard } from '../../components/dashboard/MetricCard';
export function BursarsPage() {
  const {
    user
  } = useAuth();
  const [bursars, setBursars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // View Modal State
  const [selectedBursar, setSelectedBursar] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  useEffect(() => {
    if (user?.school_id) {
      fetchBursars();
    }
  }, [user?.school_id]);
  const fetchBursars = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('users').select('*').eq('school_id', user?.school_id).eq('role', 'bursar').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setBursars(data || []);
    } catch (err: any) {
      setError('Failed to fetch bursars');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will remove the bursar account.')) return;
    try {
      const {
        error
      } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      setBursars(bursars.filter(b => b.id !== id));
      if (selectedBursar?.id === id) {
        setShowViewModal(false);
        setSelectedBursar(null);
      }
    } catch (err: any) {
      console.error('Error deleting bursar:', err);
      alert('Failed to delete bursar');
    }
  };
  const handleViewDetails = (bursar: any) => {
    setSelectedBursar(bursar);
    setShowViewModal(true);
  };
  const filteredBursars = bursars.filter(b => b.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || b.email.toLowerCase().includes(searchQuery.toLowerCase()));
  if (loading) {
    return <div className="flex justify-center p-12">
        <LoadingSpinner />
      </div>;
  }
  return <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bursars</h1>
          <p className="text-slate-500 mt-1">
            Manage financial staff and permissions
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Bursar
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard title="Total Bursars" value={bursars.length.toString()} icon={DollarSign} color="emerald" trend={{
        value: 'Active Staff',
        direction: 'neutral'
      }} />
        <MetricCard title="Recent Additions" value={bursars.filter(b => {
        const date = new Date(b.created_at);
        const now = new Date();
        return (now.getTime() - date.getTime()) / (1000 * 3600 * 24) < 30;
      }).length.toString()} icon={Calendar} color="blue" trend={{
        value: 'Last 30 Days',
        direction: 'neutral'
      }} />
        <MetricCard title="System Access" value="Full" icon={Shield} color="purple" trend={{
        value: 'Financial Module',
        direction: 'neutral'
      }} />
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search bursars by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
      </div>

      {/* Grid Layout */}
      {filteredBursars.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBursars.map(bursar => <Card key={bursar.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200" noPadding>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">
                    {bursar.full_name.charAt(0)}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleViewDetails(bursar)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(bursar.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors" title="Remove Bursar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {bursar.full_name}
                </h3>
                <p className="text-sm text-emerald-600 font-medium mb-4 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Bursar
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{bursar.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{bursar.phone || 'No phone number'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      Joined {new Date(bursar.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button variant="secondary" className="w-full justify-center" onClick={() => handleViewDetails(bursar)}>
                    View Profile
                  </Button>
                </div>
              </div>
            </Card>)}
        </div> : <div className="text-center py-16 px-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <DollarSign className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No Bursars Found
          </h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search query.' : 'Add a bursar to start managing school finances.'}
          </p>
          {!searchQuery && <Button variant="primary" onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Bursar
            </Button>}
        </div>}

      <AddBursarForm isOpen={showAddForm} onClose={() => setShowAddForm(false)} onSuccess={fetchBursars} />

      {/* View Details Modal */}
      <Dialog isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Bursar Profile">
        {selectedBursar && <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-2xl">
                {selectedBursar.full_name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedBursar.full_name}
                </h3>
                <p className="text-slate-500">{selectedBursar.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                  Contact Info
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">
                      Email Address
                    </span>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedBursar.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">
                      Phone Number
                    </span>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedBursar.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                  Account Info
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">
                      Role
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Bursar
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">
                      Joined Date
                    </span>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(selectedBursar.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="danger" onClick={() => handleDelete(selectedBursar.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                Remove Account
              </Button>
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </div>
          </div>}
      </Dialog>
    </div>;
}