import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { Building2, BarChart2, Users, Briefcase, FileCheck, Share2, Map, CheckCircle, ArrowRight } from 'lucide-react';
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
  title: 'Centralized Dashboard',
  description: 'View and manage all schools in your district from a single, unified interface.',
  icon: Building2
}, {
  title: 'Cross-School Analytics',
  description: 'Compare performance, attendance, and financial metrics across different schools.',
  icon: BarChart2
}, {
  title: 'Resource Allocation',
  description: 'Optimize the distribution of staff, funding, and materials based on real-time needs.',
  icon: Briefcase
}, {
  title: 'District Reporting',
  description: 'Generate comprehensive reports for state and federal compliance with a few clicks.',
  icon: FileCheck
}, {
  title: 'Staff Mobility',
  description: 'Easily manage staff who work across multiple locations with unified profiles.',
  icon: Users
}, {
  title: 'Standardized Curriculum',
  description: 'Deploy and monitor curriculum standards across all schools in your district.',
  icon: Share2
}];
const stats = [{
  value: '50+',
  label: 'Schools Managed'
}, {
  value: '100%',
  label: 'District Visibility'
}, {
  value: '25%',
  label: 'Cost Savings'
}, {
  value: 'Unified',
  label: 'Data Platform'
}];
export function DistrictsPage() {
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,_#f8fafc_0%,_#e2e8f0_100%)] opacity-50"></div>
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
            <div className="inline-flex items-center justify-center p-2 bg-slate-100 rounded-full mb-6 text-slate-700 font-medium text-sm px-4 border border-slate-200">
              <Map className="w-4 h-4 mr-2" />
              For School Districts
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Unified Management for <br />
              <span className="text-blue-600">Your Entire District</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Break down silos between schools. Gain complete visibility and
              control over your district's operations, finances, and academic
              performance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/contact">
                <Button size="lg" className="px-8 py-6 text-lg h-auto shadow-lg shadow-slate-400/20 bg-slate-900 hover:bg-slate-800">
                  Talk to District Specialist
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg h-auto">
                  View Capabilities
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900 text-white">
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
                <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                  {stat.label}
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Orchestrate Success at Scale
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Tools designed specifically for the complexities of multi-school
              administration.
            </p>
          </div>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{
          once: true,
          margin: '-50px'
        }}>
            {features.map((feature, index) => <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-slate-200 group" noPadding>
                  <div className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-6 text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
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
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                Strategic Planning
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Data-Driven District Management
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Move beyond spreadsheets and fragmented systems. Our platform
                aggregates data from every school to give you a clear, real-time
                picture of your district's performance.
              </p>
              <ul className="space-y-4">
                {['Identify underperforming schools instantly', 'Track funding usage across the district', 'Standardize grading and attendance policies', 'Streamline district-wide communication'].map((item, i) => <li key={i} className="flex items-center text-slate-700">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    {item}
                  </li>)}
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="relative h-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-blue-50 opacity-50"></div>
                <div className="text-slate-400 font-medium relative z-10 flex flex-col items-center">
                  <Map className="w-16 h-16 mb-4 text-slate-300" />
                  <span>District Map Overview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-10 bg-cover bg-center"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Unify Your District Today
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            See how our platform can bring efficiency and clarity to your
            district administration.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/contact">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white border-none px-8 py-6 h-auto text-lg w-full sm:w-auto">
                Schedule District Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>;
}