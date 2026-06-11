import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Sparkles, Bug, Wrench, Shield, Zap, Calendar } from 'lucide-react';
const releases = [{
  version: '2.5.0',
  date: 'March 15, 2024',
  type: 'major',
  changes: [{
    type: 'feature',
    icon: Sparkles,
    text: 'New Parent Portal with real-time grade tracking'
  }, {
    type: 'feature',
    icon: Sparkles,
    text: 'Advanced Analytics Dashboard for school admins'
  }, {
    type: 'feature',
    icon: Sparkles,
    text: 'Bulk student enrollment via CSV import'
  }, {
    type: 'improvement',
    icon: Wrench,
    text: 'Improved report card generation speed by 60%'
  }, {
    type: 'fix',
    icon: Bug,
    text: 'Fixed fee calculation rounding errors'
  }]
}, {
  version: '2.4.2',
  date: 'February 28, 2024',
  type: 'minor',
  changes: [{
    type: 'improvement',
    icon: Wrench,
    text: 'Enhanced mobile responsiveness across all pages'
  }, {
    type: 'improvement',
    icon: Zap,
    text: 'Faster page load times (30% improvement)'
  }, {
    type: 'fix',
    icon: Bug,
    text: 'Resolved email notification delivery issues'
  }, {
    type: 'fix',
    icon: Bug,
    text: 'Fixed timezone display inconsistencies'
  }]
}, {
  version: '2.4.0',
  date: 'February 10, 2024',
  type: 'major',
  changes: [{
    type: 'feature',
    icon: Sparkles,
    text: 'Email template system for automated communications'
  }, {
    type: 'feature',
    icon: Sparkles,
    text: 'Audit logging for all administrative actions'
  }, {
    type: 'security',
    icon: Shield,
    text: 'Enhanced encryption for student data'
  }, {
    type: 'improvement',
    icon: Wrench,
    text: 'Redesigned fee structure management interface'
  }]
}, {
  version: '2.3.5',
  date: 'January 25, 2024',
  type: 'patch',
  changes: [{
    type: 'fix',
    icon: Bug,
    text: 'Fixed marks entry validation errors'
  }, {
    type: 'fix',
    icon: Bug,
    text: 'Resolved PDF export formatting issues'
  }, {
    type: 'improvement',
    icon: Wrench,
    text: 'Improved search performance in student lists'
  }]
}, {
  version: '2.3.0',
  date: 'January 10, 2024',
  type: 'major',
  changes: [{
    type: 'feature',
    icon: Sparkles,
    text: 'Teacher assignment bulk operations'
  }, {
    type: 'feature',
    icon: Sparkles,
    text: 'Student subject enrollment management'
  }, {
    type: 'feature',
    icon: Sparkles,
    text: 'Class master sheet generation'
  }, {
    type: 'security',
    icon: Shield,
    text: 'Two-factor authentication for admin accounts'
  }]
}];
const getTypeColor = (type: string) => {
  switch (type) {
    case 'feature':
      return 'bg-green-100 text-green-700';
    case 'improvement':
      return 'bg-blue-100 text-blue-700';
    case 'fix':
      return 'bg-orange-100 text-orange-700';
    case 'security':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};
const getVersionBadge = (type: string) => {
  switch (type) {
    case 'major':
      return 'bg-indigo-600 text-white';
    case 'minor':
      return 'bg-blue-600 text-white';
    case 'patch':
      return 'bg-slate-600 text-white';
    default:
      return 'bg-slate-600 text-white';
  }
};
export function ChangelogPage() {
  return <>
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Changelog</h1>
            <p className="text-xl text-slate-300">
              Track every update, improvement, and fix we ship. We're constantly
              improving EduMaster based on your feedback.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Releases Timeline */}
      <section className="py-20 bg-slate-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="space-y-8">
            {releases.map((release, index) => <motion.div key={release.version} initial={{
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
                <Card className="p-8 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-slate-900">
                          Version {release.version}
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getVersionBadge(release.type)}`}>
                          {release.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">{release.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {release.changes.map((change, changeIndex) => <div key={changeIndex} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className={`p-2 rounded-lg ${getTypeColor(change.type)}`}>
                          <change.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-700">{change.text}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(change.type)}`}>
                          {change.type}
                        </span>
                      </div>)}
                  </div>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Stay Updated
          </h2>
          <p className="text-slate-600 mb-6">
            Subscribe to receive notifications about new releases and updates.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </>;
}