import React, { useState, createElement } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
interface BulkImportStudentsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
export function BulkImportStudentsForm({
  isOpen,
  onClose,
  onSuccess
}: BulkImportStudentsFormProps) {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const downloadTemplate = () => {
    const csvContent = `Full Name,Date of Birth (YYYY-MM-DD),Gender (male/female/other),Phone,Email,Nationality,Address,Guardian Name,Guardian Relationship,Guardian Phone,Guardian Email,Guardian Address,Guardian Occupation,Guardian ID Number,Class Name,Previous School,Blood Type,Allergies,Medical Conditions,Special Needs
John Doe,2010-05-15,male,+1234567890,john@example.com,USA,123 Main St,Jane Doe,mother,+1234567891,jane@example.com,123 Main St,Teacher,ID123456,Grade 1,Previous School,O+,None,None,None
Jane Smith,2011-03-20,female,+1234567892,jane.smith@example.com,USA,456 Oak Ave,Bob Smith,father,+1234567893,bob@example.com,456 Oak Ave,Engineer,ID789012,Grade 2,Another School,A+,Peanuts,Asthma,None`;
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_students_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };
  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };
  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const text = await file.text();
      const students = parseCSV(text);
      if (students.length === 0) {
        throw new Error('No students found in CSV file');
      }
      // Get academic year and classes
      const {
        data: years
      } = await supabase.from('academic_years').select('*').eq('school_id', user?.school_id).order('start_date', {
        ascending: false
      }).limit(1);
      if (!years || years.length === 0) {
        throw new Error('Please create an academic year first');
      }
      const academicYearId = years[0].id;
      const {
        data: classes
      } = await supabase.from('classes').select('*').eq('school_id', user?.school_id);
      if (!classes || classes.length === 0) {
        throw new Error('Please create classes first');
      }
      let successCount = 0;
      let errorCount = 0;
      for (const student of students) {
        try {
          // Find class by name
          const studentClass = classes.find(c => c.name.toLowerCase() === student['Class Name'].toLowerCase());
          if (!studentClass) {
            console.warn(`Class not found for student: ${student['Full Name']}`);
            errorCount++;
            continue;
          }
          // Get fee structure
          const {
            data: feeData
          } = await supabase.from('fee_structures').select('amount').eq('class_id', studentClass.id).maybeSingle();
          const totalFee = feeData?.amount || 0;
          // Generate student ID
          const {
            count
          } = await supabase.from('students').select('*', {
            count: 'exact',
            head: true
          }).eq('school_id', user?.school_id).eq('class_id', studentClass.id).eq('academic_year_id', academicYearId);
          const studentNumber = (count || 0) + successCount + 1;
          const {
            data: school
          } = await supabase.from('schools').select('name').eq('id', user?.school_id).single();
          const schoolInitials = school?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3) || 'SCH';
          const classCode = studentClass.name.replace(/\s+/g, '').toUpperCase().slice(0, 3);
          const year = new Date().getFullYear();
          const paddedNumber = studentNumber.toString().padStart(3, '0');
          const admissionNumber = `${schoolInitials}-${classCode}-${year}-${paddedNumber}`;
          // Create student
          const {
            data: studentData,
            error: studentError
          } = await supabase.from('students').insert({
            school_id: user?.school_id,
            academic_year_id: academicYearId,
            class_id: studentClass.id,
            full_name: student['Full Name'],
            date_of_birth: student['Date of Birth (YYYY-MM-DD)'],
            gender: student['Gender (male/female/other)'] || 'male',
            phone: student['Phone'] || null,
            email: student['Email'] || null,
            nationality: student['Nationality'] || null,
            address: student['Address'] || null,
            admission_number: admissionNumber,
            enrollment_date: new Date().toISOString().split('T')[0],
            previous_school: student['Previous School'] || null,
            total_fee: totalFee,
            total_paid: 0,
            remaining: totalFee,
            blood_type: student['Blood Type'] || null,
            allergies: student['Allergies'] || null,
            medical_conditions: student['Medical Conditions'] || null,
            special_needs: student['Special Needs'] || null
          }).select().single();
          if (studentError) throw studentError;
          // Create guardian
          await supabase.from('guardians').insert({
            student_id: studentData.id,
            full_name: student['Guardian Name'],
            relationship: student['Guardian Relationship'] || 'guardian',
            phone: student['Guardian Phone'],
            email: student['Guardian Email'],
            address: student['Guardian Address'] || null,
            occupation: student['Guardian Occupation'] || null,
            id_number: student['Guardian ID Number'] || null
          });
          successCount++;
        } catch (err) {
          console.error('Error importing student:', err);
          errorCount++;
        }
      }
      setSuccess(`Successfully imported ${successCount} students. ${errorCount} errors.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error importing students:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return <Dialog isOpen={isOpen} onClose={onClose} title="Bulk Import Students" size="md">
      <div className="space-y-4">
        {error && <Alert variant="error" title="Error" message={error} />}
        {success && <Alert variant="success" title="Success" message={success} />}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Download the CSV template</li>
            <li>Fill in student information</li>
            <li>Upload the completed CSV file</li>
            <li>Click "Import Students"</li>
          </ol>
        </div>

        <Button variant="secondary" onClick={downloadTemplate} leftIcon={<Download className="w-4 h-4" />} className="w-full">
          Download CSV Template
        </Button>

        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
          <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csv-upload" />
          <label htmlFor="csv-upload" className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
            Choose CSV File
          </label>
          {file && <p className="text-sm text-slate-600 mt-2">Selected: {file.name}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImport} isLoading={loading} disabled={!file} leftIcon={<Upload className="w-4 h-4" />}>
            Import Students
          </Button>
        </div>
      </div>
    </Dialog>;
}