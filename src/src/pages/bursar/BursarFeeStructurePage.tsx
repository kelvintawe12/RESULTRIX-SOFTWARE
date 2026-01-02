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
import { Plus, Edit, Trash2, DollarSign, Save, Search, Filter, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';
export function BursarFeeStructurePage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [schoolCurrency, setSchoolCurrency] = useState('USD');
  const [showDialog, setShowDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [formData, setFormData] = useState({
    class_id: '',
    amount: '',
    description: ''
  });
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
      if (schoolError) {
        console.error('School fetch error:', schoolError);
        throw schoolError;
      }
      setSchoolCurrency(schoolData?.currency_code || 'USD');
      // Fetch classes with student counts
      const {
        data: classesData,
        error: classesError
      } = await supabase.from('classes').select('id, name, description').eq('school_id', user?.school_id).order('name');
      if (classesError) {
        console.error('Classes fetch error:', classesError);
        throw classesError;
      }
      // Get student counts
      const classesWithCounts = await Promise.all((classesData || []).map(async classItem => {
        const {
          count
        } = await supabase.from('students').select('*', {
          count: 'exact',
          head: true
        }).eq('class_id', classItem.id);
        return {
          ...classItem,
          studentCount: count || 0
        };
      }));
      setClasses(classesWithCounts);
      // Fetch fee structures
      if (classesData && classesData.length > 0) {
        const {
          data: feesData,
          error: feesError
        } = await supabase.from('fee_structures').select('*').in('class_id', classesData.map(c => c.id)).order('created_at', {
          ascending: false
        });
        if (feesError) {
          console.error('Fee structures fetch error:', feesError);
          throw feesError;
        }
        // Manually join with classes data
        const feesWithClasses = (feesData || []).map(fee => {
          const classData = classesWithCounts.find(c => c.id === fee.class_id);
          return {
            ...fee,
            class_name: classData?.name || 'Unknown',
            studentCount: classData?.studentCount || 0
          };
        });
        setFeeStructures(feesWithClasses);
      } else {
        setFeeStructures([]);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };
  const formatCurrency = (amount: number, currency: string = schoolCurrency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  const handleOpenDialog = (fee?: any) => {
    if (fee) {
      setEditingFee(fee);
      setFormData({
        class_id: fee.class_id,
        amount: fee.amount.toString(),
        description: fee.description || ''
      });
    } else {
      setEditingFee(null);
      setFormData({
        class_id: '',
        amount: '',
        description: ''
      });
    }
    setShowDialog(true);
    setError(null); // Clear any previous errors
  };
  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingFee(null);
    setFormData({
      class_id: '',
      amount: '',
      description: ''
    });
    setError(null);
  };
  const handleSaveFee = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      console.log('Form data:', formData);
      console.log('School currency:', schoolCurrency);
      // Validation
      if (!formData.class_id) {
        throw new Error('Please select a class');
      }
      if (!formData.amount || formData.amount.trim() === '') {
        throw new Error('Please enter a fee amount');
      }
      const amount = parseFloat(formData.amount);
      console.log('Parsed amount:', amount);
      if (isNaN(amount)) {
        throw new Error('Please enter a valid number for the amount');
      }
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }
      if (editingFee) {
        // Update existing fee structure
        console.log('Updating fee structure:', editingFee.id);
        const updateData = {
          amount: amount,
          description: formData.description || null,
          currency_code: schoolCurrency
        };
        console.log('Update data:', updateData);
        const {
          data: updateResult,
          error: updateError
        } = await supabase.from('fee_structures').update(updateData).eq('id', editingFee.id).select();
        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(`Failed to update: ${updateError.message}`);
        }
        console.log('Update result:', updateResult);
        setSuccess('Fee structure updated successfully');
      } else {
        // Check if fee structure already exists for this class
        const existing = feeStructures.find(f => f.class_id === formData.class_id);
        if (existing) {
          throw new Error('Fee structure already exists for this class. Please edit the existing one.');
        }
        // Create new fee structure
        console.log('Creating new fee structure');
        const insertData = {
          class_id: formData.class_id,
          amount: amount,
          currency_code: schoolCurrency,
          description: formData.description || null
        };
        console.log('Insert data:', insertData);
        const {
          data: insertResult,
          error: insertError
        } = await supabase.from('fee_structures').insert(insertData).select();
        if (insertError) {
          console.error('Insert error:', insertError);
          console.error('Insert error details:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          throw new Error(`Failed to create: ${insertError.message}`);
        }
        console.log('Insert result:', insertResult);
        setSuccess('Fee structure created successfully');
      }
      handleCloseDialog();
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving fee structure:', err);
      setError(err.message || 'Failed to save fee structure');
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteFee = async (feeId: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    try {
      setError(null);
      const {
        error: deleteError
      } = await supabase.from('fee_structures').delete().eq('id', feeId);
      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }
      setSuccess('Fee structure deleted successfully');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting fee structure:', err);
      setError(err.message || 'Failed to delete fee structure');
    }
  };
  // Filter and sort logic
  const classesWithoutFees = classes.filter(c => !feeStructures.some(f => f.class_id === c.id));
  let filteredClasses = [...classes];
  // Apply search filter
  if (searchTerm) {
    filteredClasses = filteredClasses.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }
  // Apply status filter
  if (filterStatus === 'configured') {
    filteredClasses = filteredClasses.filter(c => feeStructures.some(f => f.class_id === c.id));
  } else if (filterStatus === 'not_configured') {
    filteredClasses = filteredClasses.filter(c => !feeStructures.some(f => f.class_id === c.id));
  }
  // Apply sorting
  filteredClasses.sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'amount') {
      const feeA = feeStructures.find(f => f.class_id === a.id)?.amount || 0;
      const feeB = feeStructures.find(f => f.class_id === b.id)?.amount || 0;
      return feeB - feeA;
    } else if (sortBy === 'students') {
      return b.studentCount - a.studentCount;
    }
    return 0;
  });
  const totalFeeRevenue = feeStructures.reduce((sum, fee) => sum + fee.amount * fee.studentCount, 0);
  const averageFee = feeStructures.length > 0 ? feeStructures.reduce((sum, f) => sum + f.amount, 0) / feeStructures.length : 0;
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Fee Structure Management
          </h1>
          <p className="text-slate-500 mt-1">
            Configure and manage fee structures for all classes
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenDialog()} disabled={classes.length === 0}>
          Add Fee Structure
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Classes</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {classes.length}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {feeStructures.length} configured
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
              <p className="text-sm font-medium text-green-700">Average Fee</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {formatCurrency(averageFee)}
              </p>
              <p className="text-xs text-green-600 mt-1">Per class</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">
                Expected Revenue
              </p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {formatCurrency(totalFeeRevenue)}
              </p>
              <p className="text-xs text-purple-600 mt-1">Total potential</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">
                Not Configured
              </p>
              <p className="text-3xl font-bold text-amber-900 mt-1">
                {classesWithoutFees.length}
              </p>
              <p className="text-xs text-amber-600 mt-1">Classes pending</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-xl">
              <XCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            Filters & Search
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Search classes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Classes</option>
            <option value="configured">Configured Only</option>
            <option value="not_configured">Not Configured</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="name">Sort by Name</option>
            <option value="amount">Sort by Amount</option>
            <option value="students">Sort by Students</option>
          </select>
        </div>
      </Card>

      {/* Classes Grid */}
      {classes.length === 0 ? <Card className="p-12">
          <div className="text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Classes Found
            </h3>
            <p className="text-slate-500 mb-4">
              You need to create classes first before setting up fee structures
            </p>
          </div>
        </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map(classItem => {
        const fee = feeStructures.find(f => f.class_id === classItem.id);
        const hasConfiguration = !!fee;
        return <Card key={classItem.id} className={`p-6 hover:shadow-lg transition-all ${hasConfiguration ? 'border-green-200 bg-gradient-to-br from-green-50 to-white' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {classItem.name}
                    </h3>
                    {classItem.description && <p className="text-sm text-slate-600 mt-1">
                        {classItem.description}
                      </p>}
                  </div>
                  <Badge variant={hasConfiguration ? 'success' : 'warning'}>
                    {hasConfiguration ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {hasConfiguration ? 'Configured' : 'Pending'}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm text-slate-600">Students</span>
                    <span className="font-bold text-slate-900">
                      {classItem.studentCount}
                    </span>
                  </div>

                  {hasConfiguration ? <>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-sm text-slate-600">
                          Fee Amount
                        </span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(fee.amount, fee.currency_code)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="text-sm text-slate-600">
                          Expected Revenue
                        </span>
                        <span className="font-bold text-purple-600">
                          {formatCurrency(fee.amount * classItem.studentCount)}
                        </span>
                      </div>
                    </> : <div className="p-3 bg-white rounded-lg text-center">
                      <p className="text-sm text-amber-600 font-medium">
                        No fee configured
                      </p>
                    </div>}
                </div>

                <div className="flex gap-2">
                  {hasConfiguration ? <>
                      <Button size="sm" variant="secondary" onClick={() => handleOpenDialog(fee)} leftIcon={<Edit className="w-4 h-4" />} className="flex-1">
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteFee(fee.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                        Delete
                      </Button>
                    </> : <Button size="sm" variant="primary" onClick={() => {
              setFormData({
                ...formData,
                class_id: classItem.id
              });
              handleOpenDialog();
            }} leftIcon={<Plus className="w-4 h-4" />} className="flex-1">
                      Configure Fee
                    </Button>}
                </div>
              </Card>;
      })}
        </div>}

      {filteredClasses.length === 0 && classes.length > 0 && <Card className="p-12">
          <div className="text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Results Found
            </h3>
            <p className="text-slate-500">
              Try adjusting your filters or search term
            </p>
          </div>
        </Card>}

      {/* Add/Edit Dialog */}
      <Dialog isOpen={showDialog} onClose={handleCloseDialog} title={editingFee ? 'Edit Fee Structure' : 'Add Fee Structure'}>
        <div className="space-y-4">
          {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Class <span className="text-rose-500">*</span>
            </label>
            <select value={formData.class_id} onChange={e => setFormData({
            ...formData,
            class_id: e.target.value
          })} disabled={!!editingFee} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed">
              <option value="">Select a class...</option>
              {(editingFee ? classes : classesWithoutFees).map(c => <option key={c.id} value={c.id}>
                  {c.name} ({c.studentCount} students)
                </option>)}
            </select>
          </div>

          <Input label={`Fee Amount (${schoolCurrency}) *`} type="number" min="0" step="0.01" value={formData.amount} onChange={e => setFormData({
          ...formData,
          amount: e.target.value
        })} placeholder="Enter fee amount" leftIcon={<DollarSign className="w-4 h-4" />} required />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea value={formData.description} onChange={e => setFormData({
            ...formData,
            description: e.target.value
          })} placeholder="E.g., Tuition fee for the academic year" rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {formData.class_id && formData.amount && <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">Preview</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Class:</span>
                  <span className="font-medium text-blue-900">
                    {classes.find(c => c.id === formData.class_id)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Fee per student:</span>
                  <span className="font-medium text-blue-900">
                    {formatCurrency(parseFloat(formData.amount) || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Students:</span>
                  <span className="font-medium text-blue-900">
                    {classes.find(c => c.id === formData.class_id)?.studentCount || 0}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-300">
                  <span className="text-blue-700 font-medium">
                    Expected revenue:
                  </span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency((parseFloat(formData.amount) || 0) * (classes.find(c => c.id === formData.class_id)?.studentCount || 0))}
                  </span>
                </div>
              </div>
            </div>}

          <div className="flex gap-3 pt-4">
            <Button variant="primary" onClick={handleSaveFee} isLoading={saving} disabled={!formData.class_id || !formData.amount || saving} leftIcon={<Save className="w-4 h-4" />} className="flex-1">
              {editingFee ? 'Update' : 'Create'} Fee Structure
            </Button>
            <Button variant="secondary" onClick={handleCloseDialog} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>;
}