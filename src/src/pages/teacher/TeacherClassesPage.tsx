import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { BookOpen, Users, Eye, Search, TrendingUp, Clock, Award } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useNavigate } from 'react-router-dom';
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
      // For each assignment, get student count and stats
      const assignmentsWithStats = await Promise.all((assignmentsData || []).map(async assignment => {
        // Get student count
        const {
          count
        } = await supabase.from('students').select('*', {
          count: 'exact',
          head: true
        }).eq('class_id', assignment.class_id);
        return {
          ...assignment,
          studentCount: count || 0
        };
      }));
      setAssignments(assignmentsWithStats);
    } catch (err: any) {
      console.error('Error fetching teacher assignments:', err);
      setError('Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };
  const filteredAssignments = assignments.filter(assignment => assignment.subjects?.name.toLowerCase().includes(searchQuery.toLowerCase()) || assignment.classes?.name.toLowerCase().includes(searchQuery.toLowerCase()));
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  if (error) {
    return <Alert variant="error" title="Error" message={error} />;
  }
  return <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Classes</h1>
          <p className="text-slate-500 mt-1">
            View your teaching assignments and student lists
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="text-sm">
            {assignments.length} Active{' '}
            {assignments.length === 1 ? 'Class' : 'Classes'}
          </Badge>
        </div>
      </div>

      {assignments.length > 0 && <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by subject or class..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>}

      {filteredAssignments.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map(assignment => <Card key={assignment.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={assignment.subjects?.subject_type === 'core' ? 'default' : 'secondary'}>
                        {assignment.subjects?.subject_type}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">
                      {assignment.subjects?.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {assignment.classes?.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {assignment.studentCount} students
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        Coef: {assignment.subjects?.coefficient}
                      </span>
                    </div>
                  </div>

                  {(assignment.averageMark !== undefined || assignment.attendanceRate !== undefined) && <div className="space-y-2">
                      {assignment.averageMark !== undefined && <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            Avg Mark
                          </span>
                          <span className="font-semibold text-slate-900">
                            {assignment.averageMark.toFixed(1)}%
                          </span>
                        </div>}
                      {assignment.attendanceRate !== undefined && <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Attendance
                          </span>
                          <span className="font-semibold text-slate-900">
                            {assignment.attendanceRate.toFixed(0)}%
                          </span>
                        </div>}
                    </div>}

                  <div className="flex gap-2">
                    <Button variant="primary" className="flex-1" size="sm" onClick={() => navigate(`/teacher/class-details/${assignment.id}`)} leftIcon={<Eye className="w-4 h-4" />}>
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div> : <Card className="p-12">
          <div className="text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {assignments.length === 0 ? 'No Classes Assigned' : 'No Classes Found'}
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {assignments.length === 0 ? "You don't have any teaching assignments yet. Contact your school administrator." : 'Try adjusting your search query.'}
            </p>
          </div>
        </Card>}
    </div>;
}