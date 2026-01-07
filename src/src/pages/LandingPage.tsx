import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, School, GraduationCap, DollarSign, User, CheckCircle, ArrowRight, BarChart, Lock, Users, BookOpen, Clock, TrendingUp, FileText, Settings, PieChart, CreditCard, Globe, Zap, MessageSquare, Calendar, Lightbulb, Handshake, Calculator, Activity, ExternalLink } from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/public/Footer';
import { Button } from '../components/ui/Button';
// Animation Variants
const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 40
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
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
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};
const scaleIn = {
  hidden: {
    opacity: 0,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};
const slideInLeft = {
  hidden: {
    opacity: 0,
    x: -50
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};
const slideInRight = {
  hidden: {
    opacity: 0,
    x: 50
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};
export function LandingPage() {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-slate-900 font-sans text-white flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-grow">
        {/* 1. HERO SECTION: Branded Dark Background */}
        <section className="bg-slate-900 text-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                School Management
              </h1>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8">
                The all-in-one platform that transforms how you manage your institution. From admissions to alumni, we handle the complexity so you can focus on education.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
                <Button size="lg" onClick={() => navigate('/signup')} className="bg-white text-indigo-600 hover:bg-indigo-50 border-0">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/demo')} className="border-indigo-200 text-white hover:bg-indigo-700">
                  Book a Demo
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-indigo-400/20">
                {[{
                  label: 'Active Schools',
                  value: '500+'
                }, {
                  label: 'Students Managed',
                  value: '50k+'
                }, {
                  label: 'Uptime SLA',
                  value: '99.9%'
                }, {
                  label: 'Countries',
                  value: '12+'
                }].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-4xl font-bold text-indigo-400 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-200 font-medium uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 2. QUICK NAVIGATION TO PUBLIC PAGES */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Explore EduMaster
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Discover everything our platform has to offer
              </p>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={staggerContainer}>
              {[{
              icon: <Zap className="h-6 w-6" />,
              title: 'Features',
              description: 'Explore our comprehensive feature set',
              link: '/features',
              color: 'from-blue-500 to-indigo-500'
            }, {
              icon: <CreditCard className="h-6 w-6" />,
              title: 'Pricing',
              description: 'Simple, transparent pricing plans',
              link: '/pricing',
              color: 'from-emerald-500 to-teal-500'
            }, {
              icon: <Globe className="h-6 w-6" />,
              title: 'Integrations',
              description: '50+ integrations with your tools',
              link: '/integrations',
              color: 'from-purple-500 to-pink-500'
            }, {
              icon: <Shield className="h-6 w-6" />,
              title: 'Security',
              description: 'Enterprise-grade data protection',
              link: '/security',
              color: 'from-orange-500 to-red-500'
            }, {
              icon: <FileText className="h-6 w-6" />,
              title: 'Case Studies',
              description: 'Success stories from real schools',
              link: '/case-studies',
              color: 'from-cyan-500 to-blue-500'
            }, {
              icon: <MessageSquare className="h-6 w-6" />,
              title: 'Blog',
              description: 'Latest insights and updates',
              link: '/blog',
              color: 'from-violet-500 to-purple-500'
            }, {
              icon: <Lightbulb className="h-6 w-6" />,
              title: 'Roadmap',
              description: 'See what we are building next',
              link: '/roadmap',
              color: 'from-amber-500 to-orange-500'
            }, {
              icon: <Calculator className="h-6 w-6" />,
              title: 'Free Tools',
              description: 'Calculators and templates',
              link: '/tools',
              color: 'from-pink-500 to-rose-500'
            }].map((item, index) => <motion.div key={index} variants={scaleIn}>
                  <Link to={item.link} className="block h-full bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600">{item.description}</p>
                    <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </Link>
                </motion.div>)}
            </motion.div>
          </div>
        </section>

        {/* 3. PLATFORM OVERVIEW */}
        <section className="py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="max-w-3xl mx-auto text-center mb-20" initial="hidden" whileInView="visible" viewport={{
            once: true,
            margin: '-100px'
          }} variants={fadeInUp}>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                One Platform, Infinite Possibilities
              </h2>
              <p className="text-xl text-slate-600">
                Replace disconnected tools with a single, cohesive operating
                system designed for modern education.
              </p>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-12" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={staggerContainer}>
              {[{
              icon: <Settings className="h-6 w-6 text-white" />,
              bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
              title: 'Operational Excellence',
              description: 'Automate complex workflows from admissions to graduation with precision.'
            }, {
              icon: <TrendingUp className="h-6 w-6 text-white" />,
              bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
              title: 'Financial Clarity',
              description: 'Real-time tracking of fees, expenses, and payroll with instant reports.'
            }, {
              icon: <PieChart className="h-6 w-6 text-white" />,
              bg: 'bg-gradient-to-br from-purple-500 to-violet-600',
              title: 'Academic Insights',
              description: 'Data-driven decisions with advanced analytics on performance and growth.'
            }].map((item, index) => <motion.div key={index} variants={fadeInUp}>
                  <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 shadow-lg`}>
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    {item.description}
                  </p>
                </motion.div>)}
            </motion.div>
          </div>
        </section>

        {/* 4. ROLES & CAPABILITIES */}
        <section className="py-32 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center max-w-3xl mx-auto mb-20" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Built for Every Stakeholder
              </h2>
              <p className="text-lg text-slate-600">
                A tailored experience for everyone in your school community.
              </p>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={staggerContainer}>
              {[{
              role: 'Super Admin',
              icon: <Shield className="h-5 w-5" />,
              desc: 'Global oversight',
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              border: 'border-purple-100'
            }, {
              role: 'School Admin',
              icon: <School className="h-5 w-5" />,
              desc: 'Operations',
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              border: 'border-blue-100'
            }, {
              role: 'Teacher',
              icon: <GraduationCap className="h-5 w-5" />,
              desc: 'Classroom',
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              border: 'border-emerald-100'
            }, {
              role: 'Bursar',
              icon: <DollarSign className="h-5 w-5" />,
              desc: 'Finance',
              color: 'text-amber-600',
              bg: 'bg-amber-50',
              border: 'border-amber-100'
            }, {
              role: 'Student',
              icon: <User className="h-5 w-5" />,
              desc: 'Learning',
              color: 'text-pink-600',
              bg: 'bg-pink-50',
              border: 'border-pink-100'
            }].map((card, index) => <motion.div key={index} variants={scaleIn}>
                  <div className={`bg-white p-6 rounded-2xl border ${card.border} shadow-sm h-full`}>
                    <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
                      {card.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {card.role}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {card.desc}
                    </p>
                  </div>
                </motion.div>)}
            </motion.div>
          </div>
        </section>

        {/* 5. BENEFITS GRID */}
        <section className="py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-20" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Why Top Institutions Choose Us
              </h2>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={staggerContainer}>
              {[{
              icon: <Clock />,
              title: 'Save 20+ Hours/Week',
              desc: 'Automate repetitive tasks like attendance and grading.'
            }, {
              icon: <CheckCircle />,
              title: 'Zero Errors',
              desc: 'Eliminate manual data entry mistakes.'
            }, {
              icon: <BarChart />,
              title: 'Real-time Insights',
              desc: 'Make decisions based on live data.'
            }, {
              icon: <Users />,
              title: 'Better Engagement',
              desc: 'Keep parents and students connected.'
            }, {
              icon: <Globe />,
              title: 'Access Anywhere',
              desc: 'Cloud-based, accessible from any device.'
            }, {
              icon: <Lock />,
              title: 'Enterprise Security',
              desc: 'Bank-grade encryption keeps data safe.'
            }].map((benefit, index) => <motion.div key={index} variants={fadeInUp} className="flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-600">{benefit.desc}</p>
                  </div>
                </motion.div>)}
            </motion.div>
          </div>
        </section>

        {/* 6. RESOURCES & SUPPORT SECTION */}
        <section className="py-32 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Resources & Support
              </h2>
              <p className="text-lg text-slate-600">
                Everything you need to succeed with EduMaster
              </p>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={staggerContainer}>
              {[{
              icon: <MessageSquare className="h-6 w-6" />,
              title: 'Help Center',
              description: 'Get answers to common questions',
              link: '/faq',
              linkText: 'View FAQ'
            }, {
              icon: <Handshake className="h-6 w-6" />,
              title: 'Partner Program',
              description: 'Join our reseller network',
              link: '/partners',
              linkText: 'Learn More'
            }, {
              icon: <Activity className="h-6 w-6" />,
              title: 'System Status',
              description: 'Real-time platform health',
              link: '/status',
              linkText: 'Check Status'
            }].map((item, index) => <motion.div key={index} variants={scaleIn}>
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all h-full flex flex-col">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 mb-6 flex-grow">
                      {item.description}
                    </p>
                    <Link to={item.link} className="text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-2">
                      {item.linkText} <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.div>)}
            </motion.div>
          </div>
        </section>

        {/* 7. FINAL CTA */}
        <section className="py-32 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={fadeInUp} className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold mb-8">
                Ready to Transform Your Institution?
              </h2>
              <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
                Join hundreds of forward-thinking schools that have modernized
                their operations. Start your 14-day free trial today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button size="lg" onClick={() => navigate('/signup')} className="px-12 py-8 text-lg bg-white text-indigo-900 hover:bg-blue-50 font-bold shadow-2xl">
                  Get Started Now
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/contact')} className="px-12 py-8 text-lg border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                  Contact Sales
                </Button>
              </div>
              <p className="mt-8 text-sm text-blue-200/80">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
}