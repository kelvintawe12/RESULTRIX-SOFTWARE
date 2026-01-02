import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, User, Calendar, X } from 'lucide-react';
interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: string;
    name: string;
    grade: string;
    studentCount: number;
    capacity: number;
    classTeacher: string;
    subjects: string[];
    schedule?: string;
  } | null;
}
export function ClassDetailsModal({
  isOpen,
  onClose,
  classData
}: ClassDetailsModalProps) {
  const navigate = useNavigate();
  if (!classData) return null;
  return <Dialog isOpen={isOpen} onClose={onClose} title={classData.name} size="lg">
      <div className="space-y-6">
        {/* Overview Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Students</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {classData.studentCount}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Capacity: {classData.capacity}
            </p>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{
              width: `${Math.min(classData.studentCount / classData.capacity * 100, 100)}%`
            }} />
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-medium text-purple-900">Subjects</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {classData.subjects.length}
            </p>
            <p className="text-xs text-purple-700 mt-1">Active subjects</p>
          </div>
        </div>

        {/* Class Teacher */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-slate-600" />
            <p className="text-sm font-medium text-slate-900">Class Teacher</p>
          </div>
          <p className="text-lg font-semibold text-slate-900">
            {classData.classTeacher}
          </p>
        </div>

        {/* Subjects List */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">
            Subjects Taught
          </h4>
          <div className="flex flex-wrap gap-2">
            {classData.subjects.map((subject, index) => <Badge key={index} variant="secondary">
                {subject}
              </Badge>)}
          </div>
        </div>

        {/* Schedule */}
        {classData.schedule && <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-900">Schedule</p>
            </div>
            <p className="text-sm text-amber-800">{classData.schedule}</p>
          </div>}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button variant="primary" onClick={() => {
          navigate(`/dashboard/students?class=${classData.id}`);
          onClose();
        }} className="flex-1">
            View Students
          </Button>
          <Button variant="secondary" onClick={() => {
          navigate(`/dashboard/student-enrollment`);
          onClose();
        }} className="flex-1">
            Manage Enrollment
          </Button>
        </div>
      </div>
    </Dialog>;
}