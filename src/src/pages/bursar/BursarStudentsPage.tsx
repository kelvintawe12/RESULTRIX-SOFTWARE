import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Table } from '../../components/ui/Table';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Edit, Trash2, Users, Search, Filter, Download, Upload, Eye, DollarSign } from 'lucide-react';
export function BursarStudentsPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all'); // all, paid, partial, pending
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'male',
    admission_number: '',
    class_id: '',
    academic_year_id: '',
    email: '',
    phone: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: 'parent'
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user?.school_id]);
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch classes
      const {
        data: classesData,
        error: classesError
      } = await supabase.from('classes').select('id, name').eq('school_id', user?.school_id).order('name');
      if (classesError) throw classesError;
      setClasses(classesData || []);
      // Fetch academic years
      const {
        data: yearsData,
        error: yearsError
      } = await supabase.from('academic_years').select('id, year_name').eq('school_id', user?.school_id).order('start_date', {
        ascending: false
      });
      if (yearsError) throw yearsError;
      setAcademicYears(yearsData || []);
      // Fetch students
      const {
        data: studentsData,
        error: studentsError
      } = await supabase.from('students').select(`
          id,
          full_name,
          admission_number,
          date_of_birth,
          gender,
          email,
          phone,
          total_fee,
          total_paid,
          remaining,
          class_id,
          classes (name),
          academic_years (year_name)
        `).eq('school_id', user?.school_id).order('full_name');
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const handleOpenDialog = (student?: any) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        full_name: student.full_name,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
        admission_number: student.admission_number,
        class_id: student.class_id,
        academic_year_id: student.academic_year_id,
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        guardian_name: '',
        guardian_phone: '',
        guardian_email: '',
        guardian_relationship: 'parent'
      });
    } else {
      setEditingStudent(null);
      setFormData({
        full_name: '',
        date_of_birth: '',
        gender: 'male',
        admission_number: '',
        class_id: '',
        academic_year_id: academicYears[0]?.id || '',
        email: '',
        phone: '',
        address: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_email: '',
        guardian_relationship: 'parent'
      });
    }
    setShowDialog(true);
  };
  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingStudent(null);
  };
  const handleSaveStudent = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      if (!formData.full_name || !formData.date_of_birth || !formData.class_id || !formData.academic_year_id) {
        throw new Error('Please fill in all required fields');
      }
      if (editingStudent) {
        // Update existing student
        const {
          error: updateError
        } = await supabase.from('students').update({
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          admission_number: formData.admission_number,
          class_id: formData.class_id,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        }).eq('id', editingStudent.id);
        if (updateError) throw updateError;
        setSuccess('Student updated successfully');
      } else {
        // Get fee structure for the class
        const {
          data: feeData
        } = await supabase.from('fee_structures').select('amount').eq('class_id', formData.class_id).single();
        const totalFee = feeData?.amount || 0;
        // Create new student
        const {
          data: studentData,
          error: insertError
        } = await supabase.from('students').insert({
          school_id: user?.school_id,
          academic_year_id: formData.academic_year_id,
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          admission_number: formData.admission_number,
          class_id: formData.class_id,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          total_fee: totalFee,
          total_paid: 0,
          remaining: totalFee
        }).select().single();
        if (insertError) throw insertError;
        // Add guardian if provided
        if (formData.guardian_name && formData.guardian_phone && formData.guardian_email) {
          const {
            error: guardianError
          } = await supabase.from('guardians').insert({
            student_id: studentData.id,
            full_name: formData.guardian_name,
            phone: formData.guardian_phone,
            email: formData.guardian_email,
            relationship: formData.guardian_relationship
          });
          if (guardianError) throw guardianError;
        }
        setSuccess('Student enrolled successfully');
      }
      handleCloseDialog();
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving student:', err);
      setError(err.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    try {
      setError(null);
      const {
        error: deleteError
      } = await supabase.from('students').delete().eq('id', studentId);
      if (deleteError) throw deleteError;
      setSuccess('Student deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting student:', err);
      setError(err.message || 'Failed to delete student');
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  // Filter students
  let filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || s.class_id === filterClass;
    const matchesPaymentStatus = filterPaymentStatus === 'all' || filterPaymentStatus === 'paid' && s.remaining <= 0 || filterPaymentStatus === 'partial' && s.total_paid > 0 && s.remaining > 0 || filterPaymentStatus === 'pending' && s.total_paid === 0;
    return matchesSearch && matchesClass && matchesPaymentStatus;
  });
  const columns = [{
    header: 'Student',
    accessor: 'full_name' as const,
    render: (row: any) => <div>
          <p className="font-medium text-slate-900">{row.full_name}</p>
          <p className="text-xs text-slate-500">{row.admission_number}</p>
        </div>
  }, {
    header: 'Class',
    accessor: 'classes' as const,
    render: (row: any) => <Badge variant="secondary">{row.classes?.name}</Badge>
  }, {
    header: 'Total Fee',
    accessor: 'total_fee' as const,
    render: (row: any) => <span className="text-sm">{formatCurrency(row.total_fee)}</span>
  }, {
    header: 'Paid',
    accessor: 'total_paid' as const,
    render: (row: any) => <span className="text-sm text-green-600 font-medium">
          {formatCurrency(row.total_paid)}
        </span>
  }, {
    header: 'Balance',
    accessor: 'remaining' as const,
    render: (row: any) => <Badge variant={row.remaining > 0 ? 'warning' : 'success'}>
          {formatCurrency(row.remaining)}
        </Badge>
  }, {
    header: 'Actions',
    accessor: 'id' as const,
    render: (row: any) => <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleOpenDialog(row)} leftIcon={<Edit className="w-4 h-4" />}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteStudent(row.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
            Delete
          </Button>
        </div>
  }];
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Student Management
          </h1>
          <p className="text-slate-500 mt-1">Enroll and manage students</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenDialog()}>
          Enroll Student
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Total Students
              </p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {students.length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Fully Paid</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {students.filter(s => s.remaining <= 0).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">
                Partial Payment
              </p>
              <p className="text-3xl font-bold text-amber-900 mt-1">
                {students.filter(s => s.total_paid > 0 && s.remaining > 0).length}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-white border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">No Payment</p>
              <p className="text-3xl font-bold text-red-900 mt-1">
                {students.filter(s => s.total_paid === 0).length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Search by name or admission number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>
                {c.name}
              </option>)}
          </select>
          <select value={filterPaymentStatus} onChange={e => setFilterPaymentStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Payment Status</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partial Payment</option>
            <option value="pending">No Payment</option>
          </select>
        </div>
      </Card>

      {/* Students Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Students ({filteredStudents.length})
        </h3>

        {filteredStudents.length > 0 ? <Table data={filteredStudents} columns={columns} /> : <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No students found</p>
          </div>}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog isOpen={showDialog} onClose={handleCloseDialog} title={editingStudent ? 'Edit Student' : 'Enroll New Student'}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name *" value={formData.full_name} onChange={e => setFormData({
            ...formData,
            full_name: e.target.value
          })} placeholder="Enter full name" required />

            <Input label="Admission Number" value={formData.admission_number} onChange={e => setFormData({
            ...formData,
            admission_number: e.target.value
          })} placeholder="Enter admission number" />

            <Input label="Date of Birth *" type="date" value={formData.date_of_birth} onChange={e => setFormData({
            ...formData,
            date_of_birth: e.target.value
          })} required />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Gender *
              </label>
              <select value={formData.gender} onChange={e => setFormData({
              ...formData,
              gender: e.target.value
            })} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Class *
              </label>
              <select value={formData.class_id} onChange={e => setFormData({
              ...formData,
              class_id: e.target.value
            })} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select class...</option>
                {classes.map(c => <option key={c.id} value={c.id}>
                    {c.name}
                  </option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Academic Year *
              </label>
              <select value={formData.academic_year_id} onChange={e => setFormData({
              ...formData,
              academic_year_id: e.target.value
            })} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select year...</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>
                    {y.year_name}
                  </option>)}
              </select>
            </div>

            <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({
            ...formData,
            email: e.target.value
          })} placeholder="student@example.com" />

            <Input label="Phone" type="tel" value={formData.phone} onChange={e => setFormData({
            ...formData,
            phone: e.target.value
          })} placeholder="+1234567890" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Address
            </label>
            <textarea value={formData.address} onChange={e => setFormData({
            ...formData,
            address: e.target.value
          })} placeholder="Enter address" rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {!editingStudent && <>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">
                  Guardian Information (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Guardian Name" value={formData.guardian_name} onChange={e => setFormData({
                ...formData,
                guardian_name: e.target.value
              })} placeholder="Enter guardian name" />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Relationship
                    </label>
                    <select value={formData.guardian_relationship} onChange={e => setFormData({
                  ...formData,
                  guardian_relationship: e.target.value
                })} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="parent">Parent</option>
                      <option value="guardian">Guardian</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <Input label="Guardian Phone" type="tel" value={formData.guardian_phone} onChange={e => setFormData({
                ...formData,
                guardian_phone: e.target.value
              })} placeholder="+1234567890" />

                  <Input label="Guardian Email" type="email" value={formData.guardian_email} onChange={e => setFormData({
                ...formData,
                guardian_email: e.target.value
              })} placeholder="guardian@example.com" />
                </div>
              </div>
            </>}

          <div className="flex gap-3 pt-4">
            <Button variant="primary" onClick={handleSaveStudent} isLoading={saving} disabled={!formData.full_name || !formData.date_of_birth || !formData.class_id || !formData.academic_year_id} className="flex-1">
              {editingStudent ? 'Update' : 'Enroll'} Student
            </Button>
            <Button variant="secondary" onClick={handleCloseDialog} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>;
}