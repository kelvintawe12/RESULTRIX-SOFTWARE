import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { DollarSign, Plus, Edit, Trash2, Save, X, BookOpen } from 'lucide-react';
export function FeeStructurePage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
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
      // Get school currency
      const {
        data: school,
        error: schoolError
      } = await supabase.from('schools').select('currency_code').eq('id', user?.school_id).single();
      if (schoolError) throw schoolError;
      if (school) {
        setCurrencyCode(school.currency_code);
      }
      // Fetch classes
      const {
        data: classesData,
        error: classesError
      } = await supabase.from('classes').select('*').eq('school_id', user?.school_id).order('name');
      if (classesError) throw classesError;
      setClasses(classesData || []);
      // Fetch fee structures for this school's classes
      const classIds = classesData?.map(c => c.id) || [];
      if (classIds.length > 0) {
        const {
          data: feesData,
          error: feesError
        } = await supabase.from('fee_structures').select('*').in('class_id', classIds).order('created_at', {
          ascending: false
        });
        if (feesError) throw feesError;
        // Enrich with class names
        const enrichedFees = (feesData || []).map(fee => {
          const classData = classesData?.find(c => c.id === fee.class_id);
          return {
            ...fee,
            class_name: classData?.name || 'Unknown'
          };
        });
        setFeeStructures(enrichedFees);
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
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      if (!formData.classId || !formData.amount) {
        throw new Error('Please fill in required fields');
      }
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }
      const feeData = {
        school_id: user?.school_id,
        class_id: formData.classId,
        amount: amount,
        currency_code: currencyCode,
        description: formData.description || null
      };
      if (editingId) {
        const {
          error
        } = await supabase.from('fee_structures').update(feeData).eq('id', editingId);
        if (error) throw error;
        setSuccess('Fee structure updated successfully');
      } else {
        // Check if fee structure already exists for this class
        const {
          data: existing
        } = await supabase.from('fee_structures').select('id').eq('class_id', formData.classId).eq('school_id', user?.school_id).single();
        if (existing) {
          throw new Error('Fee structure already exists for this class. Please edit the existing one.');
        }
        const {
          error
        } = await supabase.from('fee_structures').insert(feeData);
        if (error) throw error;
        setSuccess('Fee structure created successfully');
      }
      setFormData({
        classId: '',
        amount: '',
        description: ''
      });
      setShowAddForm(false);
      setEditingId(null);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving fee structure:', err);
      setError(err.message || 'Failed to save fee structure');
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (fee: any) => {
    setFormData({
      classId: fee.class_id,
      amount: fee.amount.toString(),
      description: fee.description || ''
    });
    setEditingId(fee.id);
    setShowAddForm(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will affect student fee calculations.')) return;
    try {
      setLoading(true);
      const {
        error
      } = await supabase.from('fee_structures').delete().eq('id', id);
      if (error) throw error;
      setSuccess('Fee structure deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting fee structure:', err);
      setError(err.message || 'Failed to delete fee structure');
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = () => {
    setFormData({
      classId: '',
      amount: '',
      description: ''
    });
    setEditingId(null);
    setShowAddForm(false);
    setError(null);
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  // Get available classes (not already having fee structures)
  const availableClasses = classes.filter(cls => !feeStructures.some(fee => fee.class_id === cls.id) || editingId);
  if (loading && !showAddForm && feeStructures.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Fee Structure Management
          </h1>
          <p className="text-slate-500 mt-1">
            Configure tuition fees for each class
          </p>
        </div>
        {!showAddForm && <Button variant="primary" onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />} disabled={availableClasses.length === 0 && !editingId}>
            Add Fee Structure
          </Button>}
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {showAddForm && <Card className="p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingId ? 'Edit Fee Structure' : 'Add New Fee Structure'}
            </h3>
            <Button size="sm" variant="secondary" onClick={handleCancel} leftIcon={<X className="w-4 h-4" />}>
              Cancel
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Class <span className="text-red-500">*</span>
              </label>
              <select value={formData.classId} onChange={e => setFormData({
            ...formData,
            classId: e.target.value
          })} disabled={!!editingId} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed">
                <option value="">Select a class</option>
                {availableClasses.map(c => <option key={c.id} value={c.id}>
                    {c.name}
                  </option>)}
              </select>
            </div>

            <Input label="Fee Amount" type="number" step="0.01" min="0" required value={formData.amount} onChange={e => setFormData({
          ...formData,
          amount: e.target.value
        })} placeholder="0.00" leftIcon={<DollarSign className="h-4 w-4 text-gray-400" />} />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description (Optional)
              </label>
              <textarea value={formData.description} onChange={e => setFormData({
            ...formData,
            description: e.target.value
          })} placeholder="e.g., Annual tuition fee including books and materials" rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This fee will be automatically applied to
                all new students enrolled in this class. Currency (
                {currencyCode}) is set from your school settings.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 mt-6">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={loading} disabled={!formData.classId || !formData.amount} leftIcon={<Save className="w-4 h-4" />}>
              {editingId ? 'Update Fee Structure' : 'Create Fee Structure'}
            </Button>
          </div>
        </Card>}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Existing Fee Structures
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <DollarSign className="w-4 h-4" />
            <span>
              {feeStructures.length} of {classes.length} classes configured
            </span>
          </div>
        </div>

        {feeStructures.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeStructures.map(fee => <div key={fee.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {fee.class_name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {fee.currency_code}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(fee.amount)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Annual tuition fee
                  </p>
                </div>

                {fee.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {fee.description}
                  </p>}

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(fee)} leftIcon={<Edit className="w-3 h-3" />} className="flex-1">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(fee.id)} leftIcon={<Trash2 className="w-3 h-3" />} className="text-red-600 hover:bg-red-50 hover:border-red-200">
                    Delete
                  </Button>
                </div>
              </div>)}
          </div> : <div className="text-center py-12">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Fee Structures Yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Create fee structures for your classes to start managing tuition
              fees. Each class can have its own fee amount.
            </p>
            {classes.length > 0 ? <Button variant="primary" onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Add First Fee Structure
              </Button> : <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-amber-800">
                  You need to create classes first before setting up fee
                  structures.
                </p>
              </div>}
          </div>}
      </Card>
    </div>;
}