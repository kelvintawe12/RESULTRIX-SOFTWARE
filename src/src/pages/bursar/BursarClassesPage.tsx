import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Edit, Trash2, Users, Save, Search, DollarSign, TrendingUp, GraduationCap } from 'lucide-react';
export function BursarClassesPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [schoolCurrency, setSchoolCurrency] = useState('KES');
  const [showDialog, setShowDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchClasses();
    }
  }, [user?.school_id]);
  const fetchClasses = async () => {
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
      const {
        data,
        error: fetchError
      } = await supabase.from('classes').select('*').eq('school_id', user?.school_id).order('name');
      if (fetchError) throw fetchError;
      // Get student count and fee info for each class
      const classesWithData = await Promise.all((data || []).map(async classItem => {
        // Get student count
        const {
          count
        } = await supabase.from('students').select('*', {
          count: 'exact',
          head: true
        }).eq('class_id', classItem.id);
        // Get fee structure
        const {
          data: feeData
        } = await supabase.from('fee_structures').select('amount, currency_code').eq('class_id', classItem.id).single();
        return {
          ...classItem,
          studentCount: count || 0,
          feeAmount: feeData?.amount || 0,
          hasFeeStructure: !!feeData
        };
      }));
      setClasses(classesWithData);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };
  const handleOpenDialog = (classItem?: any) => {
    if (classItem) {
      setEditingClass(classItem);
      setFormData({
        name: classItem.name,
        description: classItem.description || ''
      });
    } else {
      setEditingClass(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setShowDialog(true);
  };
  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingClass(null);
    setFormData({
      name: '',
      description: ''
    });
  };
  const handleSaveClass = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      if (!formData.name.trim()) {
        throw new Error('Please enter a class name');
      }
      if (editingClass) {
        const {
          error: updateError
        } = await supabase.from('classes').update({
          name: formData.name.trim(),
          description: formData.description.trim()
        }).eq('id', editingClass.id);
        if (updateError) throw updateError;
        setSuccess('Class updated successfully');
      } else {
        const {
          error: insertError
        } = await supabase.from('classes').insert({
          school_id: user?.school_id,
          name: formData.name.trim(),
          description: formData.description.trim()
        });
        if (insertError) throw insertError;
        setSuccess('Class created successfully');
      }
      handleCloseDialog();
      fetchClasses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving class:', err);
      setError(err.message || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteClass = async (classId: string, studentCount: number) => {
    if (studentCount > 0) {
      setError('Cannot delete class with enrolled students');
      return;
    }
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      setError(null);
      const {
        error: deleteError
      } = await supabase.from('classes').delete().eq('id', classId);
      if (deleteError) throw deleteError;
      setSuccess('Class deleted successfully');
      fetchClasses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting class:', err);
      setError(err.message || 'Failed to delete class');
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
  // Filter and sort
  let filteredClasses = classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.description?.toLowerCase().includes(searchTerm.toLowerCase()));
  filteredClasses.sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'students') {
      return b.studentCount - a.studentCount;
    } else if (sortBy === 'fee') {
      return b.feeAmount - a.feeAmount;
    }
    return 0;
  });
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const classesWithFees = classes.filter(c => c.hasFeeStructure).length;
  const totalRevenue = classes.reduce((sum, c) => sum + c.feeAmount * c.studentCount, 0);
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Class Management
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Organize and manage all classes
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          Add Class
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-purple-700">
                Total Classes
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-1">
                {classes.length}
              </p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-xl flex-shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-blue-700">
                Total Students
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-1">
                {totalStudents}
              </p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-xl flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-green-700">
                With Fee Structure
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-1">
                {classesWithFees}
              </p>
              <p className="text-xs text-green-600 mt-1">
                of {classes.length} classes
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
                Expected Revenue
              </p>
              <p className="text-xl sm:text-2xl font-bold text-amber-900 mt-1 truncate">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="bg-amber-100 p-2 sm:p-3 rounded-xl flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input placeholder="Search classes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="name">Sort by Name</option>
            <option value="students">Sort by Students</option>
            <option value="fee">Sort by Fee Amount</option>
          </select>
        </div>
      </Card>

      {/* Classes Grid */}
      {classes.length === 0 ? <Card className="p-8 sm:p-12">
          <div className="text-center">
            <div className="bg-slate-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
              No Classes Yet
            </h3>
            <p className="text-sm sm:text-base text-slate-500 mb-4">
              Create your first class to start organizing students
            </p>
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
              Add Class
            </Button>
          </div>
        </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredClasses.map(classItem => <Card key={classItem.id} className="p-4 sm:p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {classItem.name}
                  </h3>
                  {classItem.description && <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">
                      {classItem.description}
                    </p>}
                </div>
                <Badge variant={classItem.hasFeeStructure ? 'success' : 'secondary'} className="ml-2 flex-shrink-0 text-xs">
                  {classItem.hasFeeStructure ? 'Configured' : 'No Fee'}
                </Badge>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                    <span className="text-xs sm:text-sm text-slate-600">
                      Students
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {classItem.studentCount}
                  </span>
                </div>

                {classItem.hasFeeStructure && <>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        <span className="text-xs sm:text-sm text-slate-600">
                          Fee
                        </span>
                      </div>
                      <span className="font-bold text-green-600 text-sm sm:text-base truncate ml-2">
                        {formatCurrency(classItem.feeAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        <span className="text-xs sm:text-sm text-slate-600">
                          Revenue
                        </span>
                      </div>
                      <span className="font-bold text-purple-600 text-sm sm:text-base truncate ml-2">
                        {formatCurrency(classItem.feeAmount * classItem.studentCount)}
                      </span>
                    </div>
                  </>}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleOpenDialog(classItem)} leftIcon={<Edit className="w-3 h-3 sm:w-4 sm:h-4" />} className="flex-1 text-xs sm:text-sm">
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteClass(classItem.id, classItem.studentCount)} leftIcon={<Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />} disabled={classItem.studentCount > 0} className="text-xs sm:text-sm">
                  Delete
                </Button>
              </div>
            </Card>)}
        </div>}

      {filteredClasses.length === 0 && classes.length > 0 && <Card className="p-8 sm:p-12">
          <div className="text-center">
            <div className="bg-slate-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
              No Results Found
            </h3>
            <p className="text-sm sm:text-base text-slate-500">
              Try adjusting your search term
            </p>
          </div>
        </Card>}

      {/* Add/Edit Dialog */}
      <Dialog isOpen={showDialog} onClose={handleCloseDialog} title={editingClass ? 'Edit Class' : 'Add New Class'}>
        <div className="space-y-4">
          <Input label="Class Name" value={formData.name} onChange={e => setFormData({
          ...formData,
          name: e.target.value
        })} placeholder="E.g., Form 1A, Grade 10, Year 7" required />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea value={formData.description} onChange={e => setFormData({
            ...formData,
            description: e.target.value
          })} placeholder="E.g., Science stream, Arts stream, etc." rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="primary" onClick={handleSaveClass} isLoading={saving} disabled={!formData.name.trim()} leftIcon={<Save className="w-4 h-4" />} className="flex-1">
              {editingClass ? 'Update' : 'Create'} Class
            </Button>
            <Button variant="secondary" onClick={handleCloseDialog} disabled={saving} className="sm:w-auto">
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>;
}