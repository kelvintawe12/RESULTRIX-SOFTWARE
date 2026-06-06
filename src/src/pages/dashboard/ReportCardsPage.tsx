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
import { FileText, Download, Eye, Search, Filter, Award, Printer, X, Calendar, TrendingUp, TrendingDown, BarChart3, Users, BookOpen, Target, Clock } from 'lucide-react';
import { downloadCSV } from '../../utils/csvExport';
import { DynamicReportCard } from '../../components/reports/DynamicReportCard';
import { ResolvedTemplate, DEFAULT_TEMPLATE, resolveTemplate } from '../../types/reportTemplate';
import { downloadElementPdf, reportsToZip, downloadBlob } from '../../utils/pdfExport';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { AnalyticsTab } from '../../components/reports/AnalyticsTab';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
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
  const [template, setTemplate] = useState<ResolvedTemplate>(DEFAULT_TEMPLATE);
  const [selectedClassView, setSelectedClassView] = useState(''); // For main class view
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
  const [transcriptType, setTranscriptType] = useState<'official' | 'unofficial'>('unofficial');
  const [generateClassModalOpen, setGenerateClassModalOpen] = useState(false);
  const [selectedClassForGeneration, setSelectedClassForGeneration] = useState('');
  const [selectedScopeForGeneration, setSelectedScopeForGeneration] = useState<'sequence' | 'term' | 'year'>('sequence');
  const [selectedPeriodForGeneration, setSelectedPeriodForGeneration] = useState('');
  const [generating, setGenerating] = useState(false);
  // PDF export state
  const [pdfBusy, setPdfBusy] = useState(false);
  const [bulkExporting, setBulkExporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [bulkTarget, setBulkTarget] = useState<ReportCard | null>(null);
  const bulkReadyResolver = useRef<(() => void) | null>(null);
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
  }, [reportCards, selectedClassView, filterClass, filterScope, filterSequence, filterTerm, filterYear, filterDateFrom, filterDateTo, filterMinAverage, filterMaxAverage, searchQuery]);
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
      setTemplate(resolveTemplate(templateData.data));
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
    
    // Apply main class view filter first
    if (selectedClassView) {
      filtered = filtered.filter(r => {
        const classId = classes.find(c => c.name === r.class_name)?.id;
        return classId === selectedClassView;
      });
    }
    
    // Then apply additional filters
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

  // Download the currently-previewed report card as a PDF.
  const handleDownloadPdf = async () => {
    const el = document.getElementById('dynamic-report-card');
    if (!el || !selectedReport) return;
    try {
      setPdfBusy(true);
      const name = `report_${selectedReport.student_name}_${selectedReport.sequence_name || selectedReport.term_name || selectedReport.year_name || ''}`.trim();
      await downloadElementPdf(el, name);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setPdfBusy(false);
    }
  };

  // Bulk-export all filtered reports as a ZIP of individual PDFs.
  // Each report is rendered once through a shared off-screen DynamicReportCard
  // (bulkTarget); onReady resolves bulkReadyResolver so html2canvas captures the
  // finished card rather than the loading spinner.
  const handleBulkPdf = async () => {
    if (filteredReports.length === 0) return;
    if (filteredReports.length > 60 &&
        !window.confirm(`You are about to export ${filteredReports.length} report cards. This may take a while. Continue?`)) {
      return;
    }
    try {
      setBulkExporting(true);
      setError('');
      setBulkProgress({ done: 0, total: filteredReports.length });

      const items = filteredReports.map(report => ({ name: bulkItemName(report), report }));
      const blob = await reportsToZip(
        items,
        async ({ report }) => {
          // Render this report off-screen and wait for it to finish loading.
          await new Promise<void>(resolve => {
            bulkReadyResolver.current = resolve;
            setBulkTarget(report);
          });
          // Give the browser one frame to paint the freshly-set state.
          await new Promise(r => requestAnimationFrame(() => r(null)));
          const el = document.getElementById('dynamic-report-card');
          if (!el) throw new Error('Report element not found');
          return el;
        },
        (done, total) => setBulkProgress({ done, total })
      );

      downloadBlob(blob, `report_cards_${new Date().toISOString().split('T')[0]}.zip`);
      setSuccess(`Exported ${filteredReports.length} report card(s) to ZIP.`);
    } catch (err: any) {
      console.error('Bulk PDF export failed:', err);
      setError('Failed to export report cards. Please try again.');
    } finally {
      setBulkExporting(false);
      setBulkTarget(null);
      bulkReadyResolver.current = null;
      setBulkProgress({ done: 0, total: 0 });
    }
  };

  // Map a ReportCard to a filename for the bulk ZIP.
  const bulkItemName = (report: ReportCard) =>
    `${report.student_name}_${report.sequence_name || report.term_name || report.year_name || report.scope}`;

  const handleGenerateClassReports = async () => {
    if (!selectedClassForGeneration || !selectedPeriodForGeneration || !user?.school_id) {
      setError('Please select a class and period');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      setSuccess('');

      // Fetch all students in the selected class
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('class_id', selectedClassForGeneration)
        .eq('school_id', user.school_id);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        setError('No students found in the selected class');
        setGenerating(false);
        return;
      }

      // Call the SQL function for each student
      let successCount = 0;
      let errorCount = 0;

      for (const student of students) {
        try {
          const params: any = { p_student_id: student.id };
          
          if (selectedScopeForGeneration === 'sequence') {
            params.p_sequence_id = selectedPeriodForGeneration;
          } else if (selectedScopeForGeneration === 'term') {
            params.p_term_id = selectedPeriodForGeneration;
          } else if (selectedScopeForGeneration === 'year') {
            params.p_academic_year_id = selectedPeriodForGeneration;
          }

          const { error: generateError } = await supabase.rpc('compute_student_report', params);

          if (generateError) {
            console.error(`Error generating report for ${student.full_name}:`, generateError);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Error generating report for ${student.full_name}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully generated ${successCount} report(s)${errorCount > 0 ? `. ${errorCount} failed.` : '!'}`);
        // Refresh the report cards list
        await fetchData();
      } else {
        setError(`Failed to generate reports. ${errorCount} error(s) occurred.`);
      }

      setGenerateClassModalOpen(false);
      setSelectedClassForGeneration('');
      setSelectedScopeForGeneration('sequence');
      setSelectedPeriodForGeneration('');
    } catch (err: any) {
      console.error('Error generating class reports:', err);
      setError(err.message || 'Failed to generate class reports');
    } finally {
      setGenerating(false);
    }
  };

  const getPeriodsForScope = () => {
    if (selectedScopeForGeneration === 'sequence') return sequences;
    if (selectedScopeForGeneration === 'term') return terms;
    if (selectedScopeForGeneration === 'year') return academicYears;
    return [];
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-12 h-12" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
            <p className="text-gray-500">View and manage student report cards</p>
          </div>
          <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setGenerateClassModalOpen(true)} leftIcon={<FileText className="h-4 w-4" />}>
            Generate Class Reports
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="h-4 w-4" />}>
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
            <Button variant="outline" onClick={handleExport} disabled={filteredReports.length === 0} leftIcon={<Download className="h-4 w-4" />}>
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleBulkPdf}
              disabled={filteredReports.length === 0 || bulkExporting}
              isLoading={bulkExporting}
              leftIcon={<Download className="h-4 w-4" />}
            >
              {bulkExporting
                ? `Exporting ${bulkProgress.done}/${bulkProgress.total}…`
                : 'Download All (ZIP)'}
            </Button>
          </div>
        </div>

        {/* Class Selector */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <label className="text-sm font-semibold text-gray-700">View by Class:</label>
              </div>
              <Select value={selectedClassView} onValueChange={setSelectedClassView}>
                <SelectTrigger className="w-full sm:w-64 bg-white">
                  {selectedClassView ? (
                    <span>
                      {classes.find(c => c.id === selectedClassView)?.name} ({reportCards.filter(r => {
                        const classId = classes.find(c => c.name === r.class_name)?.id;
                        return classId === selectedClassView;
                      }).length} reports)
                    </span>
                  ) : (
                    <SelectValue placeholder="All Classes" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({reportCards.filter(r => {
                        const classId = classes.find(c => c.name === r.class_name)?.id;
                        return classId === cls.id;
                      }).length} reports)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClassView && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedClassView('')}
                  leftIcon={<X className="h-4 w-4" />}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
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

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" /> Reports
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
              Performance Analytics
              {selectedClassView && (
                <Badge variant="info" className="text-sm">
                  {classes.find(c => c.id === selectedClassView)?.name}
                </Badge>
              )}
            </h2>
            <p className="text-sm text-gray-600">
              Showing {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
            </p>
          </div>
          <AnalyticsTab reports={filteredReports} colorScheme={template.colorScheme} />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
      {/* Report Cards List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Report Cards ({filteredReports.length})
            {selectedClassView && (
              <span className="text-indigo-600 ml-2">
                - {classes.find(c => c.id === selectedClassView)?.name}
              </span>
            )}
          </h2>
        </div>

        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Cards Found</h3>
                <p className="text-gray-500 mb-6">
                  {reportCards.length === 0 
                    ? 'Generate report cards to see them here' 
                    : 'Try adjusting your filters to find reports'}
                </p>
                {reportCards.length === 0 && (
                  <Button 
                    variant="primary" 
                    onClick={() => setGenerateClassModalOpen(true)}
                    leftIcon={<FileText className="h-4 w-4" />}
                  >
                    Generate Reports
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReports.map(report => (
              <Card key={report.id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200">
                <CardContent className="p-6">
                  {/* Student Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3 flex-shrink-0">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 truncate text-lg">
                          {report.student_name}
                        </h3>
                        <p className="text-sm text-gray-500 font-mono">
                          {report.admission_number}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="neutral" 
                      className="flex-shrink-0 text-xs font-semibold"
                    >
                      {report.scope.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Class and Period Info */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">{report.class_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {report.sequence_name || report.term_name || report.year_name || 'Academic Year'}
                      </span>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  {report.data && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Average Score */}
                      {report.data.final_average !== undefined && (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                            Average
                          </p>
                          <div className="flex items-baseline gap-1">
                            <p className="text-2xl font-bold text-blue-600">
                              {((report.data.final_average / 100) * 20).toFixed(1)}
                            </p>
                            <span className="text-sm text-blue-600">/20</span>
                          </div>
                          {report.data.letter_grade && (
                            <Badge 
                              variant={report.data.final_average >= 60 ? 'success' : 'danger'} 
                              className="mt-1 text-xs"
                            >
                              {report.data.letter_grade}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Class Rank */}
                      {(report.data.rank !== undefined && report.data.rank !== null) && (
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                            Rank
                          </p>
                          <div className="flex items-baseline gap-1">
                            <p className="text-2xl font-bold text-amber-600">
                              #{report.data.rank}
                            </p>
                            <span className="text-sm text-amber-600">
                              / {report.data.class_size}
                            </span>
                          </div>
                          {report.data.rank <= 3 && (
                            <span className="text-lg">🏆</span>
                          )}
                        </div>
                      )}

                      {/* Attendance */}
                      {report.data.attendance_percentage !== undefined && (
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                            Attendance
                          </p>
                          <div className="flex items-baseline gap-1">
                            <p className="text-2xl font-bold text-green-600">
                              {report.data.attendance_percentage.toFixed(0)}
                            </p>
                            <span className="text-sm text-green-600">%</span>
                          </div>
                        </div>
                      )}

                      {/* Subjects Count */}
                      {report.data.subjects && Array.isArray(report.data.subjects) && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                            Subjects
                          </p>
                          <div className="flex items-baseline gap-1">
                            <p className="text-2xl font-bold text-purple-600">
                              {report.data.subjects.length}
                            </p>
                            <BookOpen className="h-4 w-4 text-purple-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        if (report.data) {
                          setSelectedReport(report);
                          setViewModalOpen(true);
                        } else {
                          setError('Report data not available. Please regenerate this report.');
                        }
                      }}
                      leftIcon={<Eye className="h-4 w-4" />}
                      className="w-full"
                      disabled={!report.data}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => {
                        setSelectedReport(report);
                        setTranscriptType('official');
                        setPreviewModalOpen(true);
                      }}
                      leftIcon={<Award className="h-4 w-4" />}
                      className="w-full"
                    >
                      Official
                    </Button>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setTranscriptType('unofficial');
                        setPreviewModalOpen(true);
                      }}
                      className="text-xs text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      Unofficial
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setTranscriptType('unofficial');
                        setPreviewModalOpen(true);
                        setTimeout(() => window.print(), 500);
                      }}
                      className="text-xs text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
                    >
                      <Printer className="h-3 w-3" />
                      Print
                    </button>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-400">
                      {new Date(report.generated_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
        </TabsContent>
      </Tabs>

      {viewModalOpen && selectedReport && selectedReport.data && (
        <Dialog 
          isOpen={viewModalOpen} 
          onClose={() => {
            setViewModalOpen(false);
            setSelectedReport(null);
          }} 
          title="" 
          size="xl"
        >
          <div className="space-y-6 max-h-[85vh] overflow-y-auto">
            {/* Header Section with Student Info */}
            <div className="bg-white border-b-4 border-indigo-600 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-indigo-100 rounded-lg p-2">
                      <Award className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Report Card</p>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedReport.student_name}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-mono">{selectedReport.admission_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{selectedReport.class_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{selectedReport.sequence_name || selectedReport.term_name || selectedReport.year_name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="neutral" className="text-sm px-3 py-1">
                    {selectedReport.scope.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Overall Average */}
              <div className="bg-white border-2 border-blue-200 rounded-lg p-5 hover:border-blue-400 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-6 w-6 text-blue-600" />
                  {selectedReport.data.final_average >= 60 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Overall Average</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">{((selectedReport.data.final_average / 100) * 20).toFixed(1)}</p>
                  <span className="text-lg text-gray-600">/ 20</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">({selectedReport.data.final_average.toFixed(1)}%)</p>
                {selectedReport.data.letter_grade && (
                  <Badge variant={selectedReport.data.final_average >= 60 ? 'success' : 'danger'} className="text-xs mt-1">
                    Grade {selectedReport.data.letter_grade}
                  </Badge>
                )}
              </div>

              {/* Class Rank */}
              {(selectedReport.data.rank !== undefined && selectedReport.data.rank !== null) && (
                <div className="bg-white border-2 border-amber-200 rounded-lg p-5 hover:border-amber-400 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="h-6 w-6 text-amber-600" />
                    {selectedReport.data.rank <= 3 && <span className="text-xl">🏆</span>}
                  </div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Class Ranking</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <p className="text-3xl font-bold text-gray-900">#{selectedReport.data.rank}</p>
                    <p className="text-lg text-gray-600">/ {selectedReport.data.class_size}</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    {selectedReport.data.rank === 1 ? 'Top of Class!' : 
                     selectedReport.data.rank <= 3 ? 'Top 3 Student' : 
                     `Top ${Math.round((selectedReport.data.rank / selectedReport.data.class_size) * 100)}%`}
                  </p>
                </div>
              )}

              {/* Attendance */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-5 hover:border-green-400 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-6 w-6 text-green-600" />
                  <span className="text-xl">{selectedReport.data.attendance_percentage >= 90 ? '✓' : '!'}</span>
                </div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Attendance</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{selectedReport.data.attendance_percentage.toFixed(1)}%</p>
                {selectedReport.data.attendance_present !== undefined && selectedReport.data.attendance_total !== undefined && (
                  <p className="text-xs text-gray-600">
                    {selectedReport.data.attendance_present} / {selectedReport.data.attendance_total} days
                  </p>
                )}
              </div>

              {/* Total Subjects */}
              {selectedReport.data.subjects && Array.isArray(selectedReport.data.subjects) && (
                <div className="bg-white border-2 border-purple-200 rounded-lg p-5 hover:border-purple-400 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Subjects</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{selectedReport.data.subjects.length}</p>
                  <p className="text-xs text-gray-600">Enrolled courses</p>
                </div>
              )}
            </div>

            {/* Charts Section */}
            {selectedReport.data.subjects && Array.isArray(selectedReport.data.subjects) && selectedReport.data.subjects.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                {/* Subject Performance Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Subject Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={(selectedReport.data.subjects || []).map((subj: any) => {
                        const name = subj.subject_name || subj.name || 'Unknown Subject';
                        const score = subj.total_out_of > 0 ? ((subj.total_score / subj.total_out_of) * 100) : (subj.percentage || 0);
                        return {
                          name: name.length > 15 ? name.substring(0, 15) + '...' : name,
                          score: typeof score === 'number' ? parseFloat(score.toFixed(1)) : 0
                        };
                      })}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#3b82f6" name="Score %" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Subject Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-5 w-5 text-green-600" />
                      Core vs Elective Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={[
                            {
                              name: 'Core Subjects',
                              value: selectedReport.data.subjects.filter((s: any) => s.subject_type === 'core').length,
                              color: '#10b981'
                            },
                            {
                              name: 'Elective Subjects',
                              value: selectedReport.data.subjects.filter((s: any) => s.subject_type === 'elective').length,
                              color: '#3b82f6'
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[{ color: '#10b981' }, { color: '#3b82f6' }].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Subjects Table */}
            {selectedReport.data.subjects && Array.isArray(selectedReport.data.subjects) && selectedReport.data.subjects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    Subject Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Subject</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Type</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Coefficient</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Score</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Percentage</th>
                          <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReport.data.subjects.map((subject: any, index: number) => {
                          const subjectName = subject.subject_name || subject.name || 'Unknown Subject';
                          const subjectType = subject.subject_type || subject.type || 'N/A';
                          const coefficient = subject.coefficient || subject.coef || 1;
                          const totalScore = subject.total_score || subject.score || 0;
                          const totalOutOf = subject.total_out_of || subject.out_of || subject.max_score || 100;
                          const percentage = totalOutOf > 0 ? ((totalScore / totalOutOf) * 100) : (subject.percentage || 0);
                          const letterGrade = subject.letter_grade || subject.grade || 'N/A';
                          
                          return (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900">{subjectName}</td>
                              <td className="py-3 px-4 text-center">
                                <Badge variant={subjectType === 'core' ? 'success' : 'info'} className="text-xs">
                                  {subjectType}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center font-semibold text-gray-700">{coefficient}</td>
                              <td className="py-3 px-4 text-center font-mono text-gray-900">
                                {totalScore} / {totalOutOf}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`font-bold ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                                  {percentage.toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge variant={percentage >= 60 ? 'success' : 'danger'}>
                                  {letterGrade}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            {selectedReport.data.teacher_comments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Teacher's Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed italic bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                    "{selectedReport.data.teacher_comments}"
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Footer with Actions */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
              <div className="text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Generated: {new Date(selectedReport.generated_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewModalOpen(false);
                    setSelectedReport(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setViewModalOpen(false);
                    setTranscriptType('unofficial');
                    setPreviewModalOpen(true);
                  }}
                  leftIcon={<FileText className="h-4 w-4" />}
                >
                  View Full Report
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setViewModalOpen(false);
                    setTranscriptType('official');
                    setPreviewModalOpen(true);
                  }}
                  leftIcon={<Award className="h-4 w-4" />}
                >
                  Official Transcript
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Generate Class Reports Modal */}
      {generateClassModalOpen && (
        <Dialog
          isOpen={generateClassModalOpen}
          onClose={() => {
            setGenerateClassModalOpen(false);
            setSelectedClassForGeneration('');
            setSelectedScopeForGeneration('sequence');
            setSelectedPeriodForGeneration('');
          }}
          title="Generate Class Reports"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate report cards for all students in a class for a specific period.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Class *
              </label>
              <Select value={selectedClassForGeneration} onValueChange={setSelectedClassForGeneration}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Scope *
              </label>
              <Select 
                value={selectedScopeForGeneration} 
                onValueChange={(value: any) => {
                  setSelectedScopeForGeneration(value);
                  setSelectedPeriodForGeneration('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequence">Sequence</SelectItem>
                  <SelectItem value="term">Term</SelectItem>
                  <SelectItem value="year">Academic Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Period *
              </label>
              <Select value={selectedPeriodForGeneration} onValueChange={setSelectedPeriodForGeneration}>
                <SelectTrigger>
                  <SelectValue placeholder={`Choose a ${selectedScopeForGeneration}`} />
                </SelectTrigger>
                <SelectContent>
                  {getPeriodsForScope().map((period: any) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name || period.year_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will generate report cards for all students in the selected class. 
                Existing reports for the same period will be replaced.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setGenerateClassModalOpen(false);
                  setSelectedClassForGeneration('');
                  setSelectedScopeForGeneration('sequence');
                  setSelectedPeriodForGeneration('');
                }}
                disabled={generating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateClassReports}
                disabled={!selectedClassForGeneration || !selectedPeriodForGeneration || generating}
                isLoading={generating}
                leftIcon={<FileText className="h-4 w-4" />}
              >
                {generating ? 'Generating...' : 'Generate Reports'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}


      {previewModalOpen && selectedReport && school && <Dialog isOpen={previewModalOpen} onClose={() => {
      setPreviewModalOpen(false);
      setSelectedReport(null);
    }} title={transcriptType === 'official' ? 'Official Transcript' : 'Report Card'} size="xl">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <div className="flex gap-2">
              <Button 
                variant={transcriptType === 'unofficial' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTranscriptType('unofficial')}
              >
                Unofficial
              </Button>
              <Button 
                variant={transcriptType === 'official' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTranscriptType('official')}
                leftIcon={<Award className="h-4 w-4" />}
              >
                Official
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {transcriptType === 'official' ? (
                <span className="text-red-600 font-semibold">⚠️ Official Document</span>
              ) : (
                <span>Unofficial Preview</span>
              )}
            </div>
          </div>
          <div ref={printRef} className="print:p-0">
            {selectedReport && (
              <DynamicReportCard
                studentId={selectedReport.student_id}
                sequenceId={selectedReport.sequence_id}
                termId={selectedReport.term_id}
                academicYearId={selectedReport.academic_year_id}
                schoolId={user?.school_id || ''}
                transcriptType={transcriptType}
                rank={selectedReport.data?.rank}
                classSize={selectedReport.data?.class_size}
                template={template}
              />
            )}
          </div>
          <div className="flex items-center justify-end gap-2 mt-6 print:hidden">
            <Button variant="outline" onClick={() => {
          setPreviewModalOpen(false);
          setSelectedReport(null);
        }}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              isLoading={pdfBusy}
              disabled={pdfBusy}
              leftIcon={<Download className="h-4 w-4" />}
            >
              {pdfBusy ? 'Generating…' : 'Download PDF'}
            </Button>
            <Button onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />}>
              Print {transcriptType === 'official' ? 'Official Transcript' : 'Report Card'}
            </Button>
          </div>
        </Dialog>}

      {/* Off-screen host for bulk PDF rendering. Renders one report at a time;
          onReady resolves the pending promise so html2canvas captures the finished card. */}
      {bulkTarget && (
        <div aria-hidden style={{ position: 'fixed', left: -10000, top: 0, width: 1024, background: '#fff', zIndex: -1 }}>
          <DynamicReportCard
            key={bulkTarget.id}
            studentId={bulkTarget.student_id}
            sequenceId={bulkTarget.sequence_id}
            termId={bulkTarget.term_id}
            academicYearId={bulkTarget.academic_year_id}
            schoolId={user?.school_id || ''}
            transcriptType={transcriptType}
            rank={bulkTarget.data?.rank}
            classSize={bulkTarget.data?.class_size}
            template={template}
            onReady={() => bulkReadyResolver.current?.()}
          />
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #dynamic-report-card, #dynamic-report-card * {
            visibility: visible;
          }
          #dynamic-report-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>;
}