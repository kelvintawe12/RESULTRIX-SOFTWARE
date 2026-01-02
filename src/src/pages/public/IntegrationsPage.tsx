import React from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CheckCircle, Zap, Globe, DollarSign, Mail, MessageSquare, CreditCard, Building2, Smartphone, Cloud } from 'lucide-react';
const integrations = [{
  category: 'Payment Gateways',
  icon: CreditCard,
  color: 'bg-green-100 text-green-600',
  items: [{
    name: 'M-Pesa',
    logo: '💳',
    description: 'Mobile money payments for Kenya',
    status: 'Available'
  }, {
    name: 'PayPal',
    logo: '💰',
    description: 'International payment processing',
    status: 'Available'
  }, {
    name: 'Stripe',
    logo: '💵',
    description: 'Credit card payments worldwide',
    status: 'Available'
  }, {
    name: 'Flutterwave',
    logo: '🌍',
    description: 'African payment gateway',
    status: 'Available'
  }]
}, {
  category: 'Communication',
  icon: MessageSquare,
  color: 'bg-blue-100 text-blue-600',
  items: [{
    name: "Africa's Talking",
    logo: '📱',
    description: 'SMS and voice services for Africa',
    status: 'Available'
  }, {
    name: 'Twilio',
    logo: '💬',
    description: 'Global SMS and communication',
    status: 'Available'
  }, {
    name: 'SendGrid',
    logo: '✉️',
    description: 'Email delivery service',
    status: 'Available'
  }, {
    name: 'Mailgun',
    logo: '📧',
    description: 'Transactional email API',
    status: 'Available'
  }]
}, {
  category: 'Cloud Services',
  icon: Cloud,
  color: 'bg-purple-100 text-purple-600',
  items: [{
    name: 'Google Workspace',
    logo: '🔷',
    description: 'Email, Drive, Calendar integration',
    status: 'Available'
  }, {
    name: 'Microsoft 365',
    logo: '🔶',
    description: 'Office suite integration',
    status: 'Coming Soon'
  }, {
    name: 'AWS S3',
    logo: '☁️',
    description: 'Cloud file storage',
    status: 'Available'
  }, {
    name: 'Cloudinary',
    logo: '🖼️',
    description: 'Image and media management',
    status: 'Available'
  }]
}, {
  category: 'Banking & Finance',
  icon: Building2,
  color: 'bg-indigo-100 text-indigo-600',
  items: [{
    name: 'Equity Bank API',
    logo: '🏦',
    description: 'Direct bank integration (Kenya)',
    status: 'Available'
  }, {
    name: 'KCB Bank API',
    logo: '🏦',
    description: 'Direct bank integration (Kenya)',
    status: 'Coming Soon'
  }, {
    name: 'Pesapal',
    logo: '💳',
    description: 'Payment aggregator',
    status: 'Available'
  }, {
    name: 'iPay',
    logo: '💰',
    description: 'Payment gateway',
    status: 'Available'
  }]
}, {
  category: 'Learning Management',
  icon: Globe,
  color: 'bg-orange-100 text-orange-600',
  items: [{
    name: 'Google Classroom',
    logo: '📚',
    description: 'LMS integration',
    status: 'Coming Soon'
  }, {
    name: 'Moodle',
    logo: '🎓',
    description: 'Open-source LMS',
    status: 'Coming Soon'
  }, {
    name: 'Canvas',
    logo: '🖼️',
    description: 'Learning platform',
    status: 'Planned'
  }, {
    name: 'Zoom',
    logo: '📹',
    description: 'Video conferencing',
    status: 'Available'
  }]
}, {
  category: 'Biometric & Hardware',
  icon: Smartphone,
  color: 'bg-red-100 text-red-600',
  items: [{
    name: 'ZKTeco',
    logo: '👆',
    description: 'Fingerprint attendance',
    status: 'Available'
  }, {
    name: 'RFID Readers',
    logo: '🔖',
    description: 'Card-based attendance',
    status: 'Available'
  }, {
    name: 'QR Code Scanners',
    logo: '📱',
    description: 'Mobile attendance',
    status: 'Available'
  }, {
    name: 'Face Recognition',
    logo: '👤',
    description: 'AI-powered attendance',
    status: 'Planned'
  }]
}];
export function IntegrationsPage() {
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }}>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">
                50+ Integrations
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Works With Your Existing Tools
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              EduMaster seamlessly integrates with the payment gateways,
              communication platforms, and services you already use.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {integrations.map((category, categoryIndex) => <motion.div key={category.category} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: categoryIndex * 0.1
          }}>
                <div className="flex items-center gap-3 mb-8">
                  <div className={`p-3 rounded-xl ${category.color}`}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {category.category}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.items.map((item, itemIndex) => <motion.div key={item.name} initial={{
                opacity: 0,
                scale: 0.9
              }} whileInView={{
                opacity: 1,
                scale: 1
              }} viewport={{
                once: true
              }} transition={{
                delay: itemIndex * 0.05
              }}>
                      <Card className="p-6 hover:shadow-lg transition-shadow h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-4xl">{item.logo}</div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === 'Available' ? 'bg-green-100 text-green-700' : item.status === 'Coming Soon' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            {item.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {item.description}
                        </p>
                      </Card>
                    </motion.div>)}
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* API Access */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Need a Custom Integration?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Our Enterprise plan includes full API access for custom integrations
            with your existing systems.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg">View API Documentation</Button>
            <Button size="lg" variant="outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>;
}