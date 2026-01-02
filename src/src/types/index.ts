// Enums matching PostgreSQL schema exactly
export type UserRole = 'super_admin' | 'school_admin' | 'bursar' | 'teacher';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type GradingScale = 'out_of_20' | 'percentage' | 'gpa_4_0' | 'gpa_5_0' | 'custom';
export type SubjectType = 'core' | 'elective';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'mobile_money' | 'other';
export type ReportScope = 'sequence' | 'term' | 'year';

// Database Tables

export interface School {
  id: string;
  name: string;
  address?: string;
  logo_path?: string;
  currency_code: string;
  grading_scale: GradingScale;
  default_exam_out_of: number;
  gpa_mapping?: Record<string, {
    letter: string;
    points: number;
  }>;
  created_at: string;
  updated_at: string;
  approved: boolean;
}
export interface User {
  id: string;
  school_id?: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}
export interface AcademicYear {
  id: string;
  school_id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}
export interface Term {
  id: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}
export interface Sequence {
  id: string;
  term_id: string;
  name: string;
  due_date?: string;
  created_at: string;
}
export interface Class {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  created_at: string;
}
export interface FeeStructure {
  id: string;
  school_id: string;
  class_id: string;
  amount: number;
  currency_code: string;
  description?: string;
  created_at: string;
}
export interface Student {
  id: string;
  school_id: string;
  academic_year_id: string;
  class_id: string;
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  profile_photo_path?: string;
  address?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  enrollment_date: string;
  previous_school?: string;
  admission_number?: string;
  total_fee: number;
  total_paid: number;
  remaining: number;
  medical_conditions?: string;
  allergies?: string;
  special_needs?: string;
  blood_type?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
export interface Guardian {
  id: string;
  student_id: string;
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  address?: string;
  occupation?: string;
  id_number?: string;
  created_at: string;
}
export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  notes?: string;
  receipt_path?: string;
  created_at: string;
}
export interface Subject {
  id: string;
  school_id: string;
  name: string;
  coefficient: number;
  subject_type: SubjectType;
  created_at: string;
}
export interface SubjectClassMapping {
  id: string;
  subject_id: string;
  class_id: string;
}
export interface Enrollment {
  id: string;
  student_id: string;
  subject_id: string;
  created_at: string;
}
export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  created_at: string;
}
export interface Mark {
  id: string;
  enrollment_id: string;
  sequence_id: string;
  score: number;
  out_of: number;
  attendance_present: number;
  attendance_total: number;
  comments?: string;
  submitted_by: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
}
export interface ClassAverage {
  id: string;
  class_id: string;
  subject_id?: string;
  sequence_id?: string;
  term_id?: string;
  average_score: number;
  total_students: number;
  updated_at: string;
}
export interface ReportTemplate {
  id: string;
  school_id: string;
  config: Record<string, any>;
  created_at: string;
}
export interface ReportCard {
  id: string;
  student_id: string;
  scope: ReportScope;
  sequence_id?: string;
  term_id?: string;
  academic_year_id?: string;
  data: Record<string, any>;
  pdf_path?: string;
  generated_at: string;
}
export interface AuditLog {
  id: string;
  user_id?: string;
  school_id?: string;
  action_type: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Extended types for UI components (with relations)
export interface StudentWithRelations extends Student {
  class?: Class;
  guardians?: Guardian[];
  academic_year?: AcademicYear;
}
export interface EnrollmentWithRelations extends Enrollment {
  student?: Student;
  subject?: Subject;
}
export interface MarkWithRelations extends Mark {
  enrollment?: EnrollmentWithRelations;
  sequence?: Sequence;
  submitted_by_user?: User;
}
export interface TeacherAssignmentWithRelations extends TeacherAssignment {
  teacher?: User;
  subject?: Subject;
  class?: Class;
}