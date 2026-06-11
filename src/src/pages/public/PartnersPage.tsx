import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Handshake, TrendingUp, Users, Award, DollarSign, Headphones, BookOpen, Zap, CheckCircle } from 'lucide-react';
const benefits = [{
  icon: DollarSign,
  title: 'Competitive Commission',
  description: 'Earn up to 25% recurring commission on every school you refer'
}, {
  icon: Headphones,
  title: 'Dedicated Support',
  description: 'Priority support channel and dedicated partner success manager'
}, {
  icon: BookOpen,
  title: 'Marketing Resources',
  description: 'Access to co-branded materials, case studies, and sales collateral'
}, {
  icon: Zap,
  title: 'Early Access',
  description: 'Get early access to new features and beta programs'
}, {
  icon: Award,
  title: 'Partner Certification',
  description: 'Official EduMaster partner badge and certification program'
}, {
  icon: Users,
  title: 'Co-Marketing',
  description: 'Joint webinars, events, and marketing campaigns'
}];
const partnerTypes = [{
  title: 'Reseller Partners',
  description: 'Sell EduMaster directly to schools in your region',
  ideal: 'Education consultants, IT companies, system integrators',
  commission: '20-25%'
}, {
  title: 'Referral Partners',
  description: 'Refer schools to us and earn commission on successful conversions',
  ideal: 'Education influencers, bloggers, consultants',
  commission: '15-20%'
}, {
  title: 'Technology Partners',
  description: 'Integrate your product with EduMaster for mutual benefit',
  ideal: 'EdTech companies, payment gateways, LMS providers',
  commission: 'Revenue share'
}];
export function PartnersPage() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    partnerType: '',
    message: ''
  });
  return <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }}>
            <Handshake className="h-16 w-16 mx-auto mb-6 text-cyan-200" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Partner With EduMaster
            </h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Join our partner network and help schools across Africa transform
              their operations while earning recurring revenue.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[{
            value: '150+',
            label: 'Active Partners'
          }, {
            value: '500+',
            label: 'Schools Served'
          }, {
            value: '$2M+',
            label: 'Partner Revenue'
          }, {
            value: '98%',
            label: 'Partner Satisfaction'
          }].map((stat, index) => <motion.div key={stat.label} initial={{
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
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600">{stat.label}</div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Partner Benefits
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We invest in our partners' success with comprehensive support and
              resources.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => <motion.div key={benefit.title} initial={{
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
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
                    <benefit.icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {benefit.description}
                  </p>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-20 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Partnership Models
            </h2>
            <p className="text-lg text-slate-600">
              Choose the partnership model that fits your business best.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {partnerTypes.map((type, index) => <motion.div key={type.title} initial={{
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
                <Card className="p-8 h-full border-t-4 border-t-indigo-600">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {type.title}
                  </h3>
                  <p className="text-slate-600 mb-4">{type.description}</p>
                  <div className="space-y-3 mb-6">
                    <div>
                      <span className="text-sm font-medium text-slate-500">
                        Ideal for:
                      </span>
                      <p className="text-sm text-slate-700">{type.ideal}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-500">
                        Commission:
                      </span>
                      <p className="text-lg font-bold text-indigo-600">
                        {type.commission}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20 bg-slate-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Become a Partner
            </h2>
            <p className="text-lg text-slate-600">
              Fill out the form below and our partner team will get in touch
              within 24 hours.
            </p>
          </div>

          <Card className="p-8">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <Input required value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name *
                  </label>
                  <Input required value={formData.company} onChange={e => setFormData({
                  ...formData,
                  company: e.target.value
                })} placeholder="Your Company" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <Input required type="email" value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} placeholder="john@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone
                  </label>
                  <Input value={formData.phone} onChange={e => setFormData({
                  ...formData,
                  phone: e.target.value
                })} placeholder="+1 (555) 000-0000" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Partnership Type *
                </label>
                <select required value={formData.partnerType} onChange={e => setFormData({
                ...formData,
                partnerType: e.target.value
              })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option value="">Select type</option>
                  <option value="reseller">Reseller Partner</option>
                  <option value="referral">Referral Partner</option>
                  <option value="technology">Technology Partner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tell us about your business
                </label>
                <textarea rows={4} value={formData.message} onChange={e => setFormData({
                ...formData,
                message: e.target.value
              })} placeholder="Describe your business, target market, and why you want to partner with EduMaster..." className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Submit Application
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </>;
}