import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { CheckCircle, XCircle, Save, Users } from 'lucide-react';
export function TeacherAttendancePage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (user?.id) {
      fetchTeacherAssignments();
    }
  }, [user?.id]);
  useEffect(() => {
    if (selectedAssignment) {
      fetchStudents();
    }
  }, [selectedAssignment]);
  const fetchTeacherAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data,
        error
      } = await supabase.from('teacher_assignments').select(`
          id,
          subject_id,
          class_id,
          subjects (name),
          classes (name)
        `).eq('teacher_id', user?.id);
      if (error) throw error;
      setAssignments(data || []);
      if (data && data.length > 0) {
        setSelectedAssignment(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const assignment = assignments.find(a => a.id === selectedAssignment);
      if (!assignment) return;
      const {
        data,
        error
      } = await supabase.from('students').select('id, full_name, admission_number').eq('class_id', assignment.class_id).order('full_name');
      if (error) throw error;
      setStudents(data || []);
      // Initialize attendance (default all present)
      const initialAttendance: Record<string, boolean> = {};
      data?.forEach(student => {
        initialAttendance[student.id] = true;
      });
      setAttendance(initialAttendance);
      // Load existing attendance for selected date
      await loadExistingAttendance(assignment.class_id, assignment.subject_id);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };
  const loadExistingAttendance = async (classId: string, subjectId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('attendance').select('student_id, status').eq('class_id', classId).eq('subject_id', subjectId).eq('date', selectedDate);
      if (error) throw error;
      if (data && data.length > 0) {
        const existingAttendance: Record<string, boolean> = {};
        data.forEach(record => {
          existingAttendance[record.student_id] = record.status === 'present';
        });
        setAttendance(prev => ({
          ...prev,
          ...existingAttendance
        }));
      }
    } catch (err: any) {
      console.error('Error loading attendance:', err);
    }
  };
  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };
  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const assignment = assignments.find(a => a.id === selectedAssignment);
      if (!assignment) throw new Error('No assignment selected');
      // Delete existing attendance for this date/class/subject
      await supabase.from('attendance').delete().eq('class_id', assignment.class_id).eq('subject_id', assignment.subject_id).eq('date', selectedDate);
      // Insert new attendance records
      const attendanceRecords = Object.entries(attendance).map(([studentId, isPresent]) => ({
        student_id: studentId,
        class_id: assignment.class_id,
        subject_id: assignment.subject_id,
        date: selectedDate,
        status: isPresent ? 'present' : 'absent',
        marked_by: user?.id,
        school_id: user?.school_id
      }));
      const {
        error: insertError
      } = await supabase.from('attendance').insert(attendanceRecords);
      if (insertError) throw insertError;
      setSuccess('Attendance saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setError(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };
  const selectedAssignmentData = assignments.find(a => a.id === selectedAssignment);
  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = Object.values(attendance).filter(v => !v).length;
  if (loading && assignments.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Attendance Management
        </h1>
        <p className="text-slate-500 mt-1">
          Mark student attendance for your classes
        </p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      {assignments.length === 0 ? <Card className="p-12">
          <div className="text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Assignments Found
            </h3>
            <p className="text-slate-500">
              You don't have any teaching assignments yet. Contact your
              administrator.
            </p>
          </div>
        </Card> : <>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Select Class & Date
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Class & Subject" value={selectedAssignment} onChange={e => setSelectedAssignment(e.target.value)} options={[{
            value: '',
            label: 'Select class...'
          }, ...assignments.map(a => ({
            value: a.id,
            label: `${a.subjects?.name} - ${a.classes?.name}`
          }))]} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Date
                </label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </Card>

          {students.length > 0 ? <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedAssignmentData?.subjects?.name} -{' '}
                    {selectedAssignmentData?.classes?.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {students.length} student{students.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">
                      Present: {presentCount}
                    </span>
                    <span className="text-slate-400 mx-2">|</span>
                    <span className="text-rose-600 font-medium">
                      Absent: {absentCount}
                    </span>
                  </div>
                  <Button variant="primary" onClick={handleSaveAttendance} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
                    Save Attendance
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {students.map(student => <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${attendance[student.id] ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {student.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {student.admission_number || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={attendance[student.id] ? 'primary' : 'secondary'} onClick={() => toggleAttendance(student.id)} leftIcon={<CheckCircle className="w-4 h-4" />}>
                        Present
                      </Button>
                      <Button size="sm" variant={!attendance[student.id] ? 'danger' : 'secondary'} onClick={() => toggleAttendance(student.id)} leftIcon={<XCircle className="w-4 h-4" />}>
                        Absent
                      </Button>
                    </div>
                  </div>)}
              </div>
            </Card> : <Card className="p-12">
              <div className="text-center">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No Students Found
                </h3>
                <p className="text-slate-500">
                  No students enrolled in this class yet.
                </p>
              </div>
            </Card>}
        </>}
    </div>;
}