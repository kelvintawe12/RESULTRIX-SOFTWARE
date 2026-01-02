import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Checkbox } from '../../components/ui/Checkbox';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, Users, CheckCircle } from 'lucide-react';
interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  class_id: string;
  class_name?: string;
}
interface Class {
  id: string;
  name: string;
}
export function BulkStudentEnrollmentPage() {
  const {
    user
  } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [targetClass, setTargetClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  const fetchData = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      const [classesData, studentsData] = await Promise.all([supabase.from('classes').select('id, name').eq('school_id', user.school_id).order('name'), supabase.from('students').select('id, full_name, admission_number, class_id').eq('school_id', user.school_id).order('full_name')]);
      if (classesData.error) throw classesData.error;
      if (studentsData.error) throw studentsData.error;
      const enrichedStudents = (studentsData.data || []).map(student => {
        const classData = classesData.data?.find(c => c.id === student.class_id);
        return {
          ...student,
          class_name: classData?.name || 'Unknown'
        };
      });
      setClasses(classesData.data || []);
      setStudents(enrichedStudents);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const handleBulkEnroll = async () => {
    if (selectedStudents.length === 0 || !targetClass) {
      setError('Please select students and target class');
      return;
    }
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      const updates = selectedStudents.map(studentId => ({
        id: studentId,
        class_id: targetClass
      }));
      for (const update of updates) {
        const {
          error: updateError
        } = await supabase.from('students').update({
          class_id: update.class_id
        }).eq('id', update.id);
        if (updateError) throw updateError;
      }
      setSuccess(`Successfully enrolled ${selectedStudents.length} student(s) to the selected class`);
      setSelectedStudents([]);
      setTargetClass('');
      setSelectedClass('');
      fetchData();
    } catch (err: any) {
      console.error('Error bulk enrolling:', err);
      setError(err.message || 'Failed to enroll students');
    } finally {
      setLoading(false);
    }
  };
  const filteredStudents = selectedClass ? students.filter(s => s.class_id === selectedClass) : students;
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };
  if (loading && students.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bulk Student Enrollment
        </h1>
        <p className="text-gray-500">
          Move multiple students to a different class
        </p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {students.length}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Selected</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {selectedStudents.length}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Classes
                </p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {classes.length}
                </h3>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Filter by Current Class
              </label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Target Class
              </label>
              <Select value={targetClass} onValueChange={setTargetClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Target Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Select Students ({filteredStudents.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No students found</p>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredStudents.map(student => <div key={student.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => {
            setSelectedStudents(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id]);
          }}>
                  <Checkbox checked={selectedStudents.includes(student.id)} onChange={() => {}} label="" />
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {student.full_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {student.admission_number}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {student.class_name}
                      </Badge>
                    </div>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {selectedStudents.length} student(s) selected
                {targetClass && ` → Moving to ${classes.find(c => c.id === targetClass)?.name}`}
              </p>
            </div>
            <Button onClick={handleBulkEnroll} disabled={selectedStudents.length === 0 || !targetClass || loading}>
              Enroll Students
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
}