/**
 * Student Service
 * Handles all student-related operations
 */

import { supabase } from '../lib/supabaseClient';

export interface Student {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  class_id: string;
  admission_number: string;
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  total_paid: number;
  total_owed: number;
  created_at: string;
  updated_at: string;
}

export interface StudentFilter {
  searchQuery?: string;
  classId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  transferred: number;
  graduated: number;
  totalOwed: number;
  totalPaid: number;
}

class StudentService {
  /**
   * Get all students with filters
   */
  async getStudents(schoolId: string, filters: StudentFilter = {}): Promise<{
    students: Student[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      let query = supabase
        .from('students')
        .select('*', { count: 'exact' })
        .eq('school_id', schoolId);

      // Apply filters
      if (filters.searchQuery) {
        query = query.or(
          `first_name.ilike.%${filters.searchQuery}%,last_name.ilike.%${filters.searchQuery}%,admission_number.ilike.%${filters.searchQuery}%`
        );
      }

      if (filters.classId) {
        query = query.eq('class_id', filters.classId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 10;
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        students: data || [],
        total: count || 0,
        page,
        pageSize
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch students');
    }
  }

  /**
   * Get student by ID with full details
   */
  async getStudentById(studentId: string): Promise<Student> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Student not found');

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch student');
    }
  }

  /**
   * Create new student
   */
  async createStudent(schoolId: string, data: Partial<Student>): Promise<Student> {
    try {
      // Generate admission number
      const admissionNumber = await this.generateAdmissionNumber(schoolId);

      const { data: newStudent, error } = await supabase
        .from('students')
        .insert([
          {
            ...data,
            school_id: schoolId,
            admission_number: admissionNumber,
            status: 'active',
            total_paid: 0,
            total_owed: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      if (!newStudent) throw new Error('Failed to create student');

      // Create audit log
      await this.createAuditLog(schoolId, 'STUDENT_CREATED', 'student', newStudent.id, {
        name: `${data.first_name} ${data.last_name}`,
        admission_number: admissionNumber
      });

      return newStudent;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create student');
    }
  }

  /**
   * Update student
   */
  async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    try {
      const { data, error } = await supabase
        .from('students')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update student');

      // Create audit log
      await this.createAuditLog(data.school_id, 'STUDENT_UPDATED', 'student', studentId, updates);

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update student');
    }
  }

  /**
   * Delete student
   */
  async deleteStudent(studentId: string, schoolId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      // Create audit log
      await this.createAuditLog(schoolId, 'STUDENT_DELETED', 'student', studentId, {
        student_id: studentId
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete student');
    }
  }

  /**
   * Bulk import students from CSV
   */
  async bulkImportStudents(schoolId: string, students: Partial<Student>[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const student of students) {
        try {
          await this.createStudent(schoolId, student);
          results.successful++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(
            `${student.first_name} ${student.last_name}: ${error.message}`
          );
        }
      }

      // Create audit log for bulk import
      await this.createAuditLog(schoolId, 'BULK_IMPORT_STUDENTS', 'student', schoolId, {
        total: students.length,
        successful: results.successful,
        failed: results.failed
      });

      return results;
    } catch (error: any) {
      throw new Error(error.message || 'Bulk import failed');
    }
  }

  /**
   * Get student statistics
   */
  async getStudentStats(schoolId: string): Promise<StudentStats> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('status, total_paid, total_owed')
        .eq('school_id', schoolId);

      if (error) throw error;

      const stats: StudentStats = {
        total: data?.length || 0,
        active: data?.filter(s => s.status === 'active').length || 0,
        inactive: data?.filter(s => s.status === 'inactive').length || 0,
        transferred: data?.filter(s => s.status === 'transferred').length || 0,
        graduated: data?.filter(s => s.status === 'graduated').length || 0,
        totalOwed: data?.reduce((sum, s) => sum + (s.total_owed || 0), 0) || 0,
        totalPaid: data?.reduce((sum, s) => sum + (s.total_paid || 0), 0) || 0
      };

      return stats;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch statistics');
    }
  }

  /**
   * Get student by admission number
   */
  async getStudentByAdmissionNumber(schoolId: string, admissionNumber: string): Promise<Student | null> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .eq('admission_number', admissionNumber)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch student');
    }
  }

  /**
   * Generate unique admission number
   */
  private async generateAdmissionNumber(schoolId: string): Promise<string> {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const admissionNumber = `ADM${timestamp}${random}`;

    // Check uniqueness
    const existing = await this.getStudentByAdmissionNumber(schoolId, admissionNumber);
    if (existing) {
      return this.generateAdmissionNumber(schoolId); // Recursive retry
    }

    return admissionNumber;
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    schoolId: string,
    action: string,
    entityType: string,
    entityId: string,
    details: any
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert([
        {
          school_id: schoolId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Export students to CSV
   */
  async exportStudentsToCSV(schoolId: string, students: Student[]): Promise<string> {
    const headers = [
      'Admission Number',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Guardian Name',
      'Guardian Phone',
      'Class',
      'Status',
      'Total Paid',
      'Total Owed'
    ];

    const rows = students.map(s => [
      s.admission_number,
      s.first_name,
      s.last_name,
      s.email,
      s.phone,
      s.guardian_name,
      s.guardian_phone,
      s.class_id,
      s.status,
      s.total_paid,
      s.total_owed
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }
}

export const studentService = new StudentService();
