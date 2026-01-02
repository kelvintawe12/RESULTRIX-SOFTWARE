import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { PaymentMethod } from '../../types';
export function PaymentForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    method: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: ''
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
      <Select label="Select Student" name="studentId" value={formData.studentId} onChange={handleChange} options={[{
      value: '1',
      label: 'John Doe (ADM001)'
    }, {
      value: '2',
      label: 'Jane Smith (ADM002)'
    }, {
      value: '3',
      label: 'Michael Brown (ADM003)'
    }]} required />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Amount" name="amount" type="number" value={formData.amount} onChange={handleChange} required placeholder="0.00" />
        <Select label="Payment Method" name="method" value={formData.method} onChange={handleChange} options={[{
        value: 'cash',
        label: 'Cash'
      }, {
        value: 'bank_transfer',
        label: 'Bank Transfer'
      }, {
        value: 'mobile_money',
        label: 'Mobile Money'
      }, {
        value: 'cheque',
        label: 'Cheque'
      }]} />
      </div>

      <Input label="Payment Date" name="date" type="date" value={formData.date} onChange={handleChange} required />

      <Input label="Notes (Optional)" name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g. Term 1 fees balance" />

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Record Payment
        </Button>
      </div>
    </form>;
}