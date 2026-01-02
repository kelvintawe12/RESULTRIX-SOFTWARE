import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, User, Award, X } from 'lucide-react';
interface SubjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectData: {
    id: string;
    name: string;
    code: string;
    grade: string;
    teacher: string;
    teacherId?: string;
    studentCount: number;
    credits: number;
    department: string;
    description?: string;
  } | null;
}
export function SubjectDetailsModal({
  isOpen,
  onClose,
  subjectData
}: SubjectDetailsModalProps) {
  const navigate = useNavigate();
  if (!subjectData) return null;
  return <Dialog isOpen={isOpen} onClose={onClose} title={subjectData.name} size="lg">
      <div className="space-y-6">
        {/* Overview Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Subject Code</p>
            </div>
            <p className="text-xl font-bold text-blue-900">
              {subjectData.code}
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-medium text-purple-900">Credits</p>
            </div>
            <p className="text-xl font-bold text-purple-900">
              {subjectData.credits}
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">
                Enrolled Students
              </p>
            </div>
            <p className="text-xl font-bold text-green-900">
              {subjectData.studentCount}
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-900">Department</p>
            </div>
            <p className="text-sm font-semibold text-amber-900">
              {subjectData.department}
            </p>
          </div>
        </div>

        {/* Teacher Info */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-5 h-5 text-slate-600" />
                <p className="text-sm font-medium text-slate-900">
                  Subject Teacher
                </p>
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {subjectData.teacher}
              </p>
            </div>
            {subjectData.teacherId && <Button size="sm" variant="secondary" onClick={() => {
            navigate(`/dashboard/teachers/${subjectData.teacherId}`);
            onClose();
          }}>
                View Profile
              </Button>}
          </div>
        </div>

        {/* Description */}
        {subjectData.description && <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">
              Description
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {subjectData.description}
            </p>
          </div>}

        {/* Grade Level */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Grade Level:</span>
          <Badge variant="primary">{subjectData.grade}</Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button variant="primary" onClick={() => {
          navigate(`/dashboard/student-enrollment?subject=${subjectData.id}`);
          onClose();
        }} className="flex-1">
            View Enrolled Students
          </Button>
          <Button variant="secondary" onClick={() => {
          navigate(`/dashboard/teacher-assignments`);
          onClose();
        }} className="flex-1">
            Manage Assignments
          </Button>
        </div>
      </div>
    </Dialog>;
}