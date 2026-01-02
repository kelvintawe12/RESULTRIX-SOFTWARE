import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { BookOpen, Save, X } from 'lucide-react';
interface Student {
  id: string;
  full_name: string;
  admission_number: string;
}
interface Subject {
  id: string;
  name: string;
}
interface Sequence {
  id: string;
  name: string;
}
interface Enrollment {
  id: string;
  student_id: string;
  subject_id: string;
  student_name: string;
  admission_number: string;
}
interface MarkEntry {
  enrollment_id: string;
  student_name: string;
  admission_number: string;
  score: string;
  out_of: string;
  attendance_present: string;
  attendance_total: string;
  comments: string;
}
export function AdminMarksSubmissionPage() {
  const {
    user
  } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSequence, setSelectedSequence] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [markEntries, setMarkEntries] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [defaultOutOf, setDefaultOutOf] = useState('100');
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  useEffect(() => {
    if (selectedSubject && selectedSequence) {
      fetchEnrollments();
    }
  }, [selectedSubject, selectedSequence]);
  const fetchData = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      const [subjectsData, sequencesData] = await Promise.all([supabase.from('subjects').select('id, name').eq('school_id', user.school_id).order('name'), supabase.from('sequences').select(`
          id,
          name,
          terms!inner(
            academic_year_id,
            academic_years!inner(school_id)
          )
        `).eq('terms.academic_years.school_id', user.school_id).order('name')]);
      if (subjectsData.error) throw subjectsData.error;
      if (sequencesData.error) throw sequencesData.error;
      setSubjects(subjectsData.data || []);
      setSequences(sequencesData.data || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const fetchEnrollments = async () => {
    if (!selectedSubject || !selectedSequence) return;
    try {
      setLoading(true);
      const {
        data: enrollmentsData,
        error: enrollmentsError
      } = await supabase.from('enrollments').select('id, student_id, subject_id').eq('subject_id', selectedSubject);
      if (enrollmentsError) throw enrollmentsError;
      const enrichedEnrollments = await Promise.all((enrollmentsData || []).map(async enrollment => {
        const {
          data: studentData
        } = await supabase.from('students').select('full_name, admission_number').eq('id', enrollment.student_id).single();
        // Check if marks already exist
        const {
          data: existingMark
        } = await supabase.from('marks').select('score, out_of, attendance_present, attendance_total, comments').eq('enrollment_id', enrollment.id).eq('sequence_id', selectedSequence).maybeSingle();
        return {
          ...enrollment,
          student_name: studentData?.full_name || 'Unknown',
          admission_number: studentData?.admission_number || 'N/A',
          existing_mark: existingMark
        };
      }));
      const entries = enrichedEnrollments.map(e => ({
        enrollment_id: e.id,
        student_name: e.student_name,
        admission_number: e.admission_number,
        score: e.existing_mark?.score?.toString() || '',
        out_of: e.existing_mark?.out_of?.toString() || defaultOutOf,
        attendance_present: e.existing_mark?.attendance_present?.toString() || '',
        attendance_total: e.existing_mark?.attendance_total?.toString() || '',
        comments: e.existing_mark?.comments || ''
      }));
      setEnrollments(enrichedEnrollments);
      setMarkEntries(entries);
    } catch (err: any) {
      console.error('Error fetching enrollments:', err);
      setError(err.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };
  const handleMarkChange = (enrollmentId: string, field: keyof MarkEntry, value: string) => {
    setMarkEntries(prev => prev.map(entry => entry.enrollment_id === enrollmentId ? {
      ...entry,
      [field]: value
    } : entry));
  };
  const handleSubmitMarks = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const marksToSubmit = markEntries.filter(entry => entry.score && entry.out_of);
      if (marksToSubmit.length === 0) {
        setError('Please enter at least one mark');
        return;
      }
      for (const entry of marksToSubmit) {
        const markData = {
          enrollment_id: entry.enrollment_id,
          sequence_id: selectedSequence,
          score: parseFloat(entry.score),
          out_of: parseInt(entry.out_of),
          attendance_present: parseInt(entry.attendance_present) || 0,
          attendance_total: parseInt(entry.attendance_total) || 0,
          comments: entry.comments || null,
          submitted_by: user?.id,
          approved: true // Admin submissions are auto-approved
        };
        // Check if mark exists
        const {
          data: existingMark
        } = await supabase.from('marks').select('id').eq('enrollment_id', entry.enrollment_id).eq('sequence_id', selectedSequence).maybeSingle();
        if (existingMark) {
          const {
            error: updateError
          } = await supabase.from('marks').update(markData).eq('id', existingMark.id);
          if (updateError) throw updateError;
        } else {
          const {
            error: insertError
          } = await supabase.from('marks').insert(markData);
          if (insertError) throw insertError;
        }
      }
      setSuccess(`Successfully submitted marks for ${marksToSubmit.length} student(s)`);
      fetchEnrollments();
    } catch (err: any) {
      console.error('Error submitting marks:', err);
      setError(err.message || 'Failed to submit marks');
    } finally {
      setLoading(false);
    }
  };
  const handleSetDefaultOutOf = () => {
    setMarkEntries(prev => prev.map(entry => ({
      ...entry,
      out_of: defaultOutOf
    })));
  };
  if (loading && subjects.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Admin Marks Submission
        </h1>
        <p className="text-gray-500">Submit or update student marks</p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      <Card>
        <CardHeader>
          <CardTitle>Select Subject & Sequence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedSequence} onValueChange={setSelectedSequence}>
              <SelectTrigger>
                <SelectValue placeholder="Select Sequence" />
              </SelectTrigger>
              <SelectContent>
                {sequences.map(sequence => <SelectItem key={sequence.id} value={sequence.id}>
                    {sequence.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-end gap-2">
              <Input label="Default Out Of" type="number" value={defaultOutOf} onChange={e => setDefaultOutOf(e.target.value)} placeholder="100" />
              <Button variant="outline" onClick={handleSetDefaultOutOf}>
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSubject && selectedSequence && <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Enter Marks ({markEntries.length} students)</CardTitle>
              <Button onClick={handleSubmitMarks} disabled={loading} leftIcon={<Save className="h-4 w-4" />}>
                Submit All Marks
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div> : markEntries.length === 0 ? <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  No students enrolled in this subject
                </p>
              </div> : <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Admission No.
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Student Name
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Score
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Out Of
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Attendance
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {markEntries.map(entry => <tr key={entry.enrollment_id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm font-mono">
                          {entry.admission_number}
                        </td>
                        <td className="p-3 text-sm font-medium">
                          {entry.student_name}
                        </td>
                        <td className="p-3">
                          <Input type="number" value={entry.score} onChange={e => handleMarkChange(entry.enrollment_id, 'score', e.target.value)} placeholder="0" className="w-20" />
                        </td>
                        <td className="p-3">
                          <Input type="number" value={entry.out_of} onChange={e => handleMarkChange(entry.enrollment_id, 'out_of', e.target.value)} placeholder="100" className="w-20" />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Input type="number" value={entry.attendance_present} onChange={e => handleMarkChange(entry.enrollment_id, 'attendance_present', e.target.value)} placeholder="0" className="w-16" />
                            <span className="text-gray-500">/</span>
                            <Input type="number" value={entry.attendance_total} onChange={e => handleMarkChange(entry.enrollment_id, 'attendance_total', e.target.value)} placeholder="0" className="w-16" />
                          </div>
                        </td>
                        <td className="p-3">
                          <Input value={entry.comments} onChange={e => handleMarkChange(entry.enrollment_id, 'comments', e.target.value)} placeholder="Optional comments" className="w-full" />
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>}
          </CardContent>
        </Card>}
    </div>;
}