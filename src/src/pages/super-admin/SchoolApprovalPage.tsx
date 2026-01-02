import React, { useEffect, useState } from 'react';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Check, X, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
export function SchoolApprovalPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  useEffect(() => {
    fetchPendingSchools();
  }, []);
  const fetchPendingSchools = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('schools').select('*').eq('approved', false).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setSchools(data || []);
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
      const {
        error
      } = await supabase.from('schools').update({
        approved: true
      }).eq('id', id);
      if (error) throw error;
      // Remove from list
      setSchools(schools.filter(s => s.id !== id));
      // Optional: Send email notification (mock)
      console.log(`School ${id} approved`);
    } catch (err: any) {
      console.error('Error approving school:', err);
      alert('Failed to approve school');
    } finally {
      setActionLoading(null);
    }
  };
  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this school? This cannot be undone.')) return;
    try {
      setActionLoading(id);
      // In a real app, we might delete or mark as rejected
      const {
        error
      } = await supabase.from('schools').delete().eq('id', id);
      if (error) throw error;
      setSchools(schools.filter(s => s.id !== id));
    } catch (err: any) {
      console.error('Error rejecting school:', err);
      alert('Failed to reject school');
    } finally {
      setActionLoading(null);
    }
  };
  const columns = [{
    header: 'School Name',
    accessor: 'name' as const
  }, {
    header: 'Address',
    accessor: 'address' as const,
    render: (row: any) => <span className="truncate max-w-[200px] block">
          {row.address || 'N/A'}
        </span>
  }, {
    header: 'Currency',
    accessor: 'currency_code' as const
  }, {
    header: 'Grading',
    accessor: 'grading_scale' as const,
    render: (row: any) => <span className="capitalize">
          {row.grading_scale?.replace(/_/g, ' ')}
        </span>
  }, {
    header: 'Applied On',
    accessor: 'created_at' as const,
    render: (row: any) => new Date(row.created_at).toLocaleDateString()
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: any) => <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(row.id)} isLoading={actionLoading === row.id} leftIcon={<Check className="w-4 h-4" />}>
            Approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleReject(row.id)} disabled={actionLoading === row.id} leftIcon={<X className="w-4 h-4" />}>
            Reject
          </Button>
        </div>
  }];
  if (loading) return <div className="flex justify-center p-12">
        <LoadingSpinner />
      </div>;
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Pending School Approvals
        </h1>
        <p className="text-slate-500">
          Review and approve new school registration requests.
        </p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        {schools.length > 0 ? <Table data={schools} columns={columns} /> : <div className="text-center py-12">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              All Caught Up!
            </h3>
            <p className="text-slate-500 mt-1">
              There are no pending school approvals at this time.
            </p>
          </div>}
      </div>
    </div>;
}