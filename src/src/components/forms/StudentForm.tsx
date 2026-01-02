import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { Gender } from '../../types';
export function StudentForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    guardianEmail: '',
    classId: '',
    admissionNumber: ''
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  return <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs tabs={[{
      id: 'personal',
      label: 'Personal Details'
    }, {
      id: 'guardian',
      label: 'Guardian Info'
    }, {
      id: 'academic',
      label: 'Academic Info'
    }]} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'personal' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
            <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
            <Input label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
            <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={[{
          value: 'male',
          label: 'Male'
        }, {
          value: 'female',
          label: 'Female'
        }, {
          value: 'other',
          label: 'Other'
        }]} />
            <div className="md:col-span-2">
              <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
            </div>
          </div>}

        {activeTab === 'guardian' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Guardian Name" name="guardianName" value={formData.guardianName} onChange={handleChange} required />
            <Input label="Relationship" name="guardianRelation" value={formData.guardianRelation} onChange={handleChange} required placeholder="e.g. Father, Mother" />
            <Input label="Phone Number" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} required />
            <Input label="Email Address" name="guardianEmail" type="email" value={formData.guardianEmail} onChange={handleChange} />
          </div>}

        {activeTab === 'academic' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Admission Number" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} required />
            <Select label="Class" name="classId" value={formData.classId} onChange={handleChange} options={[{
          value: '1',
          label: 'Form 1'
        }, {
          value: '2',
          label: 'Form 2'
        }, {
          value: '3',
          label: 'Form 3'
        }, {
          value: '4',
          label: 'Form 4'
        }]} />
          </div>}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save Student
        </Button>
      </div>
    </form>;
}