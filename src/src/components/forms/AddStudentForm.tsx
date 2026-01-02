import React, { useEffect, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Tabs } from '../ui/Tabs';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles } from 'lucide-react';
interface AddStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
export function AddStudentForm({
  isOpen,
  onClose,
  onSuccess
}: AddStudentFormProps) {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',
    phone: '',
    email: '',
    nationality: '',
    // Guardian Info
    guardianName: '',
    guardianRelationship: 'father',
    guardianPhone: '',
    guardianEmail: '',
    guardianAddress: '',
    guardianOccupation: '',
    guardianIdNumber: '',
    // Academic Info
    academicYearId: '',
    classId: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    previousSchool: '',
    // Health Info (Optional)
    medicalConditions: '',
    allergies: '',
    bloodType: '',
    specialNeeds: ''
  });
  useEffect(() => {
    if (isOpen && user?.school_id) {
      fetchClassesAndYears();
      fetchSchool();
    }
  }, [isOpen, user?.school_id]);
  const fetchSchool = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('schools').select('*').eq('id', user?.school_id).single();
      if (error) throw error;
      setSchool(data);
    } catch (err: any) {
      console.error('Error fetching school:', err);
    }
  };
  const fetchClassesAndYears = async () => {
    try {
      // Fetch classes
      const {
        data: classesData,
        error: classesError
      } = await supabase.from('classes').select('*').eq('school_id', user?.school_id).order('name');
      if (classesError) throw classesError;
      setClasses(classesData || []);
      // Fetch academic years
      const {
        data: yearsData,
        error: yearsError
      } = await supabase.from('academic_years').select('*').eq('school_id', user?.school_id).order('start_date', {
        ascending: false
      });
      if (yearsError) throw yearsError;
      setAcademicYears(yearsData || []);
      // Auto-select current academic year if available
      if (yearsData && yearsData.length > 0) {
        setFormData(prev => ({
          ...prev,
          academicYearId: yearsData[0].id
        }));
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
    }
  };
  const generateStudentId = async (classId: string) => {
    try {
      // Get class info
      const selectedClass = classes.find(c => c.id === classId);
      if (!selectedClass) return '';
      // Get count of students in this class for this year
      const {
        count
      } = await supabase.from('students').select('*', {
        count: 'exact',
        head: true
      }).eq('school_id', user?.school_id).eq('class_id', classId).eq('academic_year_id', formData.academicYearId);
      const studentNumber = (count || 0) + 1;
      // Format: SCHOOL_INITIALS-CLASS-YEAR-NUMBER
      // Example: EDU-G1-2024-001
      const schoolInitials = school?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3) || 'SCH';
      const classCode = selectedClass.name.replace(/\s+/g, '').toUpperCase().slice(0, 3);
      const year = new Date().getFullYear();
      const paddedNumber = studentNumber.toString().padStart(3, '0');
      return `${schoolInitials}-${classCode}-${year}-${paddedNumber}`;
    } catch (err) {
      console.error('Error generating student ID:', err);
      return '';
    }
  };
  const fillTestData = () => {
    setFormData({
      fullName: 'John Doe',
      dateOfBirth: '2010-05-15',
      gender: 'male',
      address: '123 Main Street, City',
      phone: '+1234567890',
      email: 'john.doe@example.com',
      nationality: 'USA',
      guardianName: 'Jane Doe',
      guardianRelationship: 'mother',
      guardianPhone: '+1234567891',
      guardianEmail: 'jane.doe@example.com',
      guardianAddress: '123 Main Street, City',
      guardianOccupation: 'Teacher',
      guardianIdNumber: 'ID123456',
      academicYearId: academicYears[0]?.id || '',
      classId: classes[0]?.id || '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      previousSchool: 'Previous School Name',
      medicalConditions: 'None',
      allergies: 'None',
      bloodType: 'O+',
      specialNeeds: 'None'
    });
  };
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      // Validate required fields
      if (!formData.fullName || !formData.dateOfBirth || !formData.classId || !formData.academicYearId) {
        throw new Error('Please fill in all required fields in Personal and Academic tabs');
      }
      if (!formData.guardianName || !formData.guardianRelationship || !formData.guardianPhone || !formData.guardianEmail) {
        throw new Error('Please provide complete guardian information');
      }
      // Generate unique student ID (make this optional to avoid blocking)
      let admissionNumber = '';
      try {
        admissionNumber = await generateStudentId(formData.classId);
      } catch (err) {
        console.warn('Failed to generate admission number:', err);
        // Continue without admission number - it can be added later
      }
      // Get fee structure for selected class
      const {
        data: feeData,
        error: feeError
      } = await supabase.from('fee_structures').select('amount').eq('class_id', formData.classId).maybeSingle();
      if (feeError) {
        console.warn('Fee structure query error:', feeError);
      }
      const totalFee = feeData?.amount || 0;
      // Create student with proper error handling
      const studentInsertData = {
        school_id: user?.school_id,
        academic_year_id: formData.academicYearId,
        class_id: formData.classId,
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        nationality: formData.nationality || null,
        enrollment_date: formData.enrollmentDate,
        previous_school: formData.previousSchool || null,
        medical_conditions: formData.medicalConditions || null,
        allergies: formData.allergies || null,
        blood_type: formData.bloodType || null,
        special_needs: formData.specialNeeds || null,
        // Only include admission_number if it was generated
        ...(admissionNumber && {
          admission_number: admissionNumber
        }),
        // Only include financial fields if they exist in the schema
        ...(totalFee > 0 && {
          total_fee: totalFee,
          total_paid: 0,
          remaining: totalFee
        })
      };
      const {
        data: studentData,
        error: studentError
      } = await supabase.from('students').insert(studentInsertData).select().single();
      if (studentError) {
        console.error('Student insert error:', studentError);
        throw new Error(`Failed to create student: ${studentError.message || 'Unknown database error'}`);
      }
      // Create guardian
      const {
        error: guardianError
      } = await supabase.from('guardians').insert({
        student_id: studentData.id,
        full_name: formData.guardianName,
        relationship: formData.guardianRelationship,
        phone: formData.guardianPhone,
        email: formData.guardianEmail,
        address: formData.guardianAddress || null,
        occupation: formData.guardianOccupation || null,
        id_number: formData.guardianIdNumber || null
      });
      if (guardianError) {
        console.error('Guardian insert error:', guardianError);
        // Don't fail the whole operation if guardian insert fails
        // The student was created successfully
        console.warn('Student created but guardian creation failed');
      }
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error adding student:', err);
      setError(err.message || 'Failed to enroll student. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setFormData({
      fullName: '',
      dateOfBirth: '',
      gender: 'male',
      address: '',
      phone: '',
      email: '',
      nationality: '',
      guardianName: '',
      guardianRelationship: 'father',
      guardianPhone: '',
      guardianEmail: '',
      guardianAddress: '',
      guardianOccupation: '',
      guardianIdNumber: '',
      academicYearId: academicYears[0]?.id || '',
      classId: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      previousSchool: '',
      medicalConditions: '',
      allergies: '',
      bloodType: '',
      specialNeeds: ''
    });
    setActiveTab('personal');
    setError(null);
    onClose();
  };
  const genderOptions = [{
    value: 'male',
    label: 'Male'
  }, {
    value: 'female',
    label: 'Female'
  }, {
    value: 'other',
    label: 'Other'
  }, {
    value: 'prefer_not_to_say',
    label: 'Prefer not to say'
  }];
  const relationshipOptions = [{
    value: 'father',
    label: 'Father'
  }, {
    value: 'mother',
    label: 'Mother'
  }, {
    value: 'guardian',
    label: 'Guardian'
  }, {
    value: 'uncle',
    label: 'Uncle'
  }, {
    value: 'aunt',
    label: 'Aunt'
  }, {
    value: 'grandparent',
    label: 'Grandparent'
  }, {
    value: 'sibling',
    label: 'Sibling'
  }, {
    value: 'other',
    label: 'Other'
  }];
  return <Dialog isOpen={isOpen} onClose={handleClose} title="Enroll New Student" size="lg">
      <div className="space-y-4">
        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex items-center justify-between">
          <Tabs tabs={[{
          id: 'personal',
          label: 'Personal Info'
        }, {
          id: 'guardian',
          label: 'Guardian Info'
        }, {
          id: 'academic',
          label: 'Academic Info'
        }, {
          id: 'health',
          label: 'Health (Optional)'
        }]} activeTab={activeTab} onChange={setActiveTab} />
          <Button size="sm" variant="secondary" onClick={fillTestData} leftIcon={<Sparkles className="w-4 h-4" />}>
            Fill Test Data
          </Button>
        </div>

        <div className="mt-4">
          {/* Personal Info Tab */}
          {activeTab === 'personal' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Full Name" required value={formData.fullName} onChange={e => setFormData({
              ...formData,
              fullName: e.target.value
            })} placeholder="John Doe" />
              </div>
              <Input label="Date of Birth" type="date" required value={formData.dateOfBirth} onChange={e => setFormData({
            ...formData,
            dateOfBirth: e.target.value
          })} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select value={formData.gender} onChange={e => setFormData({
              ...formData,
              gender: e.target.value
            })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {genderOptions.map(option => <option key={option.value} value={option.value}>
                      {option.label}
                    </option>)}
                </select>
              </div>
              <Input label="Phone" value={formData.phone} onChange={e => setFormData({
            ...formData,
            phone: e.target.value
          })} placeholder="Optional" />
              <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({
            ...formData,
            email: e.target.value
          })} placeholder="Optional" />
              <Input label="Nationality" value={formData.nationality} onChange={e => setFormData({
            ...formData,
            nationality: e.target.value
          })} placeholder="Optional" />
              <div className="sm:col-span-2">
                <Input label="Address" value={formData.address} onChange={e => setFormData({
              ...formData,
              address: e.target.value
            })} placeholder="Optional" />
              </div>
            </div>}

          {/* Guardian Info Tab */}
          {activeTab === 'guardian' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Guardian Name" required value={formData.guardianName} onChange={e => setFormData({
            ...formData,
            guardianName: e.target.value
          })} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Relationship <span className="text-red-500">*</span>
                </label>
                <select value={formData.guardianRelationship} onChange={e => setFormData({
              ...formData,
              guardianRelationship: e.target.value
            })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {relationshipOptions.map(option => <option key={option.value} value={option.value}>
                      {option.label}
                    </option>)}
                </select>
              </div>
              <Input label="Phone" required value={formData.guardianPhone} onChange={e => setFormData({
            ...formData,
            guardianPhone: e.target.value
          })} />
              <Input label="Email" type="email" required value={formData.guardianEmail} onChange={e => setFormData({
            ...formData,
            guardianEmail: e.target.value
          })} />
              <Input label="Occupation" value={formData.guardianOccupation} onChange={e => setFormData({
            ...formData,
            guardianOccupation: e.target.value
          })} placeholder="Optional" />
              <Input label="ID Number" value={formData.guardianIdNumber} onChange={e => setFormData({
            ...formData,
            guardianIdNumber: e.target.value
          })} placeholder="Optional" />
              <div className="sm:col-span-2">
                <Input label="Address" value={formData.guardianAddress} onChange={e => setFormData({
              ...formData,
              guardianAddress: e.target.value
            })} placeholder="Optional" />
              </div>
            </div>}

          {/* Academic Info Tab */}
          {activeTab === 'academic' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select value={formData.academicYearId} onChange={e => setFormData({
              ...formData,
              academicYearId: e.target.value
            })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select academic year</option>
                  {academicYears.map(y => <option key={y.id} value={y.id}>
                      {y.year_name}
                    </option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Class <span className="text-red-500">*</span>
                </label>
                <select value={formData.classId} onChange={e => setFormData({
              ...formData,
              classId: e.target.value
            })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select a class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>
                      {c.name}
                    </option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Student ID will be auto-generated</strong> based on
                    school, class, and year. Fees will be automatically assigned
                    based on the selected class.
                  </p>
                </div>
              </div>
              <Input label="Enrollment Date" type="date" value={formData.enrollmentDate} onChange={e => setFormData({
            ...formData,
            enrollmentDate: e.target.value
          })} />
              <Input label="Previous School" value={formData.previousSchool} onChange={e => setFormData({
            ...formData,
            previousSchool: e.target.value
          })} placeholder="Optional" />
            </div>}

          {/* Health Info Tab */}
          {activeTab === 'health' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Blood Type" value={formData.bloodType} onChange={e => setFormData({
            ...formData,
            bloodType: e.target.value
          })} placeholder="e.g., A+, O-, AB+" />
              <Input label="Allergies" value={formData.allergies} onChange={e => setFormData({
            ...formData,
            allergies: e.target.value
          })} placeholder="e.g., Peanuts, Penicillin" />
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Medical Conditions
                </label>
                <textarea value={formData.medicalConditions} onChange={e => setFormData({
              ...formData,
              medicalConditions: e.target.value
            })} placeholder="Any medical conditions to be aware of..." rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Special Needs
                </label>
                <textarea value={formData.specialNeeds} onChange={e => setFormData({
              ...formData,
              specialNeeds: e.target.value
            })} placeholder="Any special needs or accommodations..." rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>}
        </div>

        <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            Step{' '}
            {['personal', 'guardian', 'academic', 'health'].indexOf(activeTab) + 1}{' '}
            of 4
          </div>
          <div className="flex gap-3">
            {activeTab !== 'personal' && <Button variant="secondary" onClick={() => {
            const tabs = ['personal', 'guardian', 'academic', 'health'];
            const currentIndex = tabs.indexOf(activeTab);
            setActiveTab(tabs[currentIndex - 1]);
          }}>
                Previous
              </Button>}
            {activeTab !== 'health' ? <Button variant="primary" onClick={() => {
            const tabs = ['personal', 'guardian', 'academic', 'health'];
            const currentIndex = tabs.indexOf(activeTab);
            setActiveTab(tabs[currentIndex + 1]);
          }}>
                Next
              </Button> : <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
                Enroll Student
              </Button>}
          </div>
        </div>
      </div>
    </Dialog>;
}