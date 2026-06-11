import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BarChart3,
  Truck,
  Shield,
  Globe,
  Smartphone,
  Bell,
  FileText,
  Clock,
  Lock,
  Zap,
  CheckCircle,
  ArrowRight,
  Search,
  MessageSquare,
  Database,
  Server
} from 'lucide-react';

const mainFeatures = [
  {
    icon: Users,
    title: 'Complete Student Management',
    description: 'Manage student records, enrollment, attendance, and progress tracking all in one place.',
    features: [
      'Digital student records',
      'Enrollment management',
      'Attendance tracking',
      'Grade management',
      'Progress reports',
      'Bulk import/export'
    ]
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Get real-time insights into student performance and school operations.',
    features: [
      'Performance dashboards',
      'Custom reports',
      'Data visualization',
      'Trend analysis',
      'Export reports (PDF/CSV)',
      'Real-time analytics'
    ]
  },
  {
    icon: Truck,
    title: 'Financial Management',
    description: 'Automate billing, track payments, and manage school finances effortlessly.',
    features: [
      'Automated invoicing',
      'Payment tracking',
      'Receipt generation',
      'Financial reports',
      'Multi-currency support',
      'Payment reminders'
    ]
  },
  {
    icon: Bell,
    title: 'Communication Hub',
    description: 'Keep everyone connected with integrated messaging and announcements.',
    features: [
      'Email templates',
      'Bulk messaging',
      'Announcements',
      'Parent notifications',
      'SMS integration',
      'Message history'
    ]
  },
  {
    icon: FileText,
    title: 'Report Generation',
    description: 'Create custom report cards and academic reports automatically.',
    features: [
      'Report templates',
      'Custom branding',
      'Bulk generation',
      'PDF export',
      'Email delivery',
      'Archive storage'
    ]
  },
  {
    icon: Clock,
    title: 'Attendance Management',
    description: 'Track student and teacher attendance with detailed analytics.',
    features: [
      'Daily attendance',
      'Absence reports',
      'Parent alerts',
      'Historical tracking',
      'Export reports',
      'Attendance analytics'
    ]
  }
];

const secondaryFeatures = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level security to protect sensitive school data.'
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Support for multiple languages and regional customization.'
  },
  {
    icon: Smartphone,
    title: 'Mobile Optimized',
    description: 'Full-featured mobile apps for iOS and Android devices.'
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    description: 'Control who can access what with granular permissions.'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed and performance even with large datasets.'
  },
  {
    icon: Database,
    title: 'Data Backup',
    description: 'Automatic daily backups with disaster recovery options.'
  },
  {
    icon: Server,
    title: 'API Access',
    description: 'Build custom integrations with our powerful REST API.'
  },
  {
    icon: MessageSquare,
    title: '24/7 Support',
    description: 'Expert support team available round the clock.'
  }
];

export function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-slate-900 to-blue-900 pt-20 pb-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            Powerful Features for Modern Schools
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Everything you need to streamline school operations, manage student success, and engage with families.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 sm:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="space-y-20">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;

              return (
                <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className={isEven ? 'order-1' : 'order-2 lg:order-1'}>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-100 mb-6">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">{feature.title}</h2>
                    <p className="text-xl text-slate-600 mb-8">{feature.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {feature.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span className="text-slate-700">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl p-12 h-96 flex items-center justify-center ${isEven ? 'order-2' : 'order-2 lg:order-2'}`}>
                    <div className="text-center text-slate-400">
                      <Icon className="w-24 h-24 mx-auto mb-4 opacity-50" />
                      <p className="text-sm font-medium">{feature.title}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Secondary Features Grid */}
      <section className="py-20 sm:py-32 bg-slate-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Additional Features</h2>
            <p className="text-xl text-slate-600">
              Plus many more features designed to make your life easier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {secondaryFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
                  <Icon className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Feature */}
      <section className="py-20 sm:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Choose EduMaster?</h2>
            <p className="text-xl text-slate-600">
              See how we compare to traditional methods
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="py-4 px-6 text-left font-semibold text-slate-900">Feature</th>
                  <th className="py-4 px-6 text-center font-semibold text-slate-900">EduMaster</th>
                  <th className="py-4 px-6 text-center font-semibold text-slate-900">Manual Process</th>
                  <th className="py-4 px-6 text-center font-semibold text-slate-900">Other Systems</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  { feature: 'Student Records', edumaster: true, manual: false, other: true },
                  { feature: 'Automated Reporting', edumaster: true, manual: false, other: true },
                  { feature: 'Real-time Analytics', edumaster: true, manual: false, other: false },
                  { feature: 'Payment Integration', edumaster: true, manual: false, other: false },
                  { feature: 'Mobile App', edumaster: true, manual: false, other: false },
                  { feature: 'Parent Portal', edumaster: true, manual: false, other: true },
                  { feature: '24/7 Support', edumaster: true, manual: false, other: false },
                  { feature: 'Data Security', edumaster: true, manual: false, other: true }
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900">{row.feature}</td>
                    <td className="py-4 px-6 text-center">
                      {row.edumaster ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-slate-300 rounded mx-auto"></div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.manual ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-slate-300 rounded mx-auto"></div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.other ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-slate-300 rounded mx-auto"></div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Experience These Features?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Get started with a free 14-day trial. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-slate-100 transition-all"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500/20 text-white font-semibold rounded-lg hover:bg-blue-500/30 border border-white/20 transition-all"
            >
              View Pricing
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
