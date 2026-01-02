import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { User, Phone, Mail, MapPin, Calendar, BookOpen, DollarSign, FileText, ArrowLeft, Edit, Heart, AlertTriangle, Droplet } from 'lucide-react';
interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  date_of_birth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  nationality: string;
  enrollment_date: string;
  previous_school: string;
  total_fee: number;
  total_paid: number;
  remaining: number;
  medical_conditions: string;
  allergies: string;
  special_needs: string;
  blood_type: string;
  profile_photo_path: string;
  class_id: string;
  classes: {
    name: string;
  };
}
interface Guardian {
  id: string;
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  occupation: string;
  id_number: string;
}
interface Enrollment {
  id: string;
  subjects: {
    name: string;
    coefficient: number;
  };
  total_marks: number;
  average_marks: number;
  grade: string;
  grade_point: number;
}
export function StudentDetailsPage() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (id) {
      fetchStudentData();
    }
  }, [id]);
  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError('');
      const [studentData, guardiansData, enrollmentsData, paymentsData, reportsData] = await Promise.all([supabase.from('students').select('*, classes(name)').eq('id', id).single(), supabase.from('guardians').select('*').eq('student_id', id), supabase.from('enrollments').select('*, subjects(name, coefficient)').eq('student_id', id), supabase.from('payments').select('*').eq('student_id', id).order('date', {
        ascending: false
      }).limit(10), supabase.from('report_cards').select('*').eq('student_id', id).order('generated_at', {
        ascending: false
      }).limit(5)]);
      if (studentData.error) throw studentData.error;
      if (guardiansData.error) throw guardiansData.error;
      if (enrollmentsData.error) throw enrollmentsData.error;
      if (paymentsData.error) throw paymentsData.error;
      if (reportsData.error) throw reportsData.error;
      setStudent(studentData.data);
      setGuardians(guardiansData.data || []);
      setEnrollments(enrollmentsData.data || []);
      setPayments(paymentsData.data || []);
      setReportCards(reportsData.data || []);
    } catch (err: any) {
      console.error('Error fetching student data:', err);
      setError(err.message || 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };
  const calculateAttendance = () => {
    // Calculate from marks table attendance data
    const totalPresent = enrollments.reduce((sum, e) => sum + (e.total_marks || 0), 0);
    const totalDays = enrollments.length * 20; // Rough estimate
    return totalDays > 0 ? (totalPresent / totalDays * 100).toFixed(1) : '0.0';
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  if (error || !student) {
    return <div className="p-6">
        <Alert variant="error" title="Error" message={error || 'Student not found'} onClose={() => navigate('/dashboard/students')} />
      </div>;
  }
  const primaryGuardian = guardians[0];
  const averageGrade = enrollments.length > 0 ? (enrollments.reduce((sum, e) => sum + (e.average_marks || 0), 0) / enrollments.length).toFixed(1) : '0.0';
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/students')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {student.profile_photo_path ? <img src={student.profile_photo_path} alt={student.full_name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" /> : <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {student.full_name.charAt(0)}
            </div>}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {student.full_name}
              <Badge variant="success">Active</Badge>
            </h1>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              <span className="font-semibold text-gray-800">
                {student.admission_number}
              </span>
              • {student.classes?.name || 'No Class'}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/dashboard/students/${id}/edit`)} leftIcon={<Edit className="w-4 h-4" />}>
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs tabs={[{
          id: 'overview',
          label: 'Overview',
          content: <div className="space-y-6 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Date of Birth
                            </label>
                            <div className="flex items-center gap-2 mt-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(student.date_of_birth).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Gender
                            </label>
                            <div className="flex items-center gap-2 mt-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {student.gender}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Nationality
                            </label>
                            <p className="text-sm font-medium text-gray-900 mt-2">
                              {student.nationality || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Enrollment Date
                            </label>
                            <p className="text-sm font-medium text-gray-900 mt-2">
                              {new Date(student.enrollment_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Address
                            </label>
                            <div className="flex items-start gap-2 mt-2">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                              <span className="text-sm font-medium text-gray-900">
                                {student.address || 'Not specified'}
                              </span>
                            </div>
                          </div>
                          {student.phone && <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Phone
                              </label>
                              <div className="flex items-center gap-2 mt-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {student.phone}
                                </span>
                              </div>
                            </div>}
                          {student.email && <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Email
                              </label>
                              <div className="flex items-center gap-2 mt-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {student.email}
                                </span>
                              </div>
                            </div>}
                        </div>
                      </CardContent>
                    </Card>

                    {(student.medical_conditions || student.allergies || student.special_needs || student.blood_type) && <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500" />
                            Medical Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {student.blood_type && <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                  <Droplet className="w-3 h-3" />
                                  Blood Type
                                </label>
                                <p className="text-sm font-medium text-gray-900 mt-2">
                                  {student.blood_type}
                                </p>
                              </div>}
                            {student.medical_conditions && <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  Medical Conditions
                                </label>
                                <p className="text-sm text-gray-900 mt-2 bg-red-50 p-3 rounded-lg border border-red-100">
                                  {student.medical_conditions}
                                </p>
                              </div>}
                            {student.allergies && <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Allergies
                                </label>
                                <p className="text-sm text-gray-900 mt-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                  {student.allergies}
                                </p>
                              </div>}
                            {student.special_needs && <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  Special Needs
                                </label>
                                <p className="text-sm text-gray-900 mt-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                  {student.special_needs}
                                </p>
                              </div>}
                          </div>
                        </CardContent>
                      </Card>}

                    {primaryGuardian && <Card>
                        <CardHeader>
                          <CardTitle>Guardian Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Name & Relationship
                              </label>
                              <p className="text-sm font-medium text-gray-900 mt-2">
                                {primaryGuardian.full_name}
                                <span className="text-gray-500 ml-2">
                                  ({primaryGuardian.relationship})
                                </span>
                              </p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Occupation
                              </label>
                              <p className="text-sm font-medium text-gray-900 mt-2">
                                {primaryGuardian.occupation || 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Phone
                              </label>
                              <div className="flex items-center gap-2 mt-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {primaryGuardian.phone}
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Email
                              </label>
                              <div className="flex items-center gap-2 mt-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {primaryGuardian.email}
                                </span>
                              </div>
                            </div>
                            {primaryGuardian.address && <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  Address
                                </label>
                                <div className="flex items-start gap-2 mt-2">
                                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {primaryGuardian.address}
                                  </span>
                                </div>
                              </div>}
                          </div>
                        </CardContent>
                      </Card>}
                  </div>
        }, {
          id: 'academic',
          label: 'Academic',
          content: <div className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          Enrolled Subjects ({enrollments.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {enrollments.length === 0 ? <p className="text-center text-gray-500 py-8">
                            No subject enrollments found
                          </p> : <div className="space-y-3">
                            {enrollments.map(enrollment => <div key={enrollment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                  <BookOpen className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      {enrollment.subjects?.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Coefficient:{' '}
                                      {enrollment.subjects?.coefficient}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {enrollment.grade && <Badge variant="default" className="mb-1">
                                      Grade: {enrollment.grade}
                                    </Badge>}
                                  {enrollment.average_marks > 0 && <p className="text-sm text-gray-600">
                                      Avg: {enrollment.average_marks.toFixed(1)}
                                      %
                                    </p>}
                                </div>
                              </div>)}
                          </div>}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Report Cards</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {reportCards.length === 0 ? <p className="text-center text-gray-500 py-8">
                            No report cards generated yet
                          </p> : <div className="space-y-3">
                            {reportCards.map(report => <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                  <p className="font-semibold text-gray-900 capitalize">
                                    {report.scope} Report
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Generated:{' '}
                                    {new Date(report.generated_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/report-cards`)}>
                                  View
                                </Button>
                              </div>)}
                          </div>}
                      </CardContent>
                    </Card>
                  </div>
        }, {
          id: 'financial',
          label: 'Financial',
          content: <div className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Fee Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">
                              Total Fee
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                              ${student.total_fee.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Paid</p>
                            <p className="text-2xl font-bold text-green-600">
                              ${student.total_paid.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">
                              Balance
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                              ${student.remaining.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Payments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {payments.length === 0 ? <p className="text-center text-gray-500 py-8">
                            No payments recorded yet
                          </p> : <div className="space-y-3">
                            {payments.map(payment => <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    ${payment.amount.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(payment.date).toLocaleDateString()}{' '}
                                    • {payment.method}
                                  </p>
                                </div>
                                {payment.receipt_path && <Button variant="ghost" size="sm">
                                    Receipt
                                  </Button>}
                              </div>)}
                          </div>}
                      </CardContent>
                    </Card>
                  </div>
        }]} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Subjects
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {enrollments.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Fee Balance
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    ${student.remaining.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Avg Grade
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {averageGrade}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {student.previous_school && <Card>
              <CardHeader>
                <CardTitle>Previous School</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  {student.previous_school}
                </p>
              </CardContent>
            </Card>}
        </div>
      </div>
    </div>;
}