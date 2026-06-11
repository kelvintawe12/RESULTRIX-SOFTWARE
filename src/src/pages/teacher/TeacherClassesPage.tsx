import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { BookOpen, Users, Eye, Search, TrendingUp, Clock, Award, ArrowRight, Filter, Calendar, CheckCircle, AlertTriangle, BarChart3, Plus, Settings, MoreVertical } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
interface ClassAssignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  status: string;
  created_at: string;
  subjects: {
    name: string;
    coefficient: number;
    subject_type: string;
  };
  classes: {
    name: string;
    description: string | null;
  };
  studentCount: number;
  averageMark?: number;
  attendanceRate?: number;
  recentActivity?: string;
  nextClass?: string;
  marksSubmitted?: number;
  totalStudents?: number;
}
export function TeacherClassesPage() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'core' | 'elective'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'students' | 'attendance'>('name');

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    if (user?.id) {
      fetchTeacherAssignments();
    }
  }, [user?.id]);

  const fetchTeacherAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch teacher assignments with subject and class details
      const {
        data: assignmentsData,
        error: assignmentsError
      } = await supabase.from('teacher_assignments').select(`
          id,
          teacher_id,
          subject_id,
          class_id,
          created_at,
          subjects (
            name,
            coefficient,
            subject_type
          ),
          classes (
            name,
            description
          )
        `).eq('teacher_id', user?.id);

      if (assignmentsError) throw assignmentsError;

      // For each assignment, get student count and stats with timeout
      const assignmentsWithStats = await Promise.all((assignmentsData || []).map(async assignment => {
        try {
          // Get student count with timeout
          const { count } = await Promise.race([
            supabase.from('students').select('*', {
              count: 'exact',
              head: true
            }).eq('class_id', assignment.class_id),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Query timeout')), 3000)
            )
          ]) as { count: number };

          const subj = Array.isArray(assignment.subjects) ? assignment.subjects[0] : assignment.subjects;
          const cls = Array.isArray(assignment.classes) ? assignment.classes[0] : assignment.classes;

          // Simulate some additional stats for demo purposes
          const avgMark = 70 + Math.random() * 20; // 70-90%
          const attendanceRate = 75 + Math.random() * 20; // 75-95%

          return {
            ...assignment,
            status: (assignment as any).status ?? 'active',
            subjects: subj ?? { name: '', coefficient: 0, subject_type: '' },
            classes: cls ?? { name: '', description: null },
            studentCount: count || 0,
            averageMark: avgMark,
            attendanceRate: attendanceRate,
            recentActivity: '2 hours ago',
            nextClass: 'Tomorrow, 10:00 AM',
            marksSubmitted: Math.floor((count || 0) * 0.8),
            totalStudents: count || 0
          };
        } catch (err) {
          console.error('Error fetching assignment stats:', err);
          const subj = Array.isArray(assignment.subjects) ? assignment.subjects[0] : assignment.subjects;
          const cls = Array.isArray(assignment.classes) ? assignment.classes[0] : assignment.classes;
          
          return {
            ...assignment,
            status: (assignment as any).status ?? 'active',
            subjects: subj ?? { name: '', coefficient: 0, subject_type: '' },
            classes: cls ?? { name: '', description: null },
            studentCount: 0,
            averageMark: 0,
            attendanceRate: 0
          };
        }
      }));

      setAssignments(assignmentsWithStats as ClassAssignment[]);
    } catch (err: any) {
      console.error('Error fetching teacher assignments:', err);
      setError('Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };

  const relName = (rel: any): string => {
    const v = Array.isArray(rel) ? rel[0] : rel;
    return v?.name || '';
  };

  // Filter and sort assignments
  const filteredAndSortedAssignments = assignments
    .filter(assignment => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        relName(assignment.subjects).toLowerCase().includes(q) ||
        relName(assignment.classes).toLowerCase().includes(q);
      
      const matchesFilter = 
        filterType === 'all' || 
        assignment.subjects?.subject_type === filterType;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return relName(a.subjects).localeCompare(relName(b.subjects));
        case 'students':
          return b.studentCount - a.studentCount;
        case 'attendance':
          return (b.attendanceRate || 0) - (a.attendanceRate || 0);
        default:
          return 0;
      }
    });

  // Calculate overall statistics
  const totalStudents = assignments.reduce((sum, a) => sum + a.studentCount, 0);
  const avgAttendance = assignments.length > 0 
    ? assignments.reduce((sum, a) => sum + (a.attendanceRate || 0), 0) / assignments.length 
    : 0;
  const avgMark = assignments.length > 0 
    ? assignments.reduce((sum, a) => sum + (a.averageMark || 0), 0) / assignments.length 
    : 0;

  // Chart data
  const performanceData = assignments.map(a => ({
    name: a.subjects?.name?.substring(0, 10) || 'Unknown',
    attendance: a.attendanceRate || 0,
    marks: a.averageMark || 0
  }));

  const subjectDistribution = assignments.reduce((acc, a) => {
    const type = a.subjects?.subject_type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(subjectDistribution).map(([name, value]) => ({
    name,
    value
  }));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }

  if (error) {
    return <Alert variant="error" title="Error" message={error} />;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600 mt-1">
            Manage your teaching assignments and track student performance
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="primary" className="text-sm px-4 py-2">
            {assignments.length} Active {assignments.length === 1 ? 'Class' : 'Classes'}
          </Badge>
          <Button 
            variant="outline" 
            onClick={() => navigate('/teacher/marks')} 
            leftIcon={<CheckCircle className="h-4 w-4" />}
          >
            Enter Marks
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-blue-50/30 border-l-4 border-l-blue-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Students</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">
                  {totalStudents}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <Users className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Across all classes</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300 ml-2">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-green-50/30 border-l-4 border-l-green-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Attendance</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 group-hover:text-green-600 transition-colors">
                  {avgAttendance.toFixed(1)}%
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Overall rate</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-green-50 rounded-xl group-hover:bg-green-600 group-hover:scale-110 transition-all duration-300 ml-2">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-purple-50/30 border-l-4 border-l-purple-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Marks</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 group-hover:text-purple-600 transition-colors">
                  {avgMark.toFixed(1)}%
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <Award className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">Class average</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-purple-50 rounded-xl group-hover:bg-purple-600 group-hover:scale-110 transition-all duration-300 ml-2">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-amber-50/30 border-l-4 border-l-amber-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Classes</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 group-hover:text-amber-600 transition-colors">
                  {assignments.length}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  <BookOpen className="h-3 w-3 text-amber-600" />
                  <span className="text-xs text-amber-600 font-medium">This semester</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-amber-50 rounded-xl group-hover:bg-amber-600 group-hover:scale-110 transition-all duration-300 ml-2">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Class Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`${value.toFixed(1)}%`, '']}
                    />
                    <Legend />
                    <Bar dataKey="attendance" fill="#10B981" name="Attendance %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="marks" fill="#3B82F6" name="Avg Marks %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Subject Distribution */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Subject Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <BookOpen className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm">No subject data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Bar */}
      {assignments.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by subject or class..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="core">Core Subjects</option>
              <option value="elective">Elective Subjects</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="students">Sort by Students</option>
              <option value="attendance">Sort by Attendance</option>
            </select>
          </div>
        </div>
      )}

      {/* Classes Grid */}
      {filteredAndSortedAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedAssignments.map((assignment, index) => (
            <Card 
              key={assignment.id} 
              className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-blue-500 cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant={assignment.subjects?.subject_type === 'core' ? 'default' : 'secondary'}
                        className="px-3 py-1"
                      >
                        {assignment.subjects?.subject_type}
                      </Badge>
                      <div className="relative">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {assignment.subjects?.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {assignment.classes?.name}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600 font-medium">
                        {assignment.studentCount} students
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600 font-medium">
                        Coef: {assignment.subjects?.coefficient}
                      </span>
                    </div>
                  </div>

                  {/* Performance Indicators */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Class Average
                        </span>
                        <span className="font-semibold text-gray-700">
                          {assignment.averageMark?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${assignment.averageMark || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Attendance
                        </span>
                        <span className="font-semibold text-gray-700">
                          {assignment.attendanceRate?.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            (assignment.attendanceRate || 0) >= 80 
                              ? 'bg-gradient-to-r from-green-500 to-green-600' 
                              : (assignment.attendanceRate || 0) >= 60 
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600' 
                                : 'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                          style={{ width: `${assignment.attendanceRate || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {assignment.nextClass || 'Next class: Tomorrow'}
                    </span>
                    <span>{assignment.recentActivity}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="primary" 
                      className="flex-1" 
                      size="sm" 
                      onClick={() => navigate(`/teacher/class-details/${assignment.id}`)}
                      leftIcon={<Eye className="w-4 h-4" />}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/teacher/marks')}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {assignments.length === 0 ? 'No Classes Assigned' : 'No Classes Found'}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {assignments.length === 0 
                ? "You don't have any teaching assignments yet. Contact your school administrator." 
                : 'Try adjusting your search query or filters.'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}