import React, { useState, Children } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Users, GraduationCap, DollarSign, BarChart3, Calendar, FileText, Shield, Zap, Globe, MessageSquare, CheckCircle, ArrowRight, Smartphone, Clock, TrendingUp, Award, BookOpen, CreditCard, Mail, Bell, Lock, Cloud, Layers } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
const features = [{
  category: 'Student Management',
  icon: Users,
  color: 'from-blue-500 to-cyan-500',
  description: 'Complete student lifecycle management from admission to graduation',
  items: [{
    icon: Users,
    title: 'Student Profiles',
    description: 'Comprehensive digital records with photos, documents, and history'
  }, {
    icon: FileText,
    title: 'Academic Records',
    description: 'Complete transcript management across all years and terms'
  }, {
    icon: TrendingUp,
    title: 'Performance Tracking',
    description: 'Real-time grade monitoring and progress analytics'
  }, {
    icon: Award,
    title: 'Achievements',
    description: 'Track awards, certificates, and extracurricular activities'
  }]
}, {
  category: 'Academic Excellence',
  icon: GraduationCap,
  color: 'from-purple-500 to-pink-500',
  description: 'Powerful tools for curriculum management and academic tracking',
  items: [{
    icon: BookOpen,
    title: 'Curriculum Planning',
    description: 'Design and manage syllabi, lesson plans, and learning objectives'
  }, {
    icon: Calendar,
    title: 'Timetable Management',
    description: 'Automated scheduling with conflict detection'
  }, {
    icon: FileText,
    title: 'Report Cards',
    description: 'Beautiful, customizable report cards with one-click generation'
  }, {
    icon: BarChart3,
    title: 'Grade Analytics',
    description: 'Deep insights into class and individual performance trends'
  }]
}, {
  category: 'Financial Management',
  icon: DollarSign,
  color: 'from-emerald-500 to-teal-500',
  description: 'Complete fee management and financial tracking system',
  items: [{
    icon: CreditCard,
    title: 'Fee Collection',
    description: 'Multiple payment methods including M-Pesa, cards, and bank transfers'
  }, {
    icon: FileText,
    title: 'Invoicing',
    description: 'Automated invoice generation and payment reminders'
  }, {
    icon: BarChart3,
    title: 'Financial Reports',
    description: 'Real-time revenue tracking and expense management'
  }, {
    icon: TrendingUp,
    title: 'Payment Analytics',
    description: 'Track collection rates, outstanding balances, and trends'
  }]
}, {
  category: 'Communication Hub',
  icon: MessageSquare,
  color: 'from-orange-500 to-red-500',
  description: 'Stay connected with students, parents, and staff',
  items: [{
    icon: Mail,
    title: 'Email System',
    description: 'Built-in email with templates for common communications'
  }, {
    icon: MessageSquare,
    title: 'SMS Notifications',
    description: 'Bulk SMS for urgent announcements and reminders'
  }, {
    icon: Bell,
    title: 'Push Notifications',
    description: 'Real-time alerts via mobile app and web'
  }, {
    icon: Smartphone,
    title: 'Parent Portal',
    description: 'Dedicated portal for parents to track student progress'
  }]
}, {
  category: 'Analytics & Insights',
  icon: BarChart3,
  color: 'from-indigo-500 to-blue-500',
  description: 'Data-driven decision making with powerful analytics',
  items: [{
    icon: TrendingUp,
    title: 'Performance Metrics',
    description: 'Track KPIs across academics, finance, and operations'
  }, {
    icon: BarChart3,
    title: 'Custom Reports',
    description: 'Build custom reports with drag-and-drop interface'
  }, {
    icon: Globe,
    title: 'Dashboards',
    description: 'Role-based dashboards with real-time data visualization'
  }, {
    icon: FileText,
    title: 'Export Tools',
    description: 'Export data to Excel, PDF, and other formats'
  }]
}, {
  category: 'Security & Compliance',
  icon: Shield,
  color: 'from-rose-500 to-pink-500',
  description: 'Enterprise-grade security and data protection',
  items: [{
    icon: Lock,
    title: 'Data Encryption',
    description: 'End-to-end encryption for all sensitive data'
  }, {
    icon: Shield,
    title: 'Access Control',
    description: 'Role-based permissions and audit trails'
  }, {
    icon: Cloud,
    title: 'Daily Backups',
    description: 'Automated backups with point-in-time recovery'
  }, {
    icon: CheckCircle,
    title: 'Compliance',
    description: 'GDPR compliant with data protection certifications'
  }]
}];
const integrations = [{
  name: 'M-Pesa',
  logo: '💳'
}, {
  name: 'PayPal',
  logo: '💰'
}, {
  name: 'Google Workspace',
  logo: '🔷'
}, {
  name: 'Microsoft 365',
  logo: '🔶'
}, {
  name: 'Zoom',
  logo: '📹'
}, {
  name: 'SMS Gateway',
  logo: '📱'
}];
const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
};
const staggerContainer = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};
export function FeaturesPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(0);
  return <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white py-24 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{
          animationDelay: '1s'
        }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div className="text-center max-w-4xl mx-auto" initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">50+ Powerful Features</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Everything You Need to
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                Run Your School
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              From student management to financial tracking, EduMaster provides
              all the tools you need in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/signup')} className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold shadow-2xl">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/demo')} className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{
          once: true
        }} variants={fadeInUp}>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Comprehensive Feature Set
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Every feature designed to save you time and improve your school's
              operations
            </p>
          </motion.div>

          <div className="space-y-24">
            {features.map((category, categoryIndex) => {
            const Icon = category.icon;
            return <motion.div key={category.category} initial="hidden" whileInView="visible" viewport={{
              once: true,
              margin: '-100px'
            }} variants={staggerContainer}>
                  {/* Category Header */}
                  <div className="text-center mb-12">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} shadow-lg mb-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-3">
                      {category.category}
                    </h3>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                      {category.description}
                    </p>
                  </div>

                  {/* Feature Cards */}
                  <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerContainer}>
                    {category.items.map((item, itemIndex) => {
                  const ItemIcon = item.icon;
                  return <motion.div key={item.title} variants={fadeInUp} className="group">
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-transparent hover:shadow-2xl transition-all h-full">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                              <ItemIcon className="h-6 w-6 text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">
                              {item.title}
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </motion.div>;
                })}
                  </motion.div>
                </motion.div>;
          })}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{
          once: true
        }} variants={fadeInUp}>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Seamless Integrations
            </h2>
            <p className="text-lg text-slate-600">
              Works with the tools you already use
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center items-center gap-8">
            {integrations.map((integration, index) => <motion.div key={integration.name} initial={{
            opacity: 0,
            scale: 0.8
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-all">
                <div className="text-4xl">{integration.logo}</div>
                <span className="text-sm font-medium text-slate-700">
                  {integration.name}
                </span>
              </motion.div>)}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" onClick={() => navigate('/integrations')} className="border-2">
              View All Integrations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[{
            value: '500+',
            label: 'Schools Trust Us'
          }, {
            value: '50k+',
            label: 'Students Managed'
          }, {
            value: '99.9%',
            label: 'Uptime SLA'
          }, {
            value: '24/7',
            label: 'Support Available'
          }].map((stat, index) => <motion.div key={stat.label} initial={{
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
                <div className="text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-indigo-200">{stat.label}</div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{
          once: true
        }} variants={fadeInUp}>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Ready to Transform Your School?
            </h2>
            <p className="text-xl text-slate-600 mb-10">
              Join hundreds of schools that have modernized their operations
              with EduMaster.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/signup')} className="bg-indigo-600 hover:bg-indigo-700">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
                View Pricing
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </PublicLayout>;
}