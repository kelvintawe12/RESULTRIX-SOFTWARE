import React, { useEffect, useState, createElement } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Search, Download, Eye, DollarSign, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export function StudentBalancesPage() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [schoolCurrency, setSchoolCurrency] = useState('KES');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user?.school_id]);
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch school currency
      const {
        data: schoolData,
        error: schoolError
      } = await supabase.from('schools').select('currency_code').eq('id', user?.school_id).single();
      if (schoolError) throw schoolError;
      setSchoolCurrency(schoolData?.currency_code || 'KES');
      // Fetch classes
      const {
        data: classesData,
        error: classesError
      } = await supabase.from('classes').select('id, name').eq('school_id', user?.school_id).order('name');
      if (classesError) throw classesError;
      // Fetch students with payment info
      const {
        data: studentsData,
        error: studentsError
      } = await supabase.from('students').select(`
          id,
          full_name,
          admission_number,
          total_fee,
          total_paid,
          remaining,
          class_id,
          classes (id, name)
        `).eq('school_id', user?.school_id).order('full_name');
      if (studentsError) throw studentsError;
      setClasses(classesData || []);
      setStudents(studentsData || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: schoolCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  const exportToCSV = () => {
    const csvData = filteredStudents.map(s => ({
      'Admission Number': s.admission_number || 'N/A',
      'Student Name': s.full_name,
      Class: s.classes?.name || 'N/A',
      'Total Fee': s.total_fee,
      'Amount Paid': s.total_paid,
      Balance: s.remaining,
      Status: s.remaining <= 0 ? 'Fully Paid' : 'Outstanding',
      'Payment Progress': `${Math.round(s.total_paid / s.total_fee * 100)}%`
    }));
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_balances_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccess('Student balances exported successfully');
    setTimeout(() => setSuccess(null), 3000);
  };
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || s.class_id === filterClass;
    const matchesStatus = filterStatus === 'all' || filterStatus === 'paid' && s.remaining <= 0 || filterStatus === 'outstanding' && s.remaining > 0;
    return matchesSearch && matchesClass && matchesStatus;
  });
  const totalFees = filteredStudents.reduce((sum, s) => sum + s.total_fee, 0);
  const totalPaid = filteredStudents.reduce((sum, s) => sum + s.total_paid, 0);
  const totalOutstanding = filteredStudents.reduce((sum, s) => sum + s.remaining, 0);
  const columns = [{
    header: 'Admission No.',
    accessor: 'admission_number' as const,
    render: (row: any) => <span className="text-sm font-medium">
          {row.admission_number || 'N/A'}
        </span>
  }, {
    header: 'Student Name',
    accessor: 'full_name' as const,
    render: (row: any) => <div>
          <p className="font-medium text-slate-900">{row.full_name}</p>
          <p className="text-xs text-slate-500">{row.classes?.name}</p>
        </div>
  }, {
    header: 'Total Fee',
    accessor: 'total_fee' as const,
    render: (row: any) => <span className="text-sm">{formatCurrency(row.total_fee)}</span>
  }, {
    header: 'Paid',
    accessor: 'total_paid' as const,
    render: (row: any) => <div>
          <p className="text-sm font-medium text-green-600">
            {formatCurrency(row.total_paid)}
          </p>
          <p className="text-xs text-slate-500">
            {Math.round(row.total_paid / row.total_fee * 100)}%
          </p>
        </div>
  }, {
    header: 'Balance',
    accessor: 'remaining' as const,
    render: (row: any) => <Badge variant={row.remaining <= 0 ? 'success' : 'warning'}>
          {formatCurrency(row.remaining)}
        </Badge>
  }, {
    header: 'Status',
    accessor: 'remaining' as const,
    render: (row: any) => <Badge variant={row.remaining <= 0 ? 'success' : 'warning'}>
          {row.remaining <= 0 ? 'Fully Paid' : 'Outstanding'}
        </Badge>
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: any) => <Button size="sm" variant="secondary" onClick={() => navigate(`/dashboard/students/${row.id}`)} leftIcon={<Eye className="w-4 h-4" />}>
          View
        </Button>
  }];
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Student Balances
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            View and manage all student payment balances
          </p>
        </div>
        <Button variant="primary" leftIcon={<Download className="w-4 h-4" />} onClick={exportToCSV} disabled={filteredStudents.length === 0} className="w-full sm:w-auto">
          Export to CSV
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-blue-700">
                Total Fees
              </p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900 mt-1 truncate">
                {formatCurrency(totalFees)}
              </p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-xl flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-green-700">
                Total Paid
              </p>
              <p className="text-xl sm:text-2xl font-bold text-green-900 mt-1 truncate">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-xl flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-amber-700">
                Outstanding
              </p>
              <p className="text-xl sm:text-2xl font-bold text-amber-900 mt-1 truncate">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
            <div className="bg-amber-100 p-2 sm:p-3 rounded-xl flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <Input placeholder="Search by name or admission number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
          </div>
          <Select value={filterClass} onChange={e => setFilterClass(e.target.value)} options={[{
          value: '',
          label: 'All Classes'
        }, ...classes.map(c => ({
          value: c.id,
          label: c.name
        }))]} />
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={[{
          value: 'all',
          label: 'All Status'
        }, {
          value: 'paid',
          label: 'Fully Paid'
        }, {
          value: 'outstanding',
          label: 'Outstanding'
        }]} />
        </div>
      </Card>

      {/* Students Table */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            {filteredStudents.length} Student
            {filteredStudents.length !== 1 ? 's' : ''}
          </h3>
        </div>

        {filteredStudents.length > 0 ? <div className="overflow-x-auto">
            <Table data={filteredStudents} columns={columns} />
          </div> : <div className="text-center py-12 text-slate-500">
            <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm sm:text-base">
              No students found matching your filters
            </p>
          </div>}
      </Card>
    </div>;
}