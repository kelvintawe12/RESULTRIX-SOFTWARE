import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { Save, Plus, Trash2, Award } from 'lucide-react';
type GradingScale = 'out_of_20' | 'percentage' | 'gpa_4_0' | 'gpa_5_0' | 'custom';
interface GPARange {
  min: number;
  max: number;
  letter: string;
  points: number;
}
export function GradingSystemSetupPage() {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [gradingScale, setGradingScale] = useState<GradingScale>('percentage');
  const [defaultExamOutOf, setDefaultExamOutOf] = useState('100');
  const [gpaRanges, setGpaRanges] = useState<GPARange[]>([{
    min: 90,
    max: 100,
    letter: 'A',
    points: 4.0
  }, {
    min: 80,
    max: 89,
    letter: 'B',
    points: 3.0
  }, {
    min: 70,
    max: 79,
    letter: 'C',
    points: 2.0
  }, {
    min: 60,
    max: 69,
    letter: 'D',
    points: 1.0
  }, {
    min: 0,
    max: 59,
    letter: 'F',
    points: 0.0
  }]);
  useEffect(() => {
    if (user?.school_id) {
      fetchGradingConfig();
    }
  }, [user?.school_id]);
  const fetchGradingConfig = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('schools').select('grading_scale, default_exam_out_of, gpa_mapping').eq('id', user?.school_id).single();
      if (error) throw error;
      if (data) {
        setGradingScale(data.grading_scale || 'percentage');
        setDefaultExamOutOf(data.default_exam_out_of?.toString() || '100');
        if (data.gpa_mapping) {
          const ranges: GPARange[] = [];
          Object.entries(data.gpa_mapping).forEach(([range, value]: [string, any]) => {
            const [min, max] = range.split('-').map(Number);
            ranges.push({
              min,
              max,
              letter: value.letter,
              points: value.points
            });
          });
          ranges.sort((a, b) => b.min - a.min);
          setGpaRanges(ranges);
        }
      }
    } catch (err: any) {
      console.error('Error fetching grading config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const examOutOf = parseInt(defaultExamOutOf);
      if (isNaN(examOutOf) || examOutOf <= 0) {
        throw new Error('Default exam score must be a positive number');
      }
      // Build GPA mapping object
      let gpaMapping: any = null;
      if (['gpa_4_0', 'gpa_5_0', 'custom'].includes(gradingScale)) {
        gpaMapping = {};
        gpaRanges.forEach(range => {
          const key = `${range.min}-${range.max}`;
          gpaMapping[key] = {
            letter: range.letter,
            points: range.points
          };
        });
      }
      const {
        error
      } = await supabase.from('schools').update({
        grading_scale: gradingScale,
        default_exam_out_of: examOutOf,
        gpa_mapping: gpaMapping
      }).eq('id', user?.school_id);
      if (error) throw error;
      setSuccess('Grading system configuration saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving grading config:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  const addGPARange = () => {
    setGpaRanges([...gpaRanges, {
      min: 0,
      max: 0,
      letter: '',
      points: 0
    }]);
  };
  const removeGPARange = (index: number) => {
    setGpaRanges(gpaRanges.filter((_, i) => i !== index));
  };
  const updateGPARange = (index: number, field: keyof GPARange, value: any) => {
    const updated = [...gpaRanges];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setGpaRanges(updated);
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>;
  }
  return <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Grading System Setup
        </h1>
        <p className="text-slate-500 mt-1">
          Configure your school's grading scale and assessment system
        </p>
      </div>

      {error && <Alert variant="error" title="Error" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" title="Success" message={success} onClose={() => setSuccess(null)} />}

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Grading Scale Type
            </label>
            <Select value={gradingScale} onChange={e => setGradingScale(e.target.value as GradingScale)} options={[{
            value: 'percentage',
            label: 'Percentage (0-100%)'
          }, {
            value: 'out_of_20',
            label: 'Out of 20 (0-20)'
          }, {
            value: 'gpa_4_0',
            label: 'GPA 4.0 Scale'
          }, {
            value: 'gpa_5_0',
            label: 'GPA 5.0 Scale'
          }, {
            value: 'custom',
            label: 'Custom GPA Scale'
          }]} />
            <p className="text-xs text-slate-500 mt-1">
              This determines how student grades are calculated and displayed
            </p>
          </div>

          <div>
            <Input label="Default Exam Score (Out Of)" type="number" min="1" value={defaultExamOutOf} onChange={e => setDefaultExamOutOf(e.target.value)} placeholder="100" />
            <p className="text-xs text-slate-500 mt-1">
              Default maximum score for exams (e.g., 100, 20, etc.)
            </p>
          </div>

          {['gpa_4_0', 'gpa_5_0', 'custom'].includes(gradingScale) && <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    GPA Mapping
                  </h3>
                  <p className="text-sm text-slate-500">
                    Define percentage ranges and their corresponding letter
                    grades and GPA points
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={addGPARange} leftIcon={<Plus className="w-4 h-4" />}>
                  Add Range
                </Button>
              </div>

              <div className="space-y-3">
                {gpaRanges.map((range, index) => <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-2">
                      <Input label={index === 0 ? 'Min %' : ''} type="number" min="0" max="100" value={range.min} onChange={e => updateGPARange(index, 'min', parseFloat(e.target.value))} placeholder="0" />
                    </div>
                    <div className="col-span-2">
                      <Input label={index === 0 ? 'Max %' : ''} type="number" min="0" max="100" value={range.max} onChange={e => updateGPARange(index, 'max', parseFloat(e.target.value))} placeholder="100" />
                    </div>
                    <div className="col-span-3">
                      <Input label={index === 0 ? 'Letter Grade' : ''} value={range.letter} onChange={e => updateGPARange(index, 'letter', e.target.value)} placeholder="A" />
                    </div>
                    <div className="col-span-3">
                      <Input label={index === 0 ? 'GPA Points' : ''} type="number" step="0.1" min="0" max={gradingScale === 'gpa_5_0' ? '5' : '4'} value={range.points} onChange={e => updateGPARange(index, 'points', parseFloat(e.target.value))} placeholder="4.0" />
                    </div>
                    <div className="col-span-2">
                      <Button variant="danger" size="sm" onClick={() => removeGPARange(index)} disabled={gpaRanges.length === 1} leftIcon={<Trash2 className="w-4 h-4" />}>
                        Remove
                      </Button>
                    </div>
                  </div>)}
              </div>
            </div>}

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button variant="primary" onClick={handleSave} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
              Save Configuration
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview Section */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Current Configuration
            </h3>
            <div className="space-y-1 text-sm text-slate-600">
              <p>
                <span className="font-medium">Grading Scale:</span>{' '}
                {gradingScale === 'percentage' && 'Percentage (0-100%)'}
                {gradingScale === 'out_of_20' && 'Out of 20 (0-20)'}
                {gradingScale === 'gpa_4_0' && 'GPA 4.0 Scale'}
                {gradingScale === 'gpa_5_0' && 'GPA 5.0 Scale'}
                {gradingScale === 'custom' && 'Custom GPA Scale'}
              </p>
              <p>
                <span className="font-medium">Default Exam Score:</span> Out of{' '}
                {defaultExamOutOf}
              </p>
              {['gpa_4_0', 'gpa_5_0', 'custom'].includes(gradingScale) && <p>
                  <span className="font-medium">GPA Ranges:</span>{' '}
                  {gpaRanges.length} configured
                </p>}
            </div>
          </div>
        </div>
      </Card>
    </div>;
}