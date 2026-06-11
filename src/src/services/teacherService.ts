/**
 * Teacher Service
 * Handles all teacher-related operations
 */

import { supabase } from '../lib/supabaseClient';

export interface Teacher {
  id: string;
  user_id: string;
  school_id: string;
  full_name: string;
  email: string;
  phone: string;
  qualification: string;
  experience_years: number;
  employment_status: 'full_time' | 'part_time';
  salary?: number;
  bio?: string;
  subjects: string[];
  classes: string[];
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
  updated_at: string;
}

export interface TeacherFilter {
  searchQuery?: string;
  employmentStatus?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TeacherStats {
  total: number;
  fullTime: number;
  partTime: number;
  active: number;
  onLeave: number;
  averageExperience: number;
}

class TeacherService {
  /**
   * Get all teachers with filters
   */
  async getTeachers(schoolId: string, filters: TeacherFilter = {}): Promise<{
    teachers: Teacher[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      let query = supabase
        .from('teacher_profiles')
        .select(`
          *,
          users!inner(full_name, email, phone),
          teacher_subjects(subject_id),
          teacher_assignments(class_id)
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('users.role', 'teacher');

      // Apply filters
      if (filters.searchQuery) {
        query = query.or(
          `full_name.ilike.%${filters.searchQuery}%,email.ilike.%${filters.searchQuery}%`
        );
      }

      if (filters.employmentStatus) {
        query = query.eq('employment_status', filters.employmentStatus);
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

      // Format response
      const teachers: Teacher[] = (data || []).map((t: any) => ({
        id: t.user_id,
        user_id: t.user_id,
        school_id: t.school_id,
        full_name: t.users?.full_name,
        email: t.users?.email,
        phone: t.users?.phone,
        qualification: t.qualification,
        experience_years: t.experience_years,
        employment_status: t.employment_status,
        salary: t.salary,
        bio: t.bio,
        subjects: t.teacher_subjects?.map((ts: any) => ts.subject_id) || [],
        classes: t.teacher_assignments?.map((ta: any) => ta.class_id) || [],
        status: t.status || 'active',
        created_at: t.created_at,
        updated_at: t.updated_at
      }));

      return {
        teachers,
        total: count || 0,
        page,
        pageSize
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch teachers');
    }
  }

  /**
   * Create new teacher
   */
  async createTeacher(
    schoolId: string,
    userData: any,
    teacherData: Partial<Teacher>
  ): Promise<Teacher> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password || Math.random().toString(36).slice(-12),
        options: {
          data: {
            full_name: userData.full_name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user?.id) throw new Error('Failed to create user account');

      // Create user profile
      const { error: userError } = await supabase.from('users').insert([
        {
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          role: 'teacher',
          school_id: schoolId,
          is_active: true
        }
      ]);

      if (userError) throw userError;

      // Create teacher profile
      const { data: teacherProfile, error: teacherError } = await supabase
        .from('teacher_profiles')
        .insert([
          {
            user_id: authData.user.id,
            school_id: schoolId,
            qualification: teacherData.qualification,
            experience_years: teacherData.experience_years || 0,
            employment_status: teacherData.employment_status || 'full_time',
            salary: teacherData.salary,
            bio: teacherData.bio,
            status: 'active'
          }
        ])
        .select()
        .single();

      if (teacherError) throw teacherError;

      // Assign subjects if provided
      if (teacherData.subjects && teacherData.subjects.length > 0) {
        const teacherId = authData.user?.id;
        if (!teacherId) throw new Error('Missing teacher user id');

        const subjectAssignments = teacherData.subjects.map(subjectId => ({
          teacher_id: teacherId,
          subject_id: subjectId
        }));

        const { error: subjectError } = await supabase
          .from('teacher_subjects')
          .insert(subjectAssignments);

        if (subjectError) console.error('Failed to assign subjects:', subjectError);
      }

      // Create audit log
      await this.createAuditLog(schoolId, 'TEACHER_CREATED', 'teacher', authData.user.id, {
        name: userData.full_name,
        email: userData.email
      });

      return {
        id: authData.user.id,
        user_id: authData.user.id,
        school_id: schoolId,
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        qualification: teacherData.qualification || '',
        experience_years: teacherData.experience_years || 0,
        employment_status: teacherData.employment_status || 'full_time',
        salary: teacherData.salary,
        bio: teacherData.bio,
        subjects: teacherData.subjects || [],
        classes: [],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create teacher');
    }
  }

  /**
   * Update teacher
   */
  async updateTeacher(teacherId: string, schoolId: string, updates: Partial<Teacher>): Promise<Teacher> {
    try {
      // Update user profile if needed
      if (updates.full_name || updates.email || updates.phone) {
        await supabase
          .from('users')
          .update({
            full_name: updates.full_name,
            email: updates.email,
            phone: updates.phone
          })
          .eq('id', teacherId);
      }

      // Update teacher profile
      const { data, error } = await supabase
        .from('teacher_profiles')
        .update({
          qualification: updates.qualification,
          experience_years: updates.experience_years,
          employment_status: updates.employment_status,
          salary: updates.salary,
          bio: updates.bio
        })
        .eq('user_id', teacherId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update teacher');

      // Update subject assignments if provided
      if (updates.subjects) {
        // Delete existing assignments
        await supabase
          .from('teacher_subjects')
          .delete()
          .eq('teacher_id', teacherId);

        // Insert new assignments
        if (updates.subjects.length > 0) {
          const subjectAssignments = updates.subjects.map(subjectId => ({
            teacher_id: teacherId,
            subject_id: subjectId
          }));

          await supabase
            .from('teacher_subjects')
            .insert(subjectAssignments);
        }
      }

      // Create audit log
      await this.createAuditLog(schoolId, 'TEACHER_UPDATED', 'teacher', teacherId, updates);

      return {
        ...updates,
        id: teacherId,
        user_id: teacherId,
        school_id: schoolId
      } as Teacher;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update teacher');
    }
  }

  /**
   * Delete teacher
   */
  async deleteTeacher(teacherId: string, schoolId: string): Promise<void> {
    try {
      // Soft delete - update status
      await supabase
        .from('teacher_profiles')
        .update({ status: 'inactive' })
        .eq('user_id', teacherId);

      // Create audit log
      await this.createAuditLog(schoolId, 'TEACHER_DELETED', 'teacher', teacherId, {
        teacher_id: teacherId
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete teacher');
    }
  }

  /**
   * Assign teacher to class
   */
  async assignToClass(teacherId: string, classId: string, schoolId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('teacher_assignments')
        .insert([
          {
            teacher_id: teacherId,
            class_id: classId
          }
        ]);

      if (error && error.code !== '23505') throw error; // 23505 = unique constraint violation

      // Create audit log
      await this.createAuditLog(schoolId, 'TEACHER_ASSIGNED_CLASS', 'assignment', `${teacherId}-${classId}`, {
        teacher_id: teacherId,
        class_id: classId
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to assign teacher');
    }
  }

  /**
   * Remove teacher from class
   */
  async removeFromClass(teacherId: string, classId: string, schoolId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('teacher_assignments')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('class_id', classId);

      if (error) throw error;

      // Create audit log
      await this.createAuditLog(schoolId, 'TEACHER_REMOVED_CLASS', 'assignment', `${teacherId}-${classId}`, {
        teacher_id: teacherId,
        class_id: classId
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove teacher from class');
    }
  }

  /**
   * Get teacher statistics
   */
  async getTeacherStats(schoolId: string): Promise<TeacherStats> {
    try {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('employment_status, status, experience_years')
        .eq('school_id', schoolId);

      if (error) throw error;

      const stats: TeacherStats = {
        total: data?.length || 0,
        fullTime: data?.filter(t => t.employment_status === 'full_time').length || 0,
        partTime: data?.filter(t => t.employment_status === 'part_time').length || 0,
        active: data?.filter(t => t.status === 'active').length || 0,
        onLeave: data?.filter(t => t.status === 'on_leave').length || 0,
        averageExperience: data?.length ? Math.round(
          data.reduce((sum, t) => sum + (t.experience_years || 0), 0) / data.length
        ) : 0
      };

      return stats;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch statistics');
    }
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
}

export const teacherService = new TeacherService();
