import React, { useEffect, useState, createElement } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Download, Users, DollarSign, TrendingUp } from 'lucide-react';
export function ClassPaymentsPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [classData, setClassData] = useState<any[]>([]);
  const [schoolCurrency, setSchoolCurrency] = useState('KES');
  useEffect(() => {
    if (user?.school_id) {
      fetchClassPayments();
    }
  }, [user?.school_id]);
  const fetchClassPayments = async () => {
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
      // For each class, calculate payment statistics
      const classStats = await Promise.all((classesData || []).map(async classItem => {
        // Get students in this class
        const {
          data: studentsData,
          error: studentsError
        } = await supabase.from('students').select('id, total_fee, total_paid, remaining').eq('class_id', classItem.id).eq('school_id', user?.school_id);
        if (studentsError) throw studentsError;
        const totalStudents = studentsData?.length || 0;
        const totalFees = studentsData?.reduce((sum, s) => sum + s.total_fee, 0) || 0;
        const totalPaid = studentsData?.reduce((sum, s) => sum + s.total_paid, 0) || 0;
        const totalOutstanding = studentsData?.reduce((sum, s) => sum + s.remaining, 0) || 0;
        const paidStudents = studentsData?.filter(s => s.remaining <= 0).length || 0;
        const collectionRate = totalFees > 0 ? totalPaid / totalFees * 100 : 0;
        return {
          ...classItem,
          totalStudents,
          totalFees,
          totalPaid,
          totalOutstanding,
          paidStudents,
          collectionRate
        };
      }));
      setClassData(classStats);
    } catch (err: any) {
      console.error('Error fetching class payments:', err);
      setError(err.message || 'Failed to load class payment data');
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
  const exportClassData = () => {
    const csvData = classData.map(c => ({
      Class: c.name,
      'Total Students': c.totalStudents,
      'Students Paid': c.paidStudents,
      'Total Fees': c.totalFees,
      'Amount Collected': c.totalPaid,
      Outstanding: c.totalOutstanding,
      'Collection Rate': `${Math.round(c.collectionRate)}%`
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
    a.download = `class_payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccess('Class payment data exported successfully');
    setTimeout(() => setSuccess(null), 3000);
  };
  const overallStats = {
    totalStudents: classData.reduce((sum, c) => sum + c.totalStudents, 0),
    totalFees: classData.reduce((sum, c) => sum + c.totalFees, 0),
    totalPaid: classData.reduce((sum, c) => sum + c.totalPaid, 0),
    totalOutstanding: classData.reduce((sum, c) => sum + c.totalOutstanding, 0)
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Class Payments</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            View payment statistics by class
          </p>
        </div>
        <Button variant="primary" leftIcon={<Download className="w-4 h-4" />} onClick={exportClassData} disabled={classData.length === 0} className="w-full sm:w-auto">
          Export to CSV
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Overall Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500">
                Total Students
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {overallStats.totalStudents}
              </p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500">Total Fees</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">
                {formatCurrency(overallStats.totalFees)}
              </p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500">Collected</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">
                {formatCurrency(overallStats.totalPaid)}
              </p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-slate-500">Outstanding</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">
                {formatCurrency(overallStats.totalOutstanding)}
              </p>
            </div>
            <div className="bg-amber-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Class Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {classData.map(classItem => <Card key={classItem.id} className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {classItem.name}
              </h3>
              <Badge variant={classItem.collectionRate >= 80 ? 'success' : classItem.collectionRate >= 50 ? 'warning' : 'error'} className="flex-shrink-0 text-xs">
                {Math.round(classItem.collectionRate)}% Collected
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span className="text-slate-600">Collection Progress</span>
                  <span className="font-medium text-slate-900 truncate ml-2">
                    {formatCurrency(classItem.totalPaid)} /{' '}
                    {formatCurrency(classItem.totalFees)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3">
                  <div className={`h-2 sm:h-3 rounded-full transition-all ${classItem.collectionRate >= 80 ? 'bg-green-600' : classItem.collectionRate >= 50 ? 'bg-amber-600' : 'bg-rose-600'}`} style={{
                width: `${Math.min(classItem.collectionRate, 100)}%`
              }} />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600">Total Students</p>
                  <p className="text-base sm:text-lg font-bold text-slate-900">
                    {classItem.totalStudents}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600">Fully Paid</p>
                  <p className="text-base sm:text-lg font-bold text-green-600">
                    {classItem.paidStudents}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600">Amount Collected</p>
                  <p className="text-xs sm:text-sm font-bold text-green-600 truncate">
                    {formatCurrency(classItem.totalPaid)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600">Outstanding</p>
                  <p className="text-xs sm:text-sm font-bold text-amber-600 truncate">
                    {formatCurrency(classItem.totalOutstanding)}
                  </p>
                </div>
              </div>
            </div>
          </Card>)}
      </div>

      {classData.length === 0 && <Card className="p-8 sm:p-12">
          <div className="text-center">
            <div className="bg-slate-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
              No Classes Found
            </h3>
            <p className="text-sm sm:text-base text-slate-500">
              Add classes to view payment statistics
            </p>
          </div>
        </Card>}
    </div>;
}