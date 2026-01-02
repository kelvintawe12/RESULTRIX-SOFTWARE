import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Table } from '../ui/Table';
export function MarksEntryForm({
  onSubmit
}: {
  onSubmit: (data: any) => void;
}) {
  // Mock data for students in a class
  const [students, setStudents] = useState([{
    id: '1',
    name: 'John Doe',
    score: '',
    outOf: '100',
    attendance: '',
    comments: ''
  }, {
    id: '2',
    name: 'Jane Smith',
    score: '',
    outOf: '100',
    attendance: '',
    comments: ''
  }, {
    id: '3',
    name: 'Michael Brown',
    score: '',
    outOf: '100',
    attendance: '',
    comments: ''
  }, {
    id: '4',
    name: 'Sarah Wilson',
    score: '',
    outOf: '100',
    attendance: '',
    comments: ''
  }, {
    id: '5',
    name: 'David Lee',
    score: '',
    outOf: '100',
    attendance: '',
    comments: ''
  }]);
  const handleChange = (id: string, field: string, value: string) => {
    setStudents(students.map(student => student.id === id ? {
      ...student,
      [field]: value
    } : student));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(students);
  };
  const columns = [{
    header: 'Student Name',
    accessor: 'name' as const
  }, {
    header: 'Score',
    accessor: 'score' as const,
    render: (row: any) => <input type="number" className="w-20 px-2 py-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" value={row.score} onChange={e => handleChange(row.id, 'score', e.target.value)} placeholder="0" />
  }, {
    header: 'Out Of',
    accessor: 'outOf' as const,
    render: (row: any) => <input type="number" className="w-20 px-2 py-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" value={row.outOf} onChange={e => handleChange(row.id, 'outOf', e.target.value)} />
  }, {
    header: 'Attendance (%)',
    accessor: 'attendance' as const,
    render: (row: any) => <input type="number" className="w-20 px-2 py-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" value={row.attendance} onChange={e => handleChange(row.id, 'attendance', e.target.value)} placeholder="100" />
  }, {
    header: 'Comments',
    accessor: 'comments' as const,
    render: (row: any) => <input type="text" className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" value={row.comments} onChange={e => handleChange(row.id, 'comments', e.target.value)} placeholder="Optional" />
  }];
  return <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <Table data={students} columns={columns} />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" type="button">
          Save Draft
        </Button>
        <Button variant="primary" type="submit">
          Submit Marks
        </Button>
      </div>
    </form>;
}