import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Calendar, CheckCircle, Clock, Users, Zap, Shield, TrendingUp } from 'lucide-react';
export function DemoPage() {
  const [formData, setFormData] = useState({
    schoolName: '',
    adminName: '',
    email: '',
    phone: '',
    studentCount: '',
    preferredTime: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
  };
  const benefits = [{
    icon: Clock,
    title: '30-Minute Demo',
    description: 'Quick, focused walkthrough of key features'
  }, {
    icon: Users,
    title: 'Personalized',
    description: "Tailored to your school's specific needs"
  }, {
    icon: Zap,
    title: 'Live Q&A',
    description: 'Get all your questions answered in real-time'
  }, {
    icon: Shield,
    title: 'No Commitment',
    description: 'No credit card required, no pressure'
  }];
  if (submitted) {
    return <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 py-20">
          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} className="max-w-md mx-auto text-center px-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Demo Request Received!
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Thank you for your interest in EduMaster. Our team will contact
              you within 24 hours to schedule your personalized demo.
            </p>
            <Button size="lg" onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </motion.div>
        </div>
      </PublicLayout>;
  }
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }}>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              See EduMaster in Action
            </h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Book a personalized demo and discover how EduMaster can transform
              your school's operations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Request Your Demo
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        School Name <span className="text-red-500">*</span>
                      </label>
                      <Input required value={formData.schoolName} onChange={e => setFormData({
                      ...formData,
                      schoolName: e.target.value
                    })} placeholder="Your School Name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <Input required value={formData.adminName} onChange={e => setFormData({
                      ...formData,
                      adminName: e.target.value
                    })} placeholder="John Doe" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <Input required type="email" value={formData.email} onChange={e => setFormData({
                      ...formData,
                      email: e.target.value
                    })} placeholder="admin@school.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <Input required type="tel" value={formData.phone} onChange={e => setFormData({
                      ...formData,
                      phone: e.target.value
                    })} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Number of Students{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <Select value={formData.studentCount} onValueChange={value => setFormData({
                      ...formData,
                      studentCount: value
                    })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<100">Less than 100</SelectItem>
                          <SelectItem value="100-500">100 - 500</SelectItem>
                          <SelectItem value="500-1000">500 - 1,000</SelectItem>
                          <SelectItem value="1000+">1,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Preferred Demo Time
                      </label>
                      <Input type="text" value={formData.preferredTime} onChange={e => setFormData({
                      ...formData,
                      preferredTime: e.target.value
                    })} placeholder="e.g., Next Tuesday 2pm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Message / Requirements
                    </label>
                    <textarea rows={4} value={formData.message} onChange={e => setFormData({
                    ...formData,
                    message: e.target.value
                  })} placeholder="Tell us about your specific needs or questions..." className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Submitting...' : 'Book Live Demo'}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    By submitting this form, you agree to our{' '}
                    <a href="/privacy-policy" className="text-indigo-600 hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </form>
              </div>
            </div>

            {/* Benefits Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  What to Expect
                </h3>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <benefit.icon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">
                          {benefit.title}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {benefit.description}
                        </p>
                      </div>
                    </div>)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <TrendingUp className="h-8 w-8 mb-4" />
                <h3 className="text-lg font-bold mb-2">Join 500+ Schools</h3>
                <p className="text-indigo-100 text-sm">
                  Leading institutions worldwide trust EduMaster to manage their
                  operations efficiently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>;
}