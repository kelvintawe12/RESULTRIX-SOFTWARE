import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { useAuth } from '../../hooks/useAuth';
import { BookOpen, Plus, Edit, Trash2, Eye, Search, Filter, GraduationCap, Users, FileText, Lightbulb, Info, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
interface Subject {
  id: string;
  name: string;
  subject_code?: string;
  subject_type: 'core' | 'elective';
  coefficient: number;
  description?: string;
  class_id?: string;
  class_name?: string;
  created_at: string;
}
export function SubjectsManagementPage() {
  const {
    user
  } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectStats, setSubjectStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject_code: '',
    class_id: '',
    subject_type: 'core' as 'core' | 'elective',
    coefficient: 1,
    description: ''
  });
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  useEffect(() => {
    if (user?.school_id) {
      fetchData();
    }
  }, [user]);
  useEffect(() => {
    applyFilters();
  }, [subjects, searchQuery, filterClass, filterType]);
  useEffect(() => {
    if (formData.name && formData.class_id) {
      generateSubjectCode();
      generateNameSuggestions();
      generateDescription();
    }
  }, [formData.name, formData.class_id, formData.subject_type]);
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [classesData, schoolData] = await Promise.all([supabase.from('classes').select('id, name').eq('school_id', user?.school_id).order('name'), supabase.from('schools').select('name').eq('id', user?.school_id).single()]);
      if (classesData.error) throw classesData.error;
      setClasses(classesData.data || []);
      setSchool(schoolData.data);
      const {
        data: subjectsData,
        error: subjectsError
      } = await supabase.from('subjects').select(`
          *,
          subject_class_mappings(
            class_id,
            classes(name)
          )
        `).eq('school_id', user?.school_id).order('name');
      if (subjectsError) throw subjectsError;
      const flattenedSubjects = (subjectsData || []).flatMap(subject => {
        const mappings = subject.subject_class_mappings || [];
        if (mappings.length === 0) {
          return [{
            ...subject,
            class_id: null,
            class_name: null
          }];
        }
        return mappings.map((mapping: any) => ({
          ...subject,
          class_id: mapping.class_id,
          class_name: mapping.classes?.name
        }));
      });
      setSubjects(flattenedSubjects);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  const generateSubjectCode = async () => {
    if (!formData.name || !formData.class_id) return;
    const className = classes.find(c => c.id === formData.class_id)?.name || '';
    const schoolAbbr = school?.name?.substring(0, 3).toUpperCase().replace(/\s/g, '') || 'SCH';
    const classAbbr = className.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const subjectAbbr = formData.name.substring(0, 4).toUpperCase().replace(/\s/g, '');
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    let code = `${schoolAbbr}${classAbbr}${subjectAbbr}${timestamp}${random}`;
    if (code.length < 10) {
      code = code.padEnd(10, '0');
    }
    const {
      data: existing
    } = await supabase.from('subjects').select('id').eq('subject_code', code).eq('school_id', user?.school_id).maybeSingle();
    if (existing) {
      const newRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      code = `${schoolAbbr}${classAbbr}${subjectAbbr}${timestamp}${newRandom}`;
    }
    setFormData(prev => ({
      ...prev,
      subject_code: code
    }));
  };
  const generateNameSuggestions = () => {
    const className = classes.find(c => c.id === formData.class_id)?.name || '';
    const baseName = formData.name.trim();
    if (!baseName || !className) {
      setNameSuggestions([]);
      return;
    }
    const suggestions = [`${baseName} - ${className}`, `${className} ${baseName}`, `${baseName} (${className})`, `${baseName} [${className}]`];
    setNameSuggestions(suggestions);
  };
  const generateDescription = () => {
    const className = classes.find(c => c.id === formData.class_id)?.name || '';
    const subjectName = formData.name.trim();
    const type = formData.subject_type === 'core' ? 'Core' : 'Elective';
    if (!subjectName || !className) return;
    const coreDescription = `This ${type.toLowerCase()} subject is designed for ${className} students to develop essential skills and knowledge in ${subjectName}.

Course Overview:
Students will explore fundamental concepts, develop critical thinking abilities, and apply learned principles through practical exercises and assessments.

Key Learning Areas:
• Foundational concepts and theories
• Practical application and problem-solving
• Critical analysis and evaluation
• Communication and presentation skills

Assessment Methods:
• Regular tests and examinations (60%)
• Projects and assignments (25%)
• Class participation and homework (15%)

Prerequisites:
Basic understanding of related concepts from previous grade levels.

Learning Outcomes:
Upon completion, students will demonstrate proficiency in core ${subjectName} concepts and be prepared for advanced study in subsequent grade levels.`;
    const electiveDescription = `This elective subject offers ${className} students an opportunity to explore specialized areas of interest in ${subjectName}.

Course Description:
An engaging elective course that allows students to deepen their knowledge and develop specialized skills in ${subjectName} through hands-on learning and creative projects.

What Students Will Learn:
• Advanced concepts and specialized techniques
• Real-world applications and case studies
• Independent research and project development
• Collaborative learning and peer interaction

Assessment Structure:
• Major projects and presentations (40%)
• Tests and quizzes (30%)
• Portfolio and assignments (20%)
• Class participation (10%)

Who Should Enroll:
Students with a strong interest in ${subjectName} and motivation to explore the subject in greater depth.

Career Connections:
This course provides foundational knowledge relevant to careers in related fields and prepares students for further specialization.`;
    setFormData(prev => ({
      ...prev,
      description: type === 'Core' ? coreDescription : electiveDescription
    }));
  };
  const applyFilters = () => {
    let filtered = [...subjects];
    if (filterClass) {
      filtered = filtered.filter(s => s.class_id === filterClass);
    }
    if (filterType) {
      filtered = filtered.filter(s => s.subject_type === filterType);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(query) || s.subject_code?.toLowerCase().includes(query) || s.description?.toLowerCase().includes(query));
    }
    setFilteredSubjects(filtered);
  };
  const handleCreate = async () => {
    try {
      setLoading(true);
      setError('');
      if (!formData.name || !formData.class_id) {
        setError('Please fill in all required fields (Name and Class)');
        setLoading(false);
        return;
      }
      if (formData.coefficient < 1 || formData.coefficient > 5) {
        setError('Coefficient must be between 1 and 5');
        setLoading(false);
        return;
      }
      if (formData.subject_code) {
        const {
          data: existing
        } = await supabase.from('subjects').select('id').eq('subject_code', formData.subject_code).eq('school_id', user?.school_id).maybeSingle();
        if (existing) {
          setError('A subject with this code already exists. Regenerating...');
          await generateSubjectCode();
          setLoading(false);
          return;
        }
      }
      const insertData: any = {
        school_id: user?.school_id,
        name: formData.name,
        subject_type: formData.subject_type,
        coefficient: formData.coefficient
      };
      if (formData.subject_code) {
        insertData.subject_code = formData.subject_code;
      }
      if (formData.description) {
        insertData.description = formData.description;
      }
      const {
        data: newSubject,
        error: insertError
      } = await supabase.from('subjects').insert(insertData).select().single();
      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to create subject: ${insertError.message}`);
      }
      const {
        error: mappingError
      } = await supabase.from('subject_class_mappings').insert({
        subject_id: newSubject.id,
        class_id: formData.class_id
      });
      if (mappingError) {
        console.error('Mapping error:', mappingError);
        await supabase.from('subjects').delete().eq('id', newSubject.id);
        throw new Error(`Failed to create class mapping: ${mappingError.message}`);
      }
      setSuccess('Subject created successfully!');
      setCreateModalOpen(false);
      setFormData({
        name: '',
        subject_code: '',
        class_id: '',
        subject_type: 'core',
        coefficient: 1,
        description: ''
      });
      setNameSuggestions([]);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Create error:', err);
      setError(err.message || 'Failed to create subject. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = async () => {
    if (!selectedSubject) return;
    try {
      setLoading(true);
      setError('');
      if (formData.coefficient < 1 || formData.coefficient > 5) {
        setError('Coefficient must be between 1 and 5');
        setLoading(false);
        return;
      }
      const updateData: any = {
        name: formData.name,
        subject_type: formData.subject_type,
        coefficient: formData.coefficient
      };
      if (formData.subject_code) {
        updateData.subject_code = formData.subject_code;
      }
      if (formData.description) {
        updateData.description = formData.description;
      }
      const {
        error: updateError
      } = await supabase.from('subjects').update(updateData).eq('id', selectedSubject.id);
      if (updateError) throw updateError;
      if (formData.class_id !== selectedSubject.class_id) {
        await supabase.from('subject_class_mappings').delete().eq('subject_id', selectedSubject.id).eq('class_id', selectedSubject.class_id);
        await supabase.from('subject_class_mappings').insert({
          subject_id: selectedSubject.id,
          class_id: formData.class_id
        });
      }
      setSuccess('Subject updated successfully');
      setEditModalOpen(false);
      setSelectedSubject(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update subject');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string, classId: string) => {
    if (!confirm('Are you sure you want to delete this subject? This will affect related records.')) return;
    try {
      setLoading(true);
      await supabase.from('subject_class_mappings').delete().eq('subject_id', id).eq('class_id', classId);
      const {
        data: otherMappings
      } = await supabase.from('subject_class_mappings').select('id').eq('subject_id', id);
      if (!otherMappings || otherMappings.length === 0) {
        const {
          error: deleteError
        } = await supabase.from('subjects').delete().eq('id', id);
        if (deleteError) throw deleteError;
      }
      setSuccess('Subject deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete subject');
    } finally {
      setLoading(false);
    }
  };
  const handleView = async (subject: Subject) => {
    try {
      setSelectedSubject(subject);
      setViewModalOpen(true);
      const [teachersData, studentsData, marksData] = await Promise.all([supabase.from('teacher_assignments').select('teacher_id, users!inner(full_name)').eq('subject_id', subject.id).eq('class_id', subject.class_id), supabase.from('enrollments').select('student_id, students!inner(full_name)').eq('subject_id', subject.id), supabase.from('marks').select('id, enrollments!inner(subject_id)').eq('enrollments.subject_id', subject.id)]);
      setSubjectStats({
        totalTeachers: teachersData.data?.length || 0,
        teachers: teachersData.data || [],
        totalStudents: studentsData.data?.length || 0,
        students: studentsData.data || [],
        totalMarksRecords: marksData.data?.length || 0
      });
    } catch (err) {
      console.error('Error fetching subject details:', err);
    }
  };
  const openEditModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      subject_code: subject.subject_code || '',
      class_id: subject.class_id || '',
      subject_type: subject.subject_type,
      coefficient: subject.coefficient,
      description: subject.description || ''
    });
    setEditModalOpen(true);
  };
  const groupedSubjects = filteredSubjects.reduce((acc, subject) => {
    const className = subject.class_name || 'Unknown Class';
    if (!acc[className]) {
      acc[className] = {
        core: [],
        elective: []
      };
    }
    acc[className][subject.subject_type].push(subject);
    return acc;
  }, {} as Record<string, {
    core: Subject[];
    elective: Subject[];
  }>);
  if (loading && subjects.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-7 w-7" />
            Subjects Management
          </h1>
          <p className="text-gray-500">
            Manage all subjects with unique codes and detailed descriptions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} leftIcon={<Filter className="h-4 w-4" />}>
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button onClick={() => setCreateModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Add Subject
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError('')} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess('')} />}

      {showFilters && <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by name, code, or description..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>

              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="core">Core Subjects</SelectItem>
                  <SelectItem value="elective">Elective Subjects</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subjects.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Core Subjects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subjects.filter(s => s.subject_type === 'core').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Elective Subjects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subjects.filter(s => s.subject_type === 'elective').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Classes Covered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(groupedSubjects).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.keys(groupedSubjects).length === 0 ? <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No subjects found</p>
              <p className="text-gray-400 text-sm mt-2">
                {subjects.length === 0 ? 'Create your first subject to get started' : 'Try adjusting your filters'}
              </p>
            </div>
          </CardContent>
        </Card> : Object.entries(groupedSubjects).map(([className, classSubjects]) => <Card key={className}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  {className}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    {classSubjects.core.length} Core
                  </Badge>
                  <Badge variant="secondary">
                    {classSubjects.elective.length} Elective
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classSubjects.core.length > 0 && <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Core Subjects
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classSubjects.core.map(subject => <div key={`${subject.id}-${subject.class_id}`} className="p-4 border-2 border-green-200 rounded-lg hover:shadow-md transition-shadow bg-green-50/30">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900">
                              {subject.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {subject.subject_code && <Badge variant="outline" className="font-mono text-xs">
                                  {subject.subject_code}
                                </Badge>}
                              <Badge variant="secondary" className="text-xs">
                                Coef: {subject.coefficient}
                              </Badge>
                            </div>
                            {subject.description && <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                                {subject.description}
                              </p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleView(subject)} leftIcon={<Eye className="h-4 w-4" />}>
                            View
                          </Button>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEditModal(subject)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(subject.id, subject.class_id!)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>)}
                  </div>
                </div>}

              {classSubjects.elective.length > 0 && <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-purple-600" />
                    Elective Subjects
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classSubjects.elective.map(subject => <div key={`${subject.id}-${subject.class_id}`} className="p-4 border-2 border-purple-200 rounded-lg hover:shadow-md transition-shadow bg-purple-50/30">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900">
                              {subject.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {subject.subject_code && <Badge variant="outline" className="font-mono text-xs">
                                  {subject.subject_code}
                                </Badge>}
                              <Badge variant="secondary" className="text-xs">
                                Coef: {subject.coefficient}
                              </Badge>
                            </div>
                            {subject.description && <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                                {subject.description}
                              </p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleView(subject)} leftIcon={<Eye className="h-4 w-4" />}>
                            View
                          </Button>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEditModal(subject)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(subject.id, subject.class_id!)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>)}
                  </div>
                </div>}
            </CardContent>
          </Card>)}

      {/* Create/Edit Modal - keeping existing */}
      {(createModalOpen || editModalOpen) && <Dialog isOpen={createModalOpen || editModalOpen} onClose={() => {
      setCreateModalOpen(false);
      setEditModalOpen(false);
      setFormData({
        name: '',
        subject_code: '',
        class_id: '',
        subject_type: 'core',
        coefficient: 1,
        description: ''
      });
      setSelectedSubject(null);
      setNameSuggestions([]);
    }} title={editModalOpen ? 'Edit Subject' : 'Create New Subject'} size="lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Class <span className="text-red-500">*</span>
              </label>
              <Select value={formData.class_id} onValueChange={value => setFormData({
            ...formData,
            class_id: value
          })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class first" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                {nameSuggestions.length > 0 && <button type="button" onClick={() => setShowSuggestions(!showSuggestions)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    {showSuggestions ? 'Hide' : 'Show'} Suggestions
                  </button>}
              </div>
              <Input value={formData.name} onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} placeholder="e.g., Mathematics, English Literature" />

              {showSuggestions && nameSuggestions.length > 0 && <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-900 mb-2">
                        Recommended naming formats to avoid confusion:
                      </p>
                      <div className="space-y-1">
                        {nameSuggestions.map((suggestion, idx) => <button key={idx} type="button" onClick={() => setFormData({
                    ...formData,
                    name: suggestion
                  })} className="block w-full text-left px-2 py-1 text-sm text-blue-700 hover:bg-blue-100 rounded">
                            {suggestion}
                          </button>)}
                      </div>
                    </div>
                  </div>
                </div>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Subject Code (Optional - 10+ digits)
                </label>
                <button type="button" onClick={generateSubjectCode} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Generate
                </button>
              </div>
              <Input value={formData.subject_code} onChange={e => setFormData({
            ...formData,
            subject_code: e.target.value.toUpperCase()
          })} placeholder="Auto-generated unique code (optional)" className="font-mono" />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Optional unique code. Leave empty if not needed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject Type <span className="text-red-500">*</span>
              </label>
              <Select value={formData.subject_type} onValueChange={(value: string) => setFormData({
            ...formData,
            subject_type: value as 'core' | 'elective'
          })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">
                    Core (Required for all students)
                  </SelectItem>
                  <SelectItem value="elective">
                    Elective (Optional/Specialization)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Coefficient (Weight: 1-5){' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <Input type="number" min="1" max="5" step="1" value={formData.coefficient} onChange={e => {
              const val = parseInt(e.target.value) || 1;
              setFormData({
                ...formData,
                coefficient: Math.min(5, Math.max(1, val))
              });
            }} className="w-24" />
                <span className="text-sm text-gray-600">
                  Enter a value between 1 and 5
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used for weighted grade calculations. Higher values give more
                weight to this subject.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (Optional)
              </label>
              <textarea value={formData.description} onChange={e => setFormData({
            ...formData,
            description: e.target.value
          })} rows={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-sans" placeholder="A detailed description will be auto-generated when you select a class and subject type..." />
              <p className="text-xs text-gray-500 mt-1">
                A professional description is auto-generated. You can edit it as
                needed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
            setCreateModalOpen(false);
            setEditModalOpen(false);
            setFormData({
              name: '',
              subject_code: '',
              class_id: '',
              subject_type: 'core',
              coefficient: 1,
              description: ''
            });
            setNameSuggestions([]);
          }}>
                Cancel
              </Button>
              <Button onClick={editModalOpen ? handleEdit : handleCreate} disabled={loading}>
                {loading ? 'Saving...' : editModalOpen ? 'Update' : 'Create'}{' '}
                Subject
              </Button>
            </div>
          </div>
        </Dialog>}

      {/* Enhanced Professional View Modal */}
      {viewModalOpen && selectedSubject && <Dialog isOpen={viewModalOpen} onClose={() => {
      setViewModalOpen(false);
      setSelectedSubject(null);
      setSubjectStats(null);
    }} title="" size="lg">
          <div className="space-y-6">
            {/* Header Section with Gradient */}
            <div className="border-b pb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedSubject.name}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedSubject.subject_code && <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                        {selectedSubject.subject_code}
                      </Badge>}
                    <Badge variant={selectedSubject.subject_type === 'core' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                      {selectedSubject.subject_type === 'core' ? 'Core Subject' : 'Elective Subject'}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      Coefficient: {selectedSubject.coefficient}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-900 uppercase tracking-wide">
                      Class
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedSubject.class_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-indigo-900 uppercase tracking-wide">
                      Weight
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      ×{selectedSubject.coefficient}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Section with Gradient Cards */}
            {subjectStats && <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  Enrollment Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative overflow-hidden p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg text-white">
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="h-5 w-5" />
                        <p className="text-sm font-medium opacity-90">
                          Teachers
                        </p>
                      </div>
                      <p className="text-3xl font-bold">
                        {subjectStats.totalTeachers}
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        Assigned instructors
                      </p>
                    </div>
                    <div className="absolute -right-6 -bottom-6 opacity-10">
                      <GraduationCap className="h-24 w-24" />
                    </div>
                  </div>

                  <div className="relative overflow-hidden p-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg text-white">
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5" />
                        <p className="text-sm font-medium opacity-90">
                          Students
                        </p>
                      </div>
                      <p className="text-3xl font-bold">
                        {subjectStats.totalStudents}
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        Enrolled learners
                      </p>
                    </div>
                    <div className="absolute -right-6 -bottom-6 opacity-10">
                      <Users className="h-24 w-24" />
                    </div>
                  </div>

                  <div className="relative overflow-hidden p-5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg text-white">
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5" />
                        <p className="text-sm font-medium opacity-90">
                          Records
                        </p>
                      </div>
                      <p className="text-3xl font-bold">
                        {subjectStats.totalMarksRecords}
                      </p>
                      <p className="text-xs opacity-75 mt-1">Marks entries</p>
                    </div>
                    <div className="absolute -right-6 -bottom-6 opacity-10">
                      <FileText className="h-24 w-24" />
                    </div>
                  </div>
                </div>
              </div>}

            {/* Description Section */}
            {selectedSubject.description && <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Course Description
                </h3>
                <div className="p-5 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedSubject.description}
                  </p>
                </div>
              </div>}

            {/* Teachers & Students Lists */}
            {subjectStats && (subjectStats.teachers.length > 0 || subjectStats.students.length > 0) && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subjectStats.teachers.length > 0 && <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                        Assigned Teachers ({subjectStats.totalTeachers})
                      </h4>
                      <div className="max-h-64 overflow-y-auto border rounded-lg bg-white shadow-sm">
                        <div className="divide-y">
                          {subjectStats.teachers.map((teacher: any) => <div key={teacher.teacher_id} className="p-3 hover:bg-blue-50 transition-colors flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                                {teacher.users?.full_name?.charAt(0) || 'T'}
                              </div>
                              <span className="font-medium text-gray-900">
                                {teacher.users?.full_name || 'Unknown Teacher'}
                              </span>
                            </div>)}
                        </div>
                      </div>
                    </div>}

                  {subjectStats.students.length > 0 && <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600" />
                        Enrolled Students ({subjectStats.totalStudents})
                      </h4>
                      <div className="max-h-64 overflow-y-auto border rounded-lg bg-white shadow-sm">
                        <div className="divide-y">
                          {subjectStats.students.slice(0, 10).map((student: any) => <div key={student.student_id} className="p-3 hover:bg-green-50 transition-colors flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                                  {student.students?.full_name?.charAt(0) || 'S'}
                                </div>
                                <span className="font-medium text-gray-900">
                                  {student.students?.full_name || 'Unknown Student'}
                                </span>
                              </div>)}
                          {subjectStats.students.length > 10 && <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                              +{subjectStats.students.length - 10} more students
                            </div>}
                        </div>
                      </div>
                    </div>}
                </div>}

            {!subjectStats && <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="md" />
              </div>}
          </div>
        </Dialog>}
    </div>;
}