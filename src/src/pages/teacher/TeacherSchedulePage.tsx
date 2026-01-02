import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Calendar, Clock, BookOpen, MapPin } from 'lucide-react';
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00'];
export function TeacherSchedulePage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  useEffect(() => {
    if (user?.id) {
      fetchSchedule();
    }
  }, [user?.id]);
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch teacher assignments
      const {
        data: assignmentsData,
        error: assignmentsError
      } = await supabase.from('teacher_assignments').select(`
          id,
          subjects (name, subject_type),
          classes (name)
        `).eq('teacher_id', user?.id);
      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);
      // Fetch timetable/schedule (if exists in your schema)
      // For now, we'll create a mock schedule based on assignments
      // In a real implementation, you'd fetch from a timetable table
      const mockSchedule = generateMockSchedule(assignmentsData || []);
      setSchedule(mockSchedule);
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
      setError(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };
  const generateMockSchedule = (assignments: any[]) => {
    // Generate a mock weekly schedule
    const schedule: any[] = [];
    assignments.forEach((assignment, index) => {
      const dayIndex = index % 5;
      const timeSlotIndex = Math.floor(index / 5) % TIME_SLOTS.length;
      schedule.push({
        id: assignment.id,
        day: DAYS_OF_WEEK[dayIndex],
        timeSlot: TIME_SLOTS[timeSlotIndex],
        subject: assignment.subjects?.name,
        class: assignment.classes?.name,
        subjectType: assignment.subjects?.subject_type,
        room: `Room ${101 + index}`
      });
    });
    return schedule;
  };
  const getScheduleForDay = (day: string) => {
    return schedule.filter(s => s.day === day).sort((a, b) => {
      const aTime = parseInt(a.timeSlot.split(':')[0]);
      const bTime = parseInt(b.timeSlot.split(':')[0]);
      return aTime - bTime;
    });
  };
  const getCurrentDaySchedule = () => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? -1 : today - 1; // Convert Sunday (0) to -1, Monday (1) to 0, etc.
    if (dayIndex < 0 || dayIndex >= DAYS_OF_WEEK.length) return [];
    return getScheduleForDay(DAYS_OF_WEEK[dayIndex]);
  };
  const todaySchedule = getCurrentDaySchedule();
  const currentHour = new Date().getHours();
  const currentClass = todaySchedule.find(s => {
    const [startHour] = s.timeSlot.split(' - ')[0].split(':').map(Number);
    const [endHour] = s.timeSlot.split(' - ')[1].split(':').map(Number);
    return currentHour >= startHour && currentHour < endHour;
  });
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Schedule</h1>
        <p className="text-slate-500 mt-1">
          View your weekly teaching timetable
        </p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}

      {/* Current Class */}
      {currentClass && <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Current Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {currentClass.subject}
                </h3>
                <p className="text-slate-600 mt-1">{currentClass.class}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentClass.timeSlot}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {currentClass.room}
                  </span>
                </div>
              </div>
              <Badge variant="success" className="self-start sm:self-center">
                In Progress
              </Badge>
            </div>
          </CardContent>
        </Card>}

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Today's Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySchedule.length > 0 ? <div className="space-y-3">
              {todaySchedule.map((item, index) => <div key={index} className={`p-4 rounded-lg border-l-4 ${item === currentClass ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-slate-300'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-slate-600" />
                        <span className="font-semibold text-slate-900">
                          {item.subject}
                        </span>
                        <Badge variant={item.subjectType === 'core' ? 'default' : 'secondary'} className="text-xs">
                          {item.subjectType}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {item.class}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.timeSlot}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.room}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>)}
            </div> : <p className="text-center py-8 text-slate-500">
              No classes scheduled for today
            </p>}
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 gap-2 mb-2">
                <div className="font-semibold text-sm text-slate-600 p-2">
                  Time
                </div>
                {DAYS_OF_WEEK.map(day => <div key={day} className="font-semibold text-sm text-slate-600 p-2 text-center">
                    {day}
                  </div>)}
              </div>
              {TIME_SLOTS.map(timeSlot => <div key={timeSlot} className="grid grid-cols-6 gap-2 mb-2">
                  <div className="text-xs text-slate-500 p-2 flex items-center">
                    {timeSlot}
                  </div>
                  {DAYS_OF_WEEK.map(day => {
                const classItem = schedule.find(s => s.day === day && s.timeSlot === timeSlot);
                return <div key={`${day}-${timeSlot}`} className={`p-2 rounded text-xs ${classItem ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-200'}`}>
                        {classItem ? <div>
                            <div className="font-semibold text-slate-900 truncate">
                              {classItem.subject}
                            </div>
                            <div className="text-slate-600 truncate">
                              {classItem.class}
                            </div>
                            <div className="text-slate-500 truncate">
                              {classItem.room}
                            </div>
                          </div> : <div className="text-slate-400 text-center">-</div>}
                      </div>;
              })}
                </div>)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Classes This Week</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {schedule.length}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-slate-600">Classes Today</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {todaySchedule.length}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-slate-600">Different Subjects</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {assignments.length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}