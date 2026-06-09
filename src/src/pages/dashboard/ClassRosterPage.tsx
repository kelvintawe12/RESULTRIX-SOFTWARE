import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { TransferStudentsForm } from '../../components/forms/TransferStudentsForm';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { downloadCSV } from '../../utils/csvExport';
import { ArrowLeft, Users, BookOpen, UserCheck, DollarSign, Eye, ArrowRightLeft, Download } from 'lucide-react';

export function ClassRosterPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [totalFees, setTotalFees] = useState(0);
  const [currencyCode, setCurrencyCode] = useState('USD');

  // Single-student move dialog
  const [moveIds, setMoveIds] = useState<string[]>([]);
  const [showMove, setShowMove] = useState(false);

  useEffect(() => {
    if (user?.school_id && id) fetchRoster();
  }, [user?.school_id, id]);

  const fetchRoster = async () => {
    try {
      setLoading(true);
      setError(null);
      const [classRes, studentsRes, teachersRes, subjectsRes, feesRes, schoolRes] = await Promise.all([
        supabase.from('classes').select('id, name, description').eq('id', id).eq('school_id', user?.school_id).maybeSingle(),
        supabase.from('students').select('id, full_name, admission_number, gender, remaining, total_paid').eq('class_id', id).eq('school_id', user?.school_id).order('full_name'),
        supabase.from('teacher_assignments').select('teacher_id, teachers!inner(full_name)').eq('class_id', id),
        supabase.from('subjects').select('id, name').eq('class_id', id),
        supabase.from('fee_structures').select('amount').eq('class_id', id),
        supabase.from('schools').select('currency_code').eq('id', user?.school_id).maybeSingle()
      ]);
      if (classRes.error) throw classRes.error;
      if (!classRes.data) throw new Error('Class not found.');

      setClassInfo(classRes.data);
      setStudents(studentsRes.data || []);
      setSubjects(subjectsRes.data || []);
      // Distinct teacher names.
      const names = new Set<string>();
      (teachersRes.data || []).forEach((t: any) => t.teachers?.full_name && names.add(t.teachers.full_name));
      setTeachers(Array.from(names));
      setTotalFees((feesRes.data || []).reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0));
      setCurrencyCode(schoolRes.data?.currency_code || 'USD');
    } catch (err: any) {
      console.error('Error loading roster:', err);
      setError(err.message || 'Failed to load class roster.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  const openMove = (studentId: string) => {
    setMoveIds([studentId]);
    setShowMove(true);
  };

  const handleExport = () => {
    const rows = students.map(s => ({
      'Admission Number': s.admission_number || 'N/A',
      'Full Name': s.full_name,
      Gender: s.gender || 'N/A',
      Balance: s.remaining,
      Class: classInfo?.name || ''
    }));
    downloadCSV(rows, `roster_${(classInfo?.name || 'class').replace(/\s+/g, '_')}.csv`);
  };

  const columns = [
    {
      header: 'Student',
      accessor: 'full_name',
      render: (row: any) => (
        <div>
          <div className="font-medium text-slate-900">{row.full_name}</div>
          <div className="text-xs text-slate-500 font-mono">{row.admission_number || 'No ID'}</div>
        </div>
      )
    },
    {
      header: 'Gender',
      accessor: 'gender',
      render: (row: any) => <span className="capitalize text-slate-600">{row.gender || '—'}</span>
    },
    {
      header: 'Status',
      accessor: 'remaining',
      render: (row: any) => {
        const isPaid = row.remaining <= 0;
        const isPartial = row.total_paid > 0 && row.remaining > 0;
        return <Badge variant={isPaid ? 'success' : isPartial ? 'warning' : 'secondary'}>{isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'}</Badge>;
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/dashboard/students/${row.id}`)} leftIcon={<Eye className="w-4 h-4" />}>
            View
          </Button>
          <Button size="sm" variant="secondary" onClick={() => openMove(row.id)} leftIcon={<ArrowRightLeft className="w-4 h-4" />}>
            Move
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" onClick={() => navigate('/dashboard/classes')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Classes
        </Button>
        <Alert variant="error" title="Error" message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button variant="link" onClick={() => navigate('/dashboard/classes')} leftIcon={<ArrowLeft className="w-4 h-4" />} className="mb-1">
            Back to Classes
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">{classInfo?.name}</h1>
          {classInfo?.description && <p className="text-slate-500 mt-1">{classInfo.description}</p>}
        </div>
        <Button variant="secondary" onClick={handleExport} leftIcon={<Download className="w-4 h-4" />}>
          Export Roster
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Students" value={students.length.toLocaleString()} icon={Users} color="blue" />
        <MetricCard title="Subjects" value={subjects.length.toLocaleString()} icon={BookOpen} color="green" />
        <MetricCard title="Teachers" value={teachers.length.toLocaleString()} icon={UserCheck} color="purple" />
        <MetricCard title="Total Fees" value={formatCurrency(totalFees)} icon={DollarSign} color="amber" />
      </div>

      {/* Subjects & Teachers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Assigned Subjects">
          <div className="flex flex-wrap gap-2 mt-2">
            {subjects.length ? subjects.map(s => <Badge key={s.id} variant="secondary">{s.name}</Badge>) : <span className="text-slate-400 text-sm">No subjects assigned.</span>}
          </div>
        </Card>
        <Card title="Class Teachers">
          <div className="flex flex-wrap gap-2 mt-2">
            {teachers.length ? teachers.map(t => <Badge key={t} variant="secondary">{t}</Badge>) : <span className="text-slate-400 text-sm">No teachers assigned.</span>}
          </div>
        </Card>
      </div>

      {/* Roster */}
      <Card title={`Roster (${students.length})`} className="overflow-hidden">
        {students.length ? (
          <Table data={students} columns={columns} />
        ) : (
          <div className="text-center py-12 text-slate-500">No students in this class yet.</div>
        )}
      </Card>

      <TransferStudentsForm
        isOpen={showMove}
        onClose={() => setShowMove(false)}
        onSuccess={fetchRoster}
        studentIds={moveIds}
        currentClassId={id}
      />
    </div>
  );
}
