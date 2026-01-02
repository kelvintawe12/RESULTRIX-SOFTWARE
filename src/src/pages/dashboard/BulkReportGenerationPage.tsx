import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Checkbox } from '../../components/ui/Checkbox';
import { useAuth } from '../../hooks/useAuth';
import { FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';
export function BulkReportGenerationPage() {
  const {
    user
  } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedScope, setSelectedScope] = useState<'sequence' | 'term' | ''>('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generationResults, setGenerationResults] = useState<{
    success: number;
    failed: number;
    total: number;
  } | null>(null);
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);
  const fetchData = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      const [classesData, sequencesData, termsData] = await Promise.all([supabase.from('classes').select('id, name').eq('school_id', user.school_id).order('name'), supabase.from('sequences').select('id, name, term_id, terms!inner(academic_year_id, academic_years!inner(school_id))').eq('terms.academic_years.school_id', user.school_id).order('name'), supabase.from('terms').select('id, name, academic_year_id, academic_years!inner(school_id)').eq('academic_years.school_id', user.school_id).order('name')]);
      if (classesData.error) throw classesData.error;
      if (sequencesData.error) throw sequencesData.error;
      if (termsData.error) throw termsData.error;
      setClasses(classesData.data || []);
      setSequences(sequencesData.data || []);
      setTerms(termsData.data || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const fetchStudents = async () => {
    if (!selectedClass) return;
    try {
      const {
        data,
        error: studentsError
      } = await supabase.from('students').select('id, full_name, admission_number').eq('class_id', selectedClass).order('full_name');
      if (studentsError) throw studentsError;
      setStudents(data || []);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to load students');
    }
  };
  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };
  const handleGenerateReports = async () => {
    if (!selectedClass || !selectedScope || !selectedPeriod || selectedStudents.length === 0) {
      setError('Please select class, scope, period, and at least one student');
      return;
    }
    try {
      setGenerating(true);
      setError('');
      setSuccess('');
      let successCount = 0;
      let failedCount = 0;
      for (const studentId of selectedStudents) {
        try {
          // Call the compute_student_report function
          if (selectedScope === 'sequence') {
            const {
              error: computeError
            } = await supabase.rpc('compute_student_report', {
              p_student_id: studentId,
              p_sequence_id: selectedPeriod
            });
            if (computeError) throw computeError;
            successCount++;
          } else if (selectedScope === 'term') {
            // For term reports, we would need to aggregate sequence data
            // This is a simplified version
            const {
              error: insertError
            } = await supabase.from('report_cards').insert({
              student_id: studentId,
              scope: 'term',
              term_id: selectedPeriod,
              data: {
                generated: true
              }
            });
            if (insertError) throw insertError;
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to generate report for student ${studentId}:`, err);
          failedCount++;
        }
      }
      setGenerationResults({
        success: successCount,
        failed: failedCount,
        total: selectedStudents.length
      });
      setSuccess(`Successfully generated ${successCount} report card(s)`);
      setSelectedStudents([]);
    } catch (err: any) {
      console.error('Error generating reports:', err);
      setError(err.message || 'Failed to generate reports');
    } finally {
      setGenerating(false);
    }
  };
  const handleDownloadAll = () => {
    // This would trigger PDF generation and download
    alert('Bulk PDF download functionality would be implemented here');
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bulk Report Generation
        </h1>
        <p className="text-gray-500">
          Generate report cards for multiple students
        </p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      {generationResults && <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Generation Complete
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-green-600">
                    ✓ {generationResults.success} reports generated successfully
                  </p>
                  {generationResults.failed > 0 && <p className="text-red-600">
                      ✗ {generationResults.failed} reports failed
                    </p>}
                  <p className="text-gray-600">
                    Total: {generationResults.total} students
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>}

      <Card>
        <CardHeader>
          <CardTitle>Select Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Class
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Scope
                </label>
                <Select value={selectedScope} onValueChange={(value: any) => setSelectedScope(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequence">Sequence</SelectItem>
                    <SelectItem value="term">Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Period
                </label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={!selectedScope}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedScope === 'sequence' && sequences.map(seq => <SelectItem key={seq.id} value={seq.id}>
                          {seq.name}
                        </SelectItem>)}
                    {selectedScope === 'term' && terms.map(term => <SelectItem key={term.id} value={term.id}>
                          {term.name}
                        </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Select Students ({students.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No students found in this class</p>
              </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {students.map(student => <div key={student.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => {
            setSelectedStudents(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id]);
          }}>
                    <Checkbox checked={selectedStudents.includes(student.id)} onChange={() => {}} label="" />
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.admission_number}
                      </p>
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {selectedStudents.length} student(s) selected
              </p>
              {selectedClass && selectedScope && selectedPeriod && <p className="text-xs text-gray-500 mt-1">
                  Ready to generate {selectedScope} reports
                </p>}
            </div>
            <div className="flex items-center gap-2">
              {generationResults && generationResults.success > 0 && <Button variant="outline" onClick={handleDownloadAll} leftIcon={<Download className="h-4 w-4" />}>
                  Download All PDFs
                </Button>}
              <Button onClick={handleGenerateReports} disabled={!selectedClass || !selectedScope || !selectedPeriod || selectedStudents.length === 0 || generating} isLoading={generating} leftIcon={<FileText className="h-4 w-4" />}>
                Generate Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}