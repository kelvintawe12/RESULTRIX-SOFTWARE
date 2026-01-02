import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { Shield, Users, Lightbulb, Heart, Award, Globe, TrendingUp, CheckCircle, MapPin, Clock, Briefcase, GraduationCap, Target, Zap } from 'lucide-react';
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
const stats = [{
  value: '500+',
  label: 'Schools Partnered'
}, {
  value: '50k+',
  label: 'Students Managed'
}, {
  value: '99.9%',
  label: 'Uptime Guarantee'
}, {
  value: '24/7',
  label: 'Global Support'
}];
const timeline = [{
  year: '2020',
  title: 'The Beginning',
  description: 'Founded by a group of educators and technologists frustrated with legacy systems. Launched MVP in 5 pilot schools.'
}, {
  year: '2021',
  title: 'Rapid Growth',
  description: 'Reached 100 partner schools. Launched the mobile app for parents and teachers. Secured seed funding.'
}, {
  year: '2022',
  title: 'Scaling Up',
  description: 'Series A funding led by EdTech Ventures. Expanded team to 50 employees. Introduced AI-driven analytics.'
}, {
  year: '2023',
  title: 'Global Expansion',
  description: 'Opened London and Singapore offices. Platform localized for 5 new languages. Reached 500+ institutions.'
}, {
  year: '2024',
  title: 'The Future',
  description: 'Launching comprehensive district management tools and advanced predictive modeling for student success.'
}];
const values = [{
  title: 'Student-Centric Innovation',
  description: 'Every feature we build starts with the question: "How does this improve the student experience?"',
  icon: Lightbulb,
  color: 'text-yellow-600',
  bg: 'bg-yellow-50'
}, {
  title: 'Uncompromising Reliability',
  description: 'Schools run 24/7. We maintain 99.9% uptime and bank-grade security because education cannot wait.',
  icon: Shield,
  color: 'text-blue-600',
  bg: 'bg-blue-50'
}, {
  title: 'Empowering Educators',
  description: 'We automate the mundane so teachers can focus on what they do best: inspiring the next generation.',
  icon: GraduationCap,
  color: 'text-indigo-600',
  bg: 'bg-indigo-50'
}, {
  title: 'Radical Transparency',
  description: 'From our pricing to our product roadmap, we believe in building trust through openness.',
  icon: Target,
  color: 'text-green-600',
  bg: 'bg-green-50'
}];
const team = [{
  name: 'Sarah Johnson',
  role: 'CEO & Co-founder',
  bio: 'Former school principal turned tech entrepreneur. Passionate about closing the digital divide in education.',
  initials: 'SJ',
  color: 'bg-blue-100 text-blue-700'
}, {
  name: 'David Chen',
  role: 'CTO',
  bio: 'Ex-Google engineer with 15 years of experience in distributed systems and data security.',
  initials: 'DC',
  color: 'bg-indigo-100 text-indigo-700'
}, {
  name: 'Michael Ross',
  role: 'Head of Product',
  bio: 'Product visionary who led design at top EdTech firms. Obsessed with user experience.',
  initials: 'MR',
  color: 'bg-green-100 text-green-700'
}, {
  name: 'Emily White',
  role: 'VP of Customer Success',
  bio: 'Dedicated to ensuring every school gets maximum value. Built our 24/7 support team from scratch.',
  initials: 'EW',
  color: 'bg-purple-100 text-purple-700'
}, {
  name: 'James Wilson',
  role: 'Head of Engineering',
  bio: 'Scaling expert. Architected systems that handle millions of daily requests with zero downtime.',
  initials: 'JW',
  color: 'bg-orange-100 text-orange-700'
}, {
  name: 'Lisa Patel',
  role: 'Director of Marketing',
  bio: 'Storyteller connecting schools with the tools they need. 10+ years in B2B SaaS marketing.',
  initials: 'LP',
  color: 'bg-pink-100 text-pink-700'
}];
const awards = [{
  name: 'EdTech Innovation Award 2023',
  icon: Award
}, {
  name: 'SOC 2 Type II Certified',
  icon: Shield
}, {
  name: 'GDPR Compliant',
  icon: CheckCircle
}, {
  name: 'Top Rated on Capterra',
  icon: TrendingUp
}];
const offices = [{
  city: 'San Francisco',
  address: 'HQ • Engineering & Product'
}, {
  city: 'London',
  address: 'EMEA Sales & Support'
}, {
  city: 'Singapore',
  address: 'APAC Operations'
}];
export function AboutPage() {
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-slate-900 text-white pt-24 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent"></div>
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
              <Globe className="w-4 h-4 mr-2" />
              Transforming Education Globally
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              We Build the Operating System <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                for Modern Schools
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Our mission is to simplify school administration so educators can
              focus on what truly matters: teaching and inspiring the next
              generation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-12 bg-white border-b border-slate-100 -mt-16 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
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
            }} className="px-4">
                  <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </motion.div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Driven by a Vision of <br />
                <span className="text-blue-600">Educational Excellence</span>
              </h2>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                <p>
                  Founded in 2020, EduMaster began with a simple observation:
                  schools were drowning in paperwork while trying to prepare
                  students for a digital future.
                </p>
                <p>
                  We believe that technology should be an enabler, not a hurdle.
                  By integrating disparate systems—attendance, grading, finance,
                  and communication—into one cohesive platform, we liberate
                  administrators and teachers from administrative burden.
                </p>
                <p>
                  Today, we are proud to partner with institutions ranging from
                  small private academies to large public districts, helping
                  them operate more efficiently and transparently.
                </p>
              </div>
            </motion.div>
            <motion.div initial={{
            opacity: 0,
            x: 30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl transform rotate-3 opacity-10"></div>
              <div className="relative bg-slate-50 rounded-2xl p-8 md:p-12 border border-slate-200 shadow-lg">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <Target className="w-6 h-6 text-blue-600 mr-3" />
                  Our Mission
                </h3>
                <p className="text-xl text-slate-700 italic mb-8">
                  "To empower every educational institution with the tools they
                  need to foster student success, operational efficiency, and
                  community engagement."
                </p>
                <div className="flex flex-wrap gap-4">
                  {awards.map((award, idx) => <div key={idx} className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 text-sm font-medium text-slate-600">
                      <award.icon className="w-4 h-4 text-blue-500 mr-2" />
                      {award.name}
                    </div>)}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-slate-600">
              From a garage startup to a global platform.
            </p>
          </div>
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-slate-200 hidden md:block"></div>

            <div className="space-y-12">
              {timeline.map((item, index) => <motion.div key={index} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} className={`flex flex-col md:flex-row items-center justify-between ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className="flex-1 w-full md:w-auto"></div>
                  <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold shadow-lg my-4 md:my-0 mx-auto md:mx-0 shrink-0">
                    {item.year}
                  </div>
                  <div className="flex-1 w-full md:w-auto p-4">
                    <Card className={`h-full hover:shadow-md transition-shadow ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'} text-center`} noPadding>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-slate-600">{item.description}</p>
                      </div>
                    </Card>
                  </div>
                </motion.div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              These principles guide every line of code we write and every
              customer interaction we have.
            </p>
          </div>
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{
          once: true
        }}>
            {values.map((value, index) => <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-slate-200 group" noPadding>
                  <div className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-2xl ${value.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <value.icon className={`h-8 w-8 ${value.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {value.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {value.description}
                    </p>
                  </div>
                </Card>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Meet Our Leadership
            </h2>
            <p className="text-lg text-slate-600">
              A diverse team of educators, engineers, and visionaries.
            </p>
          </div>
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{
          once: true
        }}>
            {team.map((member, index) => <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden group" noPadding>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${member.color} shadow-inner`}>
                        {member.initials}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {member.name}
                        </h3>
                        <p className="text-blue-600 font-medium text-sm">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {member.bio}
                    </p>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
                        <Briefcase className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* Global Presence & Culture */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Global Presence
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                We operate globally with a distributed team and key hubs in
                major cities to support our international customer base.
              </p>
              <div className="space-y-4">
                {offices.map((office, index) => <div key={index} className="flex items-start p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <MapPin className="w-6 h-6 text-blue-600 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {office.city}
                      </h4>
                      <p className="text-slate-600 text-sm">{office.address}</p>
                    </div>
                  </div>)}
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Life at EduMaster
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                We're building a culture of curiosity, collaboration, and
                impact. We believe in flexible work, continuous learning, and
                solving hard problems.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {['Remote-First', 'Learning Budget', 'Health & Wellness', 'Equity Options'].map((benefit, i) => <div key={i} className="flex items-center text-slate-700 font-medium">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    {benefit}
                  </div>)}
              </div>
              <Link to="/careers">
                <Button variant="outline" className="w-full sm:w-auto">
                  View Open Positions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] opacity-10 bg-cover bg-center"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Join Us on Our Mission
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Whether you're a school looking to modernize or a talent looking to
            make an impact, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white border-none px-8 py-6 h-auto text-lg w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="text-white border-slate-600 hover:bg-slate-800 hover:text-white px-8 py-6 h-auto text-lg w-full sm:w-auto">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>;
}