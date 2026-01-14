import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { useAuth } from '../../hooks/useAuth';
import { FileText, Download, Eye, Search, Filter, Award, Printer, X, Calendar } from 'lucide-react';
import { downloadCSV } from '../../utils/csvExport';
import { ReportCardPreview } from '../../components/reports/ReportCardPreview';
interface ReportCard {
  id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  scope: 'sequence' | 'term' | 'year';
  sequence_id?: string;
  term_id?: string;
  academic_year_id?: string;
  sequence_name?: string;
  term_name?: string;
  year_name?: string;
  data: any;
  generated_at: string;
}
export function ReportCardsPage() {
  const {
    user
  } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportCard[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [filterClass, setFilterClass] = useState('');
  const [filterScope, setFilterScope] = useState('');
  const [filterSequence, setFilterSequence] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMinAverage, setFilterMinAverage] = useState('');
  const [filterMaxAverage, setFilterMaxAverage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null);
  const [stats, setStats] = useState({
    totalReports: 0,
    sequenceReports: 0,
    termReports: 0,
    yearReports: 0,
    avgPerformance: 0
  });
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  useEffect(() => {
    applyFilters();
  }, [reportCards, filterClass, filterScope, filterSequence, filterTerm, filterYear, filterDateFrom, filterDateTo, filterMinAverage, filterMaxAverage, searchQuery]);
  const fetchData = async () => {
    if (!user?.school_id) return;
    try {
      setLoading(true);
      setError('');
      const [schoolData, templateData, classesData, sequencesData, termsData, yearsData, reportsData] = await Promise.all([supabase.from('schools').select('*').eq('id', user.school_id).single(), supabase.from('report_templates').select('*').eq('school_id', user.school_id).limit(1).maybeSingle(), supabase.from('classes').select('id, name').eq('school_id', user.school_id), supabase.from('sequences').select('id, name, term_id, terms!inner(academic_year_id, academic_years!inner(school_id))').eq('terms.academic_years.school_id', user.school_id), supabase.from('terms').select('id, name, academic_year_id, academic_years!inner(school_id)').eq('academic_years.school_id', user.school_id), supabase.from('academic_years').select('id, year_name').eq('school_id', user.school_id), supabase.from('report_cards').select('id, student_id, scope, sequence_id, term_id, academic_year_id, data, generated_at')]);
      if (schoolData.error) throw schoolData.error;
      if (classesData.error) throw classesData.error;
      if (sequencesData.error) throw sequencesData.error;
      if (termsData.error) throw termsData.error;
      if (yearsData.error) throw yearsData.error;
      if (reportsData.error) throw reportsData.error;
      setSchool(schoolData.data);
      setTemplate(templateData.data?.config || {
        showLogo: true,
        showRank: true,
        showAttendance: true,
        showComments: true
      });
      const enrichedReports = await Promise.all((reportsData.data || []).map(async report => {
        const {
          data: studentData
        } = await supabase.from('students').select('full_name, admission_number, class_id').eq('id', report.student_id).single();
        const classData = classesData.data?.find(c => c.id === studentData?.class_id);
        let scopeName = '';
        if (report.scope === 'sequence' && report.sequence_id) {
          const seq = sequencesData.data?.find(s => s.id === report.sequence_id);
          scopeName = seq?.name || 'Unknown Sequence';
        } else if (report.scope === 'term' && report.term_id) {
          const term = termsData.data?.find(t => t.id === report.term_id);
          scopeName = term?.name || 'Unknown Term';
        } else if (report.scope === 'year' && report.academic_year_id) {
          const year = yearsData.data?.find(y => y.id === report.academic_year_id);
          scopeName = year?.year_name || 'Unknown Year';
        }
        return {
          ...report,
          student_name: studentData?.full_name || 'Unknown',
          admission_number: studentData?.admission_number || 'N/A',
          class_name: classData?.name || 'Unknown',
          sequence_name: report.scope === 'sequence' ? scopeName : undefined,
          term_name: report.scope === 'term' ? scopeName : undefined,
          year_name: report.scope === 'year' ? scopeName : undefined
        };
      }));
      setClasses(classesData.data || []);
      setSequences(sequencesData.data || []);
      setTerms(termsData.data || []);
      setAcademicYears(yearsData.data || []);
      setReportCards(enrichedReports);
      const averages = enrichedReports.map(r => r.data?.final_average).filter(a => a !== undefined && a !== null);
      setStats({
        totalReports: enrichedReports.length,
        sequenceReports: enrichedReports.filter(r => r.scope === 'sequence').length,
        termReports: enrichedReports.filter(r => r.scope === 'term').length,
        yearReports: enrichedReports.filter(r => r.scope === 'year').length,
        avgPerformance: averages.length > 0 ? Math.round(averages.reduce((sum, a) => sum + a, 0) / averages.length * 10) / 10 : 0
      });
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load report cards');
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = [...reportCards];
    if (filterClass) {
      filtered = filtered.filter(r => {
        const classId = classes.find(c => c.name === r.class_name)?.id;
        return classId === filterClass;
      });
    }
    if (filterScope) filtered = filtered.filter(r => r.scope === filterScope);
    if (filterSequence) filtered = filtered.filter(r => r.sequence_id === filterSequence);
    if (filterTerm) filtered = filtered.filter(r => r.term_id === filterTerm);
    if (filterYear) filtered = filtered.filter(r => r.academic_year_id === filterYear);
    if (filterDateFrom) {
      filtered = filtered.filter(r => new Date(r.generated_at) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      filtered = filtered.filter(r => new Date(r.generated_at) <= new Date(filterDateTo));
    }
    if (filterMinAverage) {
      filtered = filtered.filter(r => (r.data?.final_average || 0) >= parseFloat(filterMinAverage));
    }
    if (filterMaxAverage) {
      filtered = filtered.filter(r => (r.data?.final_average || 0) <= parseFloat(filterMaxAverage));
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => r.student_name.toLowerCase().includes(query) || r.admission_number.toLowerCase().includes(query));
    }
    setFilteredReports(filtered);
  };
  const handleClearFilters = () => {
    setFilterClass('');
    setFilterScope('');
    setFilterSequence('');
    setFilterTerm('');
    setFilterYear('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterMinAverage('');
    setFilterMaxAverage('');
    setSearchQuery('');
  };
  const handlePrint = (report: ReportCard) => {
    setSelectedReport(report);
    setPreviewModalOpen(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };
  const handleExport = () => {
    const exportData = filteredReports.map(r => ({
      Student: r.student_name,
      'Admission No': r.admission_number,
      Class: r.class_name,
      Scope: r.scope,
      Period: r.sequence_name || r.term_name || r.year_name || 'N/A',
      Average: r.data?.final_average || 'N/A',
      Rank: r.data?.rank || 'N/A',
      Attendance: r.data?.attendance_percentage ? `${r.data.attendance_percentage.toFixed(1)}%` : 'N/A',
      Generated: new Date(r.generated_at).toLocaleDateString()
    }));
    downloadCSV(exportData, `report_cards_${new Date().toISOString().split('T')[0]}.csv`);
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-12 h-12" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
          <p className="text-gray-500">View and manage student report cards</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="h-4 w-4" />}>
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={filteredReports.length === 0} leftIcon={<Download className="h-4 w-4" />}>
            Export CSV
          </Button>
        </div>
      </div>

      {error && <Alert type="error" title="Error">{error}</Alert>}
      {success && <Alert type="success" title="Success">{success}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Total Reports</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalReports}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Sequence</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.sequenceReports}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Term</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.termReports}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Year</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.yearReports}
            </h3>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-600">Avg Performance</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.avgPerformance}%
            </h3>
          </CardContent>
        </Card>
      </div>

      {showFilters && <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Advanced Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClearFilters} leftIcon={<X className="h-4 w-4" />}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>

              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filterScope} onValueChange={setFilterScope}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Scopes</SelectItem>
                  <SelectItem value="sequence">Sequence</SelectItem>
                  <SelectItem value="term">Term</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>

              {filterScope === 'sequence' && <Select value={filterSequence} onValueChange={setFilterSequence}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Sequence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sequences</SelectItem>
                    {sequences.map(seq => <SelectItem key={seq.id} value={seq.id}>
                        {seq.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>}

              {filterScope === 'term' && <Select value={filterTerm} onValueChange={setFilterTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Terms</SelectItem>
                    {terms.map(term => <SelectItem key={term.id} value={term.id}>
                        {term.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>}

              {filterScope === 'year' && <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Years</SelectItem>
                    {academicYears.map(year => <SelectItem key={year.id} value={year.id}>
                        {year.year_name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>}

              <Input type="date" label="From Date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />

              <Input type="date" label="To Date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />

              <Input type="number" label="Min Average %" value={filterMinAverage} onChange={e => setFilterMinAverage(e.target.value)} placeholder="0" />

              <Input type="number" label="Max Average %" value={filterMaxAverage} onChange={e => setFilterMaxAverage(e.target.value)} placeholder="100" />
            </div>
          </CardContent>
        </Card>}

      <Card>
        <CardHeader>
          <CardTitle>Report Cards ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No report cards found</p>
              <p className="text-gray-400 text-sm mt-2">
                {reportCards.length === 0 ? 'Report cards will appear here once generated' : 'Try adjusting your filters'}
              </p>
            </div> : <div className="space-y-3">
              {filteredReports.map(report => <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {report.student_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {report.admission_number}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-600">
                            {report.class_name}
                          </span>
                          <Badge variant="neutral">{report.scope}</Badge>
                          {(report.sequence_name || report.term_name || report.year_name) && <span className="text-xs text-gray-600">
                              {report.sequence_name || report.term_name || report.year_name}
                            </span>}
                          {report.data?.final_average && <Badge variant={report.data.final_average >= 60 ? 'success' : 'warning'}>
                              {report.data.final_average.toFixed(1)}%
                            </Badge>}
                          {report.data?.rank && <div className="flex items-center gap-1">
                              <Award className="h-3 w-3 text-amber-500" />
                              <span className="text-xs font-medium text-amber-600">
                                #{report.data.rank}
                              </span>
                            </div>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => {
                setSelectedReport(report);
                setViewModalOpen(true);
              }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                setSelectedReport(report);
                setPreviewModalOpen(true);
              }}>
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrint(report)} leftIcon={<Printer className="h-4 w-4" />}>
                      Print
                    </Button>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {viewModalOpen && selectedReport && <Dialog isOpen={viewModalOpen} onClose={() => {
      setViewModalOpen(false);
      setSelectedReport(null);
    }} title="Report Card Details" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Student
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedReport.student_name}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedReport.admission_number}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Class
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedReport.class_name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Scope
                </label>
                <Badge variant="neutral" className="mt-1">
                  {selectedReport.scope}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Period
                </label>
                <p className="text-gray-900">
                  {selectedReport.sequence_name || selectedReport.term_name || selectedReport.year_name || 'Academic Year'}
                </p>
              </div>
            </div>

            {selectedReport.data && <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Performance Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedReport.data.final_average && <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Average</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedReport.data.final_average.toFixed(1)}%
                      </p>
                    </div>}
                  {selectedReport.data.rank && <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm text-gray-600">Rank</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {selectedReport.data.rank} /{' '}
                        {selectedReport.data.class_size || 'N/A'}
                      </p>
                    </div>}
                  {selectedReport.data.attendance_percentage !== undefined && <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Attendance</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedReport.data.attendance_percentage.toFixed(1)}%
                      </p>
                    </div>}
                  {selectedReport.data.letter_grade && <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Grade</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedReport.data.letter_grade}
                      </p>
                    </div>}
                </div>
              </div>}

            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-600">
                Generated
              </label>
              <p className="text-gray-900 flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                {new Date(selectedReport.generated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Dialog>}

      {previewModalOpen && selectedReport && school && <Dialog isOpen={previewModalOpen} onClose={() => {
      setPreviewModalOpen(false);
      setSelectedReport(null);
    }} title="Report Card Preview" size="xl">
          <div ref={printRef} className="print:p-0">
            <ReportCardPreview student={{
          full_name: selectedReport.student_name,
          admission_number: selectedReport.admission_number,
          class_name: selectedReport.class_name
        }} reportData={selectedReport.data || {}} period={{
          scope: selectedReport.scope,
          name: selectedReport.sequence_name || selectedReport.term_name || selectedReport.year_name || 'Academic Year'
        }} school={{
          name: school.name,
          address: school.address,
          logo_path: school.logo_path
        }} template={template} />
          </div>
          <div className="flex items-center justify-end gap-2 mt-6 print:hidden">
            <Button variant="outline" onClick={() => {
          setPreviewModalOpen(false);
          setSelectedReport(null);
        }}>
              Close
            </Button>
            <Button onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />}>
              Print Report Card
            </Button>
          </div>
        </Dialog>}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-card-preview, #report-card-preview * {
            visibility: visible;
          }
          #report-card-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>;
}