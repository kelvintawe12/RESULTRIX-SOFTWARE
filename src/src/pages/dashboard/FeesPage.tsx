import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { DollarSign, AlertCircle, CheckCircle, Download, ArrowRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
// Types
interface ClassFeeData {
  id: string;
  className: string;
  students: number;
  feePerStudent: number;
  expected: number;
  collected: number;
  outstanding: number;
  collectionRate: number;
}
export function FeesPage() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [term, setTerm] = useState('current');
  const [classFeesData, setClassFeesData] = useState<ClassFeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState('USD');
  // Fetch fee data
  useEffect(() => {
    if (!user?.school_id) return;
    const fetchFeeData = async () => {
      try {
        setLoading(true);
        // Get school currency
        const {
          data: school
        } = await supabase.from('schools').select('currency_code').eq('id', user.school_id).single();
        if (school) {
          setCurrencyCode(school.currency_code);
        }
        // Get classes with fee structures
        const {
          data: classes,
          error: classError
        } = await supabase.from('classes').select(`
            id,
            name,
            fee_structures(amount)
          `).eq('school_id', user.school_id);
        if (classError) throw classError;
        // For each class, calculate fee metrics
        const enrichedData = await Promise.all((classes || []).map(async cls => {
          // Get student count
          const {
            count: studentCount
          } = await supabase.from('students').select('*', {
            count: 'exact',
            head: true
          }).eq('class_id', cls.id).eq('school_id', user.school_id);
          // Get total payments for students in this class
          const {
            data: students
          } = await supabase.from('students').select('id, total_fee, total_paid').eq('class_id', cls.id).eq('school_id', user.school_id);
          const feePerStudent = cls.fee_structures?.[0]?.amount || 0;
          const totalStudents = studentCount || 0;
          const expected = feePerStudent * totalStudents;
          // Sum up total paid from all students
          const collected = students?.reduce((sum, s) => sum + (s.total_paid || 0), 0) || 0;
          const outstanding = expected - collected;
          const collectionRate = expected > 0 ? collected / expected * 100 : 0;
          return {
            id: cls.id,
            className: cls.name,
            students: totalStudents,
            feePerStudent,
            expected,
            collected,
            outstanding,
            collectionRate
          };
        }));
        setClassFeesData(enrichedData);
      } catch (err) {
        console.error('Error fetching fee data:', err);
        setError('Failed to load fee data');
      } finally {
        setLoading(false);
      }
    };
    fetchFeeData();
  }, [user?.school_id, term]);
  // Calculate totals
  const totalExpected = classFeesData.reduce((acc, curr) => acc + curr.expected, 0);
  const totalCollected = classFeesData.reduce((acc, curr) => acc + curr.collected, 0);
  const totalOutstanding = totalExpected - totalCollected;
  const overallRate = totalExpected > 0 ? totalCollected / totalExpected * 100 : 0;
  // Currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>;
  }
  if (error) {
    return <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Fees & Collections
          </h1>
          <p className="text-gray-500">Financial overview by class and term</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Term</SelectItem>
              <SelectItem value="term-1">Term 1</SelectItem>
              <SelectItem value="term-2">Term 2</SelectItem>
              <SelectItem value="term-3">Term 3</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">
              Expected Revenue
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(totalExpected)}
            </h3>
            <div className="mt-2 text-xs text-gray-500">For current term</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Total Collected</p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-2">
              {formatCurrency(totalCollected)}
            </h3>
            <div className="mt-2 text-xs text-emerald-600 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              {overallRate.toFixed(1)}% of expected
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Outstanding</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-2">
              {formatCurrency(totalOutstanding)}
            </h3>
            <div className="mt-2 text-xs text-amber-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {totalOutstanding > 0 ? 'Action required' : 'All collected'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Collection Rate</p>
            <h3 className="text-2xl font-bold text-blue-700 mt-2">
              {overallRate.toFixed(1)}%
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{
              width: `${Math.min(overallRate, 100)}%`
            }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {classFeesData.length > 0 && <Card>
          <CardHeader>
            <CardTitle>Collection Performance by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classFeesData} margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="className" axisLine={false} tickLine={false} tick={{
                fill: '#6B7280'
              }} />
                  <YAxis axisLine={false} tickLine={false} tick={{
                fill: '#6B7280'
              }} tickFormatter={val => formatCurrency(val)} />
                  <Tooltip cursor={{
                fill: 'transparent'
              }} contentStyle={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }} formatter={(value: number) => [formatCurrency(value), '']} />
                  <Legend />
                  <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="outstanding" name="Outstanding" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>}

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Class-wise Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {classFeesData.length === 0 ? <div className="p-8 text-center text-gray-500">
              No fee data available. Set up fee structures for your classes.
            </div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Fee / Student</TableHead>
                  <TableHead>Expected Total</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Collection Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classFeesData.map(item => <TableRow key={item.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">
                      {item.className}
                    </TableCell>
                    <TableCell>{item.students}</TableCell>
                    <TableCell>{formatCurrency(item.feePerStudent)}</TableCell>
                    <TableCell>{formatCurrency(item.expected)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(item.collected)}
                    </TableCell>
                    <TableCell className="text-amber-600 font-medium">
                      {formatCurrency(item.outstanding)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${item.collectionRate >= 90 ? 'text-green-600' : item.collectionRate >= 70 ? 'text-blue-600' : 'text-red-600'}`}>
                          {item.collectionRate.toFixed(1)}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${item.collectionRate >= 90 ? 'bg-green-600' : item.collectionRate >= 70 ? 'bg-blue-600' : 'bg-red-600'}`} style={{
                      width: `${Math.min(item.collectionRate, 100)}%`
                    }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => navigate('/dashboard/payments')}>
                        View Details <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>
    </div>;
}