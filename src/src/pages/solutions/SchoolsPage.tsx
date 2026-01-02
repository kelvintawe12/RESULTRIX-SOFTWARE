import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Calendar, MessageCircle, DollarSign, Award, Clock, CheckCircle, ArrowRight, School } from 'lucide-react';
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
  title: 'Student Profiles',
  description: 'Comprehensive digital records for every student, including academic history, medical info, and family contacts.',
  icon: Users
}, {
  title: 'Grade Management',
  description: 'Flexible grading systems that support various curriculums, with automated report card generation.',
  icon: Award
}, {
  title: 'Parent Portal',
  description: 'Keep parents engaged with real-time access to attendance, grades, and school announcements.',
  icon: MessageCircle
}, {
  title: 'Attendance Tracking',
  description: 'Effortless daily attendance taking for teachers with instant notifications for absent students.',
  icon: Calendar
}, {
  title: 'Fee Collection',
  description: 'Automated invoicing and online payment processing to streamline school finances.',
  icon: DollarSign
}, {
  title: 'Lesson Planning',
  description: 'Digital tools for teachers to plan lessons, share resources, and track curriculum progress.',
  icon: BookOpen
}];
const stats = [{
  value: '30%',
  label: 'Reduction in Admin Time'
}, {
  value: '95%',
  label: 'Parent Satisfaction'
}, {
  value: '15%',
  label: 'Improvement in Attendance'
}, {
  value: '100%',
  label: 'Paperless Operations'
}];
export function SchoolsPage() {
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-70"></div>
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
            <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-full mb-6 text-blue-600 font-medium text-sm px-4 border border-blue-100">
              <School className="w-4 h-4 mr-2" />
              For K-12 Schools
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Empower Your School with <br />
              <span className="text-blue-600">Modern Management</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Streamline administrative tasks, enhance teacher productivity, and
              improve student outcomes with our all-in-one platform designed
              specifically for K-12 education.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="px-8 py-6 text-lg h-auto shadow-lg shadow-blue-500/20">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg h-auto">
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
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
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">
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
              Everything You Need to Run Your School
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From the front office to the classroom, our tools are built to
              handle the unique challenges of K-12 education.
            </p>
          </div>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{
          once: true,
          margin: '-50px'
        }}>
            {features.map((feature, index) => <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-slate-200 group" noPadding>
                  <div className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
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
              <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
                Teacher Focused
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Give Teachers More Time to Teach
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Reduce administrative burden on your teaching staff. Our
                intuitive tools for attendance, grading, and lesson planning
                save teachers an average of 5 hours per week.
              </p>
              <ul className="space-y-4">
                {['Automated attendance reports', 'One-click grade book calculations', 'Easy resource sharing with students', 'Direct messaging with parents'].map((item, i) => <li key={i} className="flex items-center text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    {item}
                  </li>)}
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="relative h-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 opacity-50"></div>
                <div className="text-slate-400 font-medium relative z-10 flex flex-col items-center">
                  <Clock className="w-16 h-16 mb-4 text-green-200" />
                  <span>Teacher Dashboard Preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-10 bg-cover bg-center"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join thousands of schools that have modernized their operations with
            our platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white border-none px-8 py-6 h-auto text-lg w-full sm:w-auto">
                Get Started Now
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="text-white border-slate-600 hover:bg-slate-800 hover:text-white px-8 py-6 h-auto text-lg w-full sm:w-auto">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>;
}