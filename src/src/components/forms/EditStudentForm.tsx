import React, { useEffect, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Tabs } from '../ui/Tabs';
interface EditStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
}
export function EditStudentForm({
  isOpen,
  onClose,
  onSuccess,
  studentId
}: EditStudentFormProps) {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'male',
    address: '',
    phone: '',
    email: '',
    nationality: '',
    admission_number: '',
    enrollment_date: '',
    previous_school: '',
    class_id: '',
    academic_year_id: '',
    medical_conditions: '',
    allergies: '',
    special_needs: '',
    blood_type: '',
    profile_photo_path: ''
  });
  useEffect(() => {
    if (isOpen && user?.school_id) {
      fetchClasses();
      fetchAcademicYears();
      fetchStudentData();
    }
  }, [isOpen, user?.school_id, studentId]);
  const fetchClasses = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('classes').select('id, name').eq('school_id', user?.school_id).order('name');
      if (error) throw error;
      setClasses(data || []);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
    }
  };
  const fetchAcademicYears = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('academic_years').select('id, year_name').eq('school_id', user?.school_id).order('start_date', {
        ascending: false
      });
      if (error) throw error;
      setAcademicYears(data || []);
    } catch (err: any) {
      console.error('Error fetching academic years:', err);
    }
  };
  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('students').select('*').eq('id', studentId).single();
      if (error) throw error;
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || 'male',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          nationality: data.nationality || '',
          admission_number: data.admission_number || '',
          enrollment_date: data.enrollment_date || '',
          previous_school: data.previous_school || '',
          class_id: data.class_id || '',
          academic_year_id: data.academic_year_id || '',
          medical_conditions: data.medical_conditions || '',
          allergies: data.allergies || '',
          special_needs: data.special_needs || '',
          blood_type: data.blood_type || '',
          profile_photo_path: data.profile_photo_path || ''
        });
      }
    } catch (err: any) {
      console.error('Error fetching student:', err);
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const {
        error: updateError
      } = await supabase.from('students').update({
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        nationality: formData.nationality,
        admission_number: formData.admission_number,
        enrollment_date: formData.enrollment_date,
        previous_school: formData.previous_school,
        class_id: formData.class_id,
        academic_year_id: formData.academic_year_id,
        medical_conditions: formData.medical_conditions,
        allergies: formData.allergies,
        special_needs: formData.special_needs,
        blood_type: formData.blood_type,
        updated_at: new Date().toISOString()
      }).eq('id', studentId);
      if (updateError) throw updateError;
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating student:', err);
      setError(err.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };
  return <Dialog isOpen={isOpen} onClose={onClose} title="Edit Student">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
        {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}

        <Tabs tabs={[{
        id: 'personal',
        label: 'Personal Info'
      }, {
        id: 'academic',
        label: 'Academic Info'
      }, {
        id: 'health',
        label: 'Health Info'
      }]} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'personal' && <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Full Name *
              </label>
              <Input value={formData.full_name} onChange={e => setFormData({
            ...formData,
            full_name: e.target.value
          })} required placeholder="Enter full name" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Date of Birth *
                </label>
                <Input type="date" value={formData.date_of_birth} onChange={e => setFormData({
              ...formData,
              date_of_birth: e.target.value
            })} required />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Gender *
                </label>
                <Select value={formData.gender} onValueChange={value => setFormData({
              ...formData,
              gender: value
            })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Address
              </label>
              <Input value={formData.address} onChange={e => setFormData({
            ...formData,
            address: e.target.value
          })} placeholder="Enter address" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Phone
                </label>
                <Input value={formData.phone} onChange={e => setFormData({
              ...formData,
              phone: e.target.value
            })} placeholder="Enter phone number" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Email
                </label>
                <Input type="email" value={formData.email} onChange={e => setFormData({
              ...formData,
              email: e.target.value
            })} placeholder="Enter email" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Nationality
              </label>
              <Input value={formData.nationality} onChange={e => setFormData({
            ...formData,
            nationality: e.target.value
          })} placeholder="Enter nationality" />
            </div>
          </div>}

        {activeTab === 'academic' && <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Admission Number *
                </label>
                <Input value={formData.admission_number} onChange={e => setFormData({
              ...formData,
              admission_number: e.target.value
            })} required placeholder="Enter admission number" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Enrollment Date
                </label>
                <Input type="date" value={formData.enrollment_date} onChange={e => setFormData({
              ...formData,
              enrollment_date: e.target.value
            })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Class *
                </label>
                <Select value={formData.class_id} onValueChange={value => setFormData({
              ...formData,
              class_id: value
            })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Academic Year *
                </label>
                <Select value={formData.academic_year_id} onValueChange={value => setFormData({
              ...formData,
              academic_year_id: value
            })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(year => <SelectItem key={year.id} value={year.id}>
                        {year.year_name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Previous School
              </label>
              <Input value={formData.previous_school} onChange={e => setFormData({
            ...formData,
            previous_school: e.target.value
          })} placeholder="Enter previous school name" />
            </div>
          </div>}

        {activeTab === 'health' && <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Blood Type
              </label>
              <Select value={formData.blood_type} onValueChange={value => setFormData({
            ...formData,
            blood_type: value
          })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not specified</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Medical Conditions
              </label>
              <textarea value={formData.medical_conditions} onChange={e => setFormData({
            ...formData,
            medical_conditions: e.target.value
          })} placeholder="Enter any medical conditions" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Allergies
              </label>
              <textarea value={formData.allergies} onChange={e => setFormData({
            ...formData,
            allergies: e.target.value
          })} placeholder="Enter any allergies" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Special Needs
              </label>
              <textarea value={formData.special_needs} onChange={e => setFormData({
            ...formData,
            special_needs: e.target.value
          })} placeholder="Enter any special needs" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
            </div>
          </div>}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 border-t">
          <Button type="submit" disabled={loading} className="flex-1 sm:flex-initial">
            {loading ? 'Updating...' : 'Update Student'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>;
}