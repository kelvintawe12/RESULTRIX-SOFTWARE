import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { GraduationCap, Globe, Database, Users, FileText, Layout, BarChart, CheckCircle, ArrowRight, Building } from 'lucide-react';
const containerVariants = {
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
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0
  }
};
const features = [{
  title: 'Course Management',
  description: 'Handle complex course catalogs, prerequisites, and scheduling across multiple departments and campuses.',
  icon: BookOpen
}, {
  title: 'Research Tracking',
  description: 'Manage grants, publications, and research projects with dedicated tools for faculty and administration.',
  icon: Database
}, {
  title: 'Alumni Relations',
  description: 'Maintain lifelong connections with graduates through events, fundraising, and career services.',
  icon: Users
}, {
  title: 'Financial Aid',
  description: 'Streamline scholarship applications, disbursements, and compliance reporting.',
  icon: DollarSign
}, {
  title: 'Multi-Campus Support',
  description: 'Unified management for institutions with satellite campuses or international locations.',
  icon: Globe
}, {
  title: 'Student Portal',
  description: 'A modern, mobile-friendly experience for course registration, grades, and campus life.',
  icon: Layout
}];
import { BookOpen, DollarSign } from 'lucide-react'; // Importing missing icons
const stats = [{
  value: '50k+',
  label: 'Students Managed'
}, {
  value: '200+',
  label: 'Programs Supported'
}, {
  value: '40%',
  label: 'Efficiency Gains'
}, {
  value: '24/7',
  label: 'System Uptime'
}];
export function UniversitiesPage() {
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-slate-900 text-white pt-24 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-slate-900 opacity-80"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            <div className="inline-flex items-center justify-center p-2 bg-blue-500/20 rounded-full mb-6 text-blue-300 font-medium text-sm px-4 border border-blue-500/30">
              <GraduationCap className="w-4 h-4 mr-2" />
              For Higher Education
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Scale Your University <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Operations & Impact
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              A robust, enterprise-grade platform designed to handle the
              complexity of modern higher education institutions, from
              admissions to alumni.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/contact">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-none px-8 py-6 h-auto text-lg">
                  Request University Demo
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg" className="text-white border-slate-600 hover:bg-slate-800 hover:text-white px-8 py-6 h-auto text-lg">
                  Explore Features
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => <motion.div key={index} initial={{
            opacity: 0,
            scale: 0.9
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }}>
                <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                  {stat.label}
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Enterprise-Grade Solutions
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built to handle high volume, complex data structures, and rigorous
              security requirements.
            </p>
          </div>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{
          once: true,
          margin: '-50px'
        }}>
            {features.map((feature, index) => <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-slate-200 group bg-white" noPadding>
                  <div className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4">
                Data Driven
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Actionable Insights for Administration
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Make informed decisions with real-time analytics across all
                departments. From enrollment trends to financial forecasting,
                get the full picture of your institution's health.
              </p>
              <ul className="space-y-4">
                {['Cross-departmental reporting', 'Predictive enrollment modeling', 'Resource utilization tracking', 'Compliance and accreditation data'].map((item, i) => <li key={i} className="flex items-center text-slate-700">
                    <CheckCircle className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" />
                    {item}
                  </li>)}
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="relative h-96 bg-slate-50 rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-bl from-indigo-50 to-white opacity-50"></div>
                <div className="text-slate-400 font-medium relative z-10 flex flex-col items-center">
                  <BarChart className="w-16 h-16 mb-4 text-indigo-200" />
                  <span>Analytics Dashboard Preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-10 bg-cover bg-center"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Future-Proof Your Institution
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join leading universities that trust our platform for their digital
            transformation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/contact">
              <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 border-none px-8 py-6 h-auto text-lg w-full sm:w-auto font-semibold">
                Schedule Consultation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>;
}