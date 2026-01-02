import React, { useEffect, useState, Component } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { CheckCircle, AlertCircle, XCircle, Activity, Database, Lock, HardDrive, Globe, Clock } from 'lucide-react';
interface ComponentStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  icon: any;
}
interface Incident {
  id: string;
  title: string;
  status: 'resolved' | 'investigating' | 'monitoring';
  date: string;
  description: string;
}
export function StatusPage() {
  const [components, setComponents] = useState<ComponentStatus[]>([{
    name: 'API',
    status: 'operational',
    icon: Activity
  }, {
    name: 'Database',
    status: 'operational',
    icon: Database
  }, {
    name: 'Authentication',
    status: 'operational',
    icon: Lock
  }, {
    name: 'File Storage',
    status: 'operational',
    icon: HardDrive
  }, {
    name: 'Web Application',
    status: 'operational',
    icon: Globe
  }]);
  const [uptime, setUptime] = useState(99.9);
  const incidents: Incident[] = [{
    id: '1',
    title: 'Scheduled Maintenance - Database Optimization',
    status: 'resolved',
    date: 'Mar 10, 2024',
    description: 'Routine database maintenance completed successfully. No data loss occurred.'
  }];
  const upcomingMaintenance = [{
    id: '1',
    title: 'Security Updates',
    date: 'Mar 25, 2024',
    time: '02:00 AM - 04:00 AM UTC',
    impact: 'Minimal downtime expected'
  }];
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5" />;
      case 'down':
        return <XCircle className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };
  const overallStatus = components.every(c => c.status === 'operational') ? 'operational' : components.some(c => c.status === 'down') ? 'down' : 'degraded';
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              System Status
            </h1>
            <p className="text-xl text-slate-300">
              Real-time status and uptime monitoring for EduMaster services
            </p>
          </motion.div>
        </div>
      </section>

      {/* Overall Status */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className={`rounded-2xl p-8 text-center ${overallStatus === 'operational' ? 'bg-green-50 border-2 border-green-200' : overallStatus === 'degraded' ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${overallStatus === 'operational' ? 'bg-green-100' : overallStatus === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'}`}>
              {overallStatus === 'operational' ? <CheckCircle className="h-8 w-8 text-green-600" /> : overallStatus === 'degraded' ? <AlertCircle className="h-8 w-8 text-yellow-600" /> : <XCircle className="h-8 w-8 text-red-600" />}
            </div>
            <h2 className={`text-3xl font-bold mb-2 ${overallStatus === 'operational' ? 'text-green-900' : overallStatus === 'degraded' ? 'text-yellow-900' : 'text-red-900'}`}>
              {overallStatus === 'operational' ? '🟢 All Systems Operational' : overallStatus === 'degraded' ? '🟡 Degraded Performance' : '🔴 System Outage'}
            </h2>
            <p className="text-slate-600">
              Last updated: {new Date().toLocaleString()}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Component Status */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            Component Status
          </h2>
          <div className="space-y-4">
            {components.map((component, index) => <motion.div key={component.name} initial={{
            opacity: 0,
            x: -20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="bg-slate-50 rounded-xl p-6 flex items-center justify-between border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <component.icon className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {component.name}
                    </h3>
                    <p className="text-sm text-slate-500">Core service</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(component.status)}`}>
                  {getStatusIcon(component.status)}
                  <span className="font-medium capitalize">
                    {component.status}
                  </span>
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Uptime Statistics */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            Uptime Statistics
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {uptime}%
              </div>
              <p className="text-slate-600">Uptime This Month</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                99.95%
              </div>
              <p className="text-slate-600">Last 90 Days</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                99.9%
              </div>
              <p className="text-slate-600">All Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Maintenance */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            Upcoming Maintenance
          </h2>
          {upcomingMaintenance.length > 0 ? <div className="space-y-4">
              {upcomingMaintenance.map(maintenance => <div key={maintenance.id} className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {maintenance.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-2">
                        <strong>Scheduled:</strong> {maintenance.date} at{' '}
                        {maintenance.time}
                      </p>
                      <p className="text-sm text-slate-600">
                        <strong>Expected Impact:</strong> {maintenance.impact}
                      </p>
                    </div>
                  </div>
                </div>)}
            </div> : <p className="text-slate-500">
              No scheduled maintenance at this time.
            </p>}
        </div>
      </section>

      {/* Incident History */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            Recent Incidents
          </h2>
          {incidents.length > 0 ? <div className="space-y-4">
              {incidents.map(incident => <div key={incident.id} className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">
                      {incident.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${incident.status === 'resolved' ? 'bg-green-100 text-green-700' : incident.status === 'monitoring' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {incident.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    {incident.description}
                  </p>
                  <p className="text-xs text-slate-400">{incident.date}</p>
                </div>)}
            </div> : <p className="text-slate-500">
              No incidents in the last 30 days. 🎉
            </p>}
        </div>
      </section>

      {/* Subscribe to Updates */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Stay Informed
          </h2>
          <p className="text-slate-600 mb-6">
            Subscribe to receive notifications about system status and scheduled
            maintenance.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </PublicLayout>;
}