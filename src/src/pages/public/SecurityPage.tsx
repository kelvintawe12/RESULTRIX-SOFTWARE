import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Shield, Lock, Database, Eye, Key, Server, CheckCircle } from 'lucide-react';
const features = [{
  title: 'End-to-End Encryption',
  description: 'All data is encrypted in transit and at rest using industry-standard AES-256 encryption.',
  icon: Lock
}, {
  title: 'Daily Backups',
  description: 'Automated backups ensure your data is never lost, with point-in-time recovery options.',
  icon: Database
}, {
  title: 'Access Control',
  description: 'Granular role-based permissions ensure users only see what they need to see.',
  icon: Key
}, {
  title: 'Audit Logs',
  description: 'Comprehensive logging of all system activities for accountability and compliance.',
  icon: Eye
}, {
  title: 'Two-Factor Auth',
  description: 'Add an extra layer of security to user accounts with 2FA support.',
  icon: Shield
}, {
  title: '24/7 Monitoring',
  description: 'Continuous system monitoring to detect and prevent threats in real-time.',
  icon: Server
}];
const compliances = ['GDPR Compliant', 'FERPA Compliant', 'SOC 2 Type II', 'ISO 27001 Certified'];
export function SecurityPage() {
  return <>
      {/* Hero */}
      <section className="bg-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent"></div>
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 text-center">
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.6
        }}>
            <div className="inline-flex items-center justify-center p-3 bg-blue-500/20 rounded-full mb-8">
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Security & Compliance
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              We take the responsibility of protecting your school's data
              seriously. Our platform is built with security at its core.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" initial="hidden" whileInView="visible" viewport={{
          once: true
        }} variants={{
          hidden: {
            opacity: 0
          },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}>
            {features.map((feature, index) => <motion.div key={index} variants={{
            hidden: {
              opacity: 0,
              y: 20
            },
            visible: {
              opacity: 1,
              y: 0
            }
          }}>
                <Card className="h-full border-slate-200 hover:border-blue-300 transition-colors" noPadding>
                  <div className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
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

      {/* Compliance */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">
            Compliance Standards
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {compliances.map((item, index) => <motion.div key={index} className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center" initial={{
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
                <CheckCircle className="h-10 w-10 text-green-500 mb-4" />
                <span className="font-bold text-slate-800">{item}</span>
              </motion.div>)}
          </div>
          <div className="mt-16 bg-blue-600 rounded-2xl p-8 md:p-12 text-white text-left flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">
                Have security questions?
              </h3>
              <p className="text-blue-100">
                Download our detailed security whitepaper or contact our
                security team.
              </p>
            </div>
            <div className="flex gap-4">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Download Whitepaper
              </button>
            </div>
          </div>
        </div>
      </section>
    </>;
}