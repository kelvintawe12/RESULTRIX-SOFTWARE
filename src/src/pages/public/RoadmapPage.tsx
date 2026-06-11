import React, { useState, Children } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { CheckCircle, Clock, Lightbulb, Rocket, Calendar, Users, Smartphone, BarChart, MessageSquare, Video, ThumbsUp, Sparkles, Zap, TrendingUp, Send } from 'lucide-react';
const roadmapItems = [{
  quarter: 'Q1 2024',
  status: 'completed',
  items: [{
    title: 'Advanced Analytics Dashboard',
    icon: BarChart,
    votes: 245,
    description: 'Comprehensive data visualization with custom reports and real-time insights'
  }, {
    title: 'Bulk Report Generation',
    icon: CheckCircle,
    votes: 189,
    description: 'Generate report cards for entire classes in one click'
  }, {
    title: 'Email Templates System',
    icon: MessageSquare,
    votes: 156,
    description: 'Pre-built templates for common school communications'
  }, {
    title: 'Audit Logging',
    icon: CheckCircle,
    votes: 134,
    description: 'Complete activity tracking for compliance and security'
  }]
}, {
  quarter: 'Q2 2024',
  status: 'in-progress',
  items: [{
    title: 'Parent Mobile App (iOS & Android)',
    icon: Smartphone,
    votes: 567,
    description: 'Native mobile apps for parents to track student progress on the go'
  }, {
    title: 'Automated Timetable Generator',
    icon: Calendar,
    votes: 423,
    description: 'AI-powered scheduling that optimizes teacher and room allocation'
  }, {
    title: 'QR Code Attendance',
    icon: CheckCircle,
    votes: 389,
    description: 'Fast, contactless attendance tracking using QR codes'
  }, {
    title: 'Video Conferencing Integration',
    icon: Video,
    votes: 298,
    description: 'Built-in video calls for remote learning and parent meetings'
  }]
}, {
  quarter: 'Q3 2024',
  status: 'planned',
  items: [{
    title: 'AI-Powered Grade Predictions',
    icon: Lightbulb,
    votes: 445,
    description: 'Predict student performance and identify at-risk students early'
  }, {
    title: 'Bulk SMS Notifications',
    icon: MessageSquare,
    votes: 398,
    description: 'Send mass SMS alerts to parents and staff instantly'
  }, {
    title: 'Student Performance Analytics',
    icon: BarChart,
    votes: 367,
    description: 'Deep insights into individual and class performance trends'
  }, {
    title: 'Library Management Module',
    icon: CheckCircle,
    votes: 234,
    description: 'Track books, manage checkouts, and automate overdue notices'
  }]
}, {
  quarter: 'Q4 2024',
  status: 'planned',
  items: [{
    title: 'Transport Management',
    icon: Rocket,
    votes: 289,
    description: 'Route planning, GPS tracking, and parent notifications for school buses'
  }, {
    title: 'Hostel/Dormitory Management',
    icon: Users,
    votes: 256,
    description: 'Room allocation, visitor logs, and facility maintenance tracking'
  }, {
    title: 'Alumni Portal',
    icon: Users,
    votes: 198,
    description: 'Stay connected with graduates and manage alumni relations'
  }, {
    title: 'Advanced Reporting Engine',
    icon: BarChart,
    votes: 176,
    description: 'Custom report builder with drag-and-drop interface'
  }]
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
export function RoadmapPage() {
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'planned'>('all');
  const [votedItems, setVotedItems] = useState<Set<string>>(new Set());
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);
  const [featureRequest, setFeatureRequest] = useState({
    title: '',
    description: ''
  });
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-emerald-500',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          icon: CheckCircle,
          label: 'Completed'
        };
      case 'in-progress':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: Clock,
          label: 'In Progress'
        };
      case 'planned':
        return {
          color: 'bg-purple-500',
          textColor: 'text-purple-700',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          icon: Lightbulb,
          label: 'Planned'
        };
      default:
        return {
          color: 'bg-slate-500',
          textColor: 'text-slate-700',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          icon: Rocket,
          label: 'Unknown'
        };
    }
  };
  const filteredRoadmap = roadmapItems.filter(item => filter === 'all' || item.status === filter);
  const handleVote = (quarter: string, itemTitle: string) => {
    const key = `${quarter}-${itemTitle}`;
    setVotedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };
  const handleFeatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Feature request submitted: ${featureRequest.title}`);
    setFeatureRequest({
      title: '',
      description: ''
    });
    setShowFeatureRequest(false);
  };
  return <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div className="text-center max-w-4xl mx-auto" initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                Building the Future of Education
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Product Roadmap
            </h1>
            <p className="text-xl text-indigo-100 leading-relaxed">
              See what we're building next. Vote on features you want and help
              shape the future of EduMaster.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="bg-white border-b border-slate-200 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[{
              value: 'all',
              label: 'All Features',
              icon: Rocket
            }, {
              value: 'completed',
              label: 'Completed',
              icon: CheckCircle
            }, {
              value: 'in-progress',
              label: 'In Progress',
              icon: Clock
            }, {
              value: 'planned',
              label: 'Planned',
              icon: Lightbulb
            }].map(tab => {
              const Icon = tab.icon;
              return <button key={tab.value} onClick={() => setFilter(tab.value as any)} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${filter === tab.value ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>;
            })}
            </div>
            <Button onClick={() => setShowFeatureRequest(true)} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg">
              <Lightbulb className="h-4 w-4 mr-2" />
              Request Feature
            </Button>
          </div>
        </div>
      </section>

      {/* Roadmap Timeline */}
      <section className="py-20 bg-slate-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="space-y-16">
            {filteredRoadmap.map((quarter, index) => {
            const config = getStatusConfig(quarter.status);
            const StatusIcon = config.icon;
            return <motion.div key={quarter.quarter} initial="hidden" whileInView="visible" viewport={{
              once: true,
              margin: '-50px'
            }} variants={staggerContainer}>
                  {/* Quarter Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`flex items-center gap-3 px-6 py-3 rounded-full border-2 ${config.borderColor} ${config.bgColor} shadow-sm`}>
                      <StatusIcon className={`h-5 w-5 ${config.textColor}`} />
                      <span className={`font-bold text-lg ${config.textColor}`}>
                        {quarter.quarter}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent" />
                  </div>

                  {/* Feature Cards */}
                  <motion.div className="grid md:grid-cols-2 gap-6" variants={staggerContainer}>
                    {quarter.items.map((item, itemIndex) => {
                  const ItemIcon = item.icon;
                  const voteKey = `${quarter.quarter}-${item.title}`;
                  const isVoted = votedItems.has(voteKey);
                  return <motion.div key={item.title} variants={fadeInUp} className="group">
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all h-full flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                              <div className={`p-3 rounded-xl ${config.bgColor} group-hover:scale-110 transition-transform`}>
                                <ItemIcon className={`h-6 w-6 ${config.textColor}`} />
                              </div>
                              <button onClick={() => handleVote(quarter.quarter, item.title)} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${isVoted ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                <ThumbsUp className={`h-4 w-4 ${isVoted ? 'fill-current' : ''}`} />
                                <span>{item.votes + (isVoted ? 1 : 0)}</span>
                              </button>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                              {item.title}
                            </h3>

                            <p className="text-slate-600 leading-relaxed flex-grow mb-4">
                              {item.description}
                            </p>

                            <div className={`flex items-center gap-2 text-sm font-medium ${config.textColor}`}>
                              <div className={`w-2 h-2 rounded-full ${config.color}`} />
                              {config.label}
                            </div>
                          </div>
                        </motion.div>;
                })}
                  </motion.div>
                </motion.div>;
          })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[{
            icon: Rocket,
            value: '24',
            label: 'Features Shipped',
            color: 'text-blue-600'
          }, {
            icon: Clock,
            value: '4',
            label: 'In Progress',
            color: 'text-purple-600'
          }, {
            icon: TrendingUp,
            value: '12',
            label: 'Planned',
            color: 'text-pink-600'
          }, {
            icon: Users,
            value: '2.3k',
            label: 'Total Votes',
            color: 'text-emerald-600'
          }].map((stat, index) => {
            const Icon = stat.icon;
            return <motion.div key={stat.label} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} className="flex flex-col items-center">
                  <Icon className={`h-8 w-8 ${stat.color} mb-3`} />
                  <div className="text-4xl font-bold text-slate-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    {stat.label}
                  </div>
                </motion.div>;
          })}
          </div>
        </div>
      </section>

      {/* Feature Request Modal */}
      {showFeatureRequest && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Request a Feature
                </h2>
              </div>
              <button onClick={() => setShowFeatureRequest(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFeatureSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Feature Title *
                </label>
                <input type="text" required value={featureRequest.title} onChange={e => setFeatureRequest({
              ...featureRequest,
              title: e.target.value
            })} placeholder="e.g., Student Behavior Tracking" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <textarea required rows={4} value={featureRequest.description} onChange={e => setFeatureRequest({
              ...featureRequest,
              description: e.target.value
            })} placeholder="Describe the feature and how it would help your school..." className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowFeatureRequest(false)} className="px-6">
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <Zap className="h-12 w-12 mx-auto mb-6 text-yellow-300" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Want to Influence Our Roadmap?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join our community and vote on features that matter most to you.
          </p>
          <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold shadow-xl">
            Join Community
          </Button>
        </div>
      </section>
    </>;
}