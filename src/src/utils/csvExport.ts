// CSV Export Utility Functions

export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  const csv = convertToCSV(data);
  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;'
  });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const headerRow = headers.map(escapeCSVValue).join(',');

  // Create CSV data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return escapeCSVValue(value);
    }).join(',');
  });
  return [headerRow, ...dataRows].join('\n');
}
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

// Specific export functions for different data types

export function exportStudents(students: any[]) {
  const exportData = students.map(student => ({
    'Admission Number': student.admission_number || 'N/A',
    'Full Name': student.full_name,
    Gender: student.gender,
    'Date of Birth': student.date_of_birth,
    Email: student.email || 'N/A',
    Phone: student.phone || 'N/A',
    'Enrollment Date': student.enrollment_date,
    'Total Fee': student.total_fee,
    'Total Paid': student.total_paid,
    Remaining: student.remaining,
    Status: student.remaining <= 0 ? 'Paid' : 'Pending'
  }));
  const filename = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(exportData, filename);
}
export function exportTeachers(teachers: any[]) {
  const exportData = teachers.map(teacher => ({
    'Full Name': teacher.full_name,
    Email: teacher.email,
    Phone: teacher.phone || 'N/A',
    Role: teacher.role,
    'Created At': new Date(teacher.created_at).toLocaleDateString()
  }));
  const filename = `teachers_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(exportData, filename);
}
export function exportBursars(bursars: any[]) {
  const exportData = bursars.map(bursar => ({
    'Full Name': bursar.full_name,
    Email: bursar.email,
    Phone: bursar.phone || 'N/A',
    Role: bursar.role,
    'Created At': new Date(bursar.created_at).toLocaleDateString()
  }));
  const filename = `bursars_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(exportData, filename);
}
export function exportPayments(payments: any[]) {
  const exportData = payments.map(payment => ({
    Date: new Date(payment.date).toLocaleDateString(),
    'Student Name': payment.student_name || 'N/A',
    Amount: payment.amount,
    Method: payment.method,
    Notes: payment.notes || '',
    Receipt: payment.receipt_path || 'N/A'
  }));
  const filename = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(exportData, filename);
}