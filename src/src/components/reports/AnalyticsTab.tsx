import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  BarChart3, Award, TrendingUp, Users, BookOpen, Target, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ReportColorScheme, DEFAULT_COLOR_SCHEME } from '../../types/reportTemplate';

// Minimal shape consumed from report_cards rows (data is the stored JSONB).
export interface AnalyticsReport {
  id: string;
  student_name: string;
  class_name: string;
  scope: string;
  sequence_name?: string;
  term_name?: string;
  year_name?: string;
  generated_at: string;
  data: any;
}

interface AnalyticsTabProps {
  reports: AnalyticsReport[];
  colorScheme?: ReportColorScheme;
}

const PASS_THRESHOLD = 50;

export function AnalyticsTab({ reports, colorScheme = DEFAULT_COLOR_SCHEME }: AnalyticsTabProps) {
  const primary = colorScheme.primary;
  const secondary = colorScheme.secondary;
  const accent = colorScheme.accent;

  const withAverage = useMemo(
    () => reports.filter(r => typeof r.data?.final_average === 'number'),
    [reports]
  );

  // 1. Grade (letter) distribution
  const gradeDistribution = useMemo(() => {
    const order = ['A', 'B', 'C', 'D', 'F'];
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      const g = r.data?.letter_grade;
      if (g) counts[g] = (counts[g] || 0) + 1;
    });
    return order
      .filter(g => counts[g])
      .map(g => ({ grade: g, count: counts[g] }))
      .concat(
        Object.keys(counts)
          .filter(g => !order.includes(g))
          .map(g => ({ grade: g, count: counts[g] }))
      );
  }, [reports]);

  // 2. Subject-level average performance across the cohort
  const subjectAverages = useMemo(() => {
    const acc: Record<string, { sum: number; n: number }> = {};
    reports.forEach(r => {
      const subjects = Array.isArray(r.data?.subjects) ? r.data.subjects : [];
      subjects.forEach((s: any) => {
        const name = s.subject_name || s.name;
        if (!name) return;
        const pct =
          s.total_out_of > 0 ? (s.total_score / s.total_out_of) * 100 : (s.percentage ?? 0);
        if (!acc[name]) acc[name] = { sum: 0, n: 0 };
        acc[name].sum += pct;
        acc[name].n += 1;
      });
    });
    return Object.entries(acc)
      .map(([name, { sum, n }]) => ({
        name: name.length > 16 ? name.slice(0, 16) + '…' : name,
        average: parseFloat((sum / n).toFixed(1)),
      }))
      .sort((a, b) => b.average - a.average);
  }, [reports]);

  // 3. Pass / fail split
  const passFail = useMemo(() => {
    const passed = withAverage.filter(r => r.data.final_average >= PASS_THRESHOLD).length;
    const failed = withAverage.length - passed;
    return [
      { name: 'Passed', value: passed, color: secondary },
      { name: 'Failed', value: failed, color: '#ef4444' },
    ];
  }, [withAverage, secondary]);

  // 4. Attendance distribution
  const attendanceDistribution = useMemo(() => {
    const buckets = [
      { range: '<60%', test: (a: number) => a < 60 },
      { range: '60-75%', test: (a: number) => a >= 60 && a < 75 },
      { range: '75-90%', test: (a: number) => a >= 75 && a < 90 },
      { range: '90-100%', test: (a: number) => a >= 90 },
    ];
    const vals = reports
      .map(r => r.data?.attendance_percentage)
      .filter((a: any) => typeof a === 'number');
    return buckets.map(b => ({ range: b.range, count: vals.filter(b.test).length }));
  }, [reports]);

  // 5. Per-period average trend
  const periodTrend = useMemo(() => {
    const acc: Record<string, { sum: number; n: number; order: number }> = {};
    withAverage.forEach(r => {
      const label = r.sequence_name || r.term_name || r.year_name || r.scope;
      if (!acc[label]) acc[label] = { sum: 0, n: 0, order: new Date(r.generated_at).getTime() };
      acc[label].sum += r.data.final_average;
      acc[label].n += 1;
      acc[label].order = Math.min(acc[label].order, new Date(r.generated_at).getTime());
    });
    return Object.entries(acc)
      .map(([period, { sum, n, order }]) => ({
        period,
        average: parseFloat((sum / n).toFixed(1)),
        order,
      }))
      .sort((a, b) => a.order - b.order);
  }, [withAverage]);

  const topPerformers = useMemo(
    () =>
      [...withAverage]
        .sort((a, b) => b.data.final_average - a.data.final_average)
        .slice(0, 10),
    [withAverage]
  );

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Available</h3>
            <p className="text-gray-500">Generate report cards to see performance analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryTile icon={<Users className="h-5 w-5" />} label="Reports" value={String(reports.length)} color={primary} />
        <SummaryTile
          icon={<Target className="h-5 w-5" />}
          label="Avg Performance"
          value={withAverage.length ? `${(withAverage.reduce((s, r) => s + r.data.final_average, 0) / withAverage.length).toFixed(1)}%` : '—'}
          color={secondary}
        />
        <SummaryTile
          icon={<TrendingUp className="h-5 w-5" />}
          label="Pass Rate"
          value={withAverage.length ? `${Math.round((passFail[0].value / withAverage.length) * 100)}%` : '—'}
          color={accent}
        />
        <SummaryTile icon={<BookOpen className="h-5 w-5" />} label="Subjects Tracked" value={String(subjectAverages.length)} color={primary} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" style={{ color: primary }} />
              Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Students" fill={primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pass / fail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5" style={{ color: secondary }} />
              Pass / Fail Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPie>
                <Pie
                  data={passFail}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={95}
                  dataKey="value"
                >
                  {passFail.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subject averages (full width) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5" style={{ color: primary }} />
            Average Performance by Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjectAverages.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No subject data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, subjectAverages.length * 34)}>
              <BarChart data={subjectAverages} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={120} fontSize={12} />
                <Tooltip />
                <Bar dataKey="average" name="Avg %" fill={secondary} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" style={{ color: accent }} />
              Attendance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attendanceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Students" fill={accent} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Period trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" style={{ color: primary }} />
              Average Trend by Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            {periodTrend.length <= 1 ? (
              <p className="text-sm text-gray-500 py-8 text-center">
                Need reports from more than one period to show a trend.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={periodTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" fontSize={12} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="average" name="Avg %" stroke={primary} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-5 w-5" style={{ color: accent }} />
            Top 10 Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPerformers.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No ranked reports yet.</p>
          ) : (
            <div className="space-y-2">
              {topPerformers.map((report, index) => (
                <div key={report.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: index === 0 ? accent : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#cbd5e1' }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{report.student_name}</p>
                      <p className="text-xs text-gray-500">{report.class_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: primary }}>{report.data.final_average.toFixed(1)}%</p>
                    {report.data.letter_grade && (
                      <Badge variant="success" className="text-xs">{report.data.letter_grade}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1" style={{ color }}>
          {icon}
          <span className="text-xs font-medium text-gray-600">{label}</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </CardContent>
    </Card>
  );
}
