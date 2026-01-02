import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Calculator, Users, DollarSign, FileText, Download, TrendingUp } from 'lucide-react';
export function ToolsPage() {
  // Fee Calculator State
  const [feeCalc, setFeeCalc] = useState({
    tuition: '',
    transport: '',
    meals: '',
    activities: '',
    students: ''
  });
  const [feeResult, setFeeResult] = useState<number | null>(null);
  // Student-Teacher Ratio Calculator
  const [ratioCalc, setRatioCalc] = useState({
    students: '',
    teachers: ''
  });
  const [ratioResult, setRatioResult] = useState<string | null>(null);
  const calculateFees = () => {
    const total = (parseFloat(feeCalc.tuition) || 0) + (parseFloat(feeCalc.transport) || 0) + (parseFloat(feeCalc.meals) || 0) + (parseFloat(feeCalc.activities) || 0);
    const students = parseInt(feeCalc.students) || 1;
    setFeeResult(total * students);
  };
  const calculateRatio = () => {
    const students = parseInt(ratioCalc.students) || 0;
    const teachers = parseInt(ratioCalc.teachers) || 1;
    const ratio = (students / teachers).toFixed(1);
    let assessment = '';
    const ratioNum = parseFloat(ratio);
    if (ratioNum < 15) assessment = 'Excellent';else if (ratioNum < 20) assessment = 'Good';else if (ratioNum < 25) assessment = 'Acceptable';else assessment = 'Needs Improvement';
    setRatioResult(`${ratio}:1 (${assessment})`);
  };
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }}>
            <Calculator className="h-16 w-16 mx-auto mb-6 text-indigo-400" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Free School Management Tools
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Helpful calculators and templates to streamline your school
              operations. No signup required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Fee Calculator */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Fee Calculator
                    </h2>
                    <p className="text-sm text-slate-600">
                      Calculate total term fees per student
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tuition Fee (per term)
                    </label>
                    <Input type="number" value={feeCalc.tuition} onChange={e => setFeeCalc({
                    ...feeCalc,
                    tuition: e.target.value
                  })} placeholder="50000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Transport Fee (optional)
                    </label>
                    <Input type="number" value={feeCalc.transport} onChange={e => setFeeCalc({
                    ...feeCalc,
                    transport: e.target.value
                  })} placeholder="5000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meals Fee (optional)
                    </label>
                    <Input type="number" value={feeCalc.meals} onChange={e => setFeeCalc({
                    ...feeCalc,
                    meals: e.target.value
                  })} placeholder="8000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Activities Fee (optional)
                    </label>
                    <Input type="number" value={feeCalc.activities} onChange={e => setFeeCalc({
                    ...feeCalc,
                    activities: e.target.value
                  })} placeholder="3000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Number of Students
                    </label>
                    <Input type="number" value={feeCalc.students} onChange={e => setFeeCalc({
                    ...feeCalc,
                    students: e.target.value
                  })} placeholder="1" />
                  </div>

                  <Button onClick={calculateFees} className="w-full">
                    Calculate Total
                  </Button>

                  {feeResult !== null && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-600 font-medium mb-1">
                        Total Revenue
                      </p>
                      <p className="text-3xl font-bold text-green-700">
                        KES {feeResult.toLocaleString()}
                      </p>
                    </div>}
                </div>
              </Card>
            </motion.div>

            {/* Student-Teacher Ratio Calculator */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.1
          }}>
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Student-Teacher Ratio
                    </h2>
                    <p className="text-sm text-slate-600">
                      Check if your ratio meets standards
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Total Students
                    </label>
                    <Input type="number" value={ratioCalc.students} onChange={e => setRatioCalc({
                    ...ratioCalc,
                    students: e.target.value
                  })} placeholder="500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Total Teachers
                    </label>
                    <Input type="number" value={ratioCalc.teachers} onChange={e => setRatioCalc({
                    ...ratioCalc,
                    teachers: e.target.value
                  })} placeholder="25" />
                  </div>

                  <Button onClick={calculateRatio} className="w-full">
                    Calculate Ratio
                  </Button>

                  {ratioResult && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-600 font-medium mb-1">
                        Your Ratio
                      </p>
                      <p className="text-3xl font-bold text-blue-700">
                        {ratioResult}
                      </p>
                      <p className="text-xs text-slate-600 mt-2">
                        Recommended: 15:1 to 20:1
                      </p>
                    </div>}
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2 text-sm">
                    Ratio Guidelines:
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• &lt;15:1 - Excellent (personalized attention)</li>
                    <li>• 15-20:1 - Good (balanced)</li>
                    <li>• 20-25:1 - Acceptable (manageable)</li>
                    <li>• &gt;25:1 - Consider hiring more teachers</li>
                  </ul>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Free Templates Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Free Templates
            </h2>
            <p className="text-lg text-slate-600">
              Download ready-to-use templates for your school.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[{
            title: 'Report Card Template',
            icon: FileText,
            format: 'Excel'
          }, {
            title: 'Fee Structure Template',
            icon: DollarSign,
            format: 'Excel'
          }, {
            title: 'Student Enrollment Form',
            icon: Users,
            format: 'PDF'
          }, {
            title: 'Teacher Evaluation Form',
            icon: TrendingUp,
            format: 'PDF'
          }, {
            title: 'Parent Communication Log',
            icon: FileText,
            format: 'Excel'
          }, {
            title: 'Class Attendance Sheet',
            icon: Users,
            format: 'Excel'
          }].map((template, index) => <motion.div key={template.title} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }}>
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
                    <template.icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    {template.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Format: {template.format}
                  </p>
                  <Button variant="outline" size="sm" className="w-full" leftIcon={<Download className="h-4 w-4" />}>
                    Download
                  </Button>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Need More Powerful Tools?</h2>
          <p className="text-xl text-indigo-100 mb-8">
            Get access to advanced analytics, automated workflows, and
            AI-powered insights with EduMaster.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-indigo-700">
              View Pricing
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>;
}