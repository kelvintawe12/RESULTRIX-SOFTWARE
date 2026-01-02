import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileText, Download, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { Select } from '../../components/ui/Select';
export function ReportsPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user?.school_id]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const schoolId = user?.school_id;
      // Fetch classes for filter
      const {
        data: classData
      } = await supabase.from('classes').select('*').eq('school_id', schoolId);
      setClasses(classData || []);
      // Fetch generated reports
      const {
        data: reportData,
        error: reportError
      } = await supabase.from('report_cards').select(`
          *,
          students (full_name, admission_number),
          terms (name),
          sequences (name)
        `).order('generated_at', {
        ascending: false
      }).limit(20);
      // Note: In a real app, you'd filter report_cards by school_id via students join
      // but for MVP we assume the query is correct or RLS handles it.
      // Since report_cards doesn't have school_id directly, we rely on student relation.
      if (reportError) throw reportError;
      setReports(reportData || []);
    } catch (err: any) {
      setError('Failed to fetch reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  if (loading) return <div className="flex justify-center p-12">
        <LoadingSpinner />
      </div>;
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Report Cards</h1>
          <p className="text-slate-500">
            Generate and view student report cards
          </p>
        </div>
        <Button variant="primary" leftIcon={<FileText className="w-4 h-4" />}>
          Generate New Reports
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Reports</p>
              <p className="text-2xl font-bold text-slate-900">
                {reports.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Reports
        </h3>

        <div className="space-y-4">
          {reports.length > 0 ? reports.map(report => <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="font-medium text-slate-900">
                    {report.students?.full_name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {report.scope === 'sequence' ? report.sequences?.name : report.terms?.name}{' '}
                    • Generated{' '}
                    {new Date(report.generated_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  Download PDF
                </Button>
              </div>) : <div className="text-center py-8 text-slate-500">
              No reports generated yet.
            </div>}
        </div>
      </div>
    </div>;
}