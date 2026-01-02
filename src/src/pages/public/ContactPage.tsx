import React, { useState, Children } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Users, Globe, CheckCircle, HelpCircle, ArrowRight, Building2 } from 'lucide-react';
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
const contactChannels = [{
  title: 'Sales Team',
  description: 'For demos, pricing, and new customer inquiries.',
  email: 'sales@edumaster.com',
  response: '< 2 hours',
  icon: Building2,
  color: 'text-blue-600',
  bg: 'bg-blue-50'
}, {
  title: 'Technical Support',
  description: 'For existing customers needing assistance.',
  email: 'support@edumaster.com',
  response: '< 4 hours',
  icon: MessageSquare,
  color: 'text-green-600',
  bg: 'bg-green-50'
}, {
  title: 'Partnerships',
  description: 'For integrations, resellers, and alliances.',
  email: 'partners@edumaster.com',
  response: '24-48 hours',
  icon: Users,
  color: 'text-purple-600',
  bg: 'bg-purple-50'
}, {
  title: 'Media & Press',
  description: 'For press kits, interviews, and media inquiries.',
  email: 'press@edumaster.com',
  response: '24 hours',
  icon: Globe,
  color: 'text-orange-600',
  bg: 'bg-orange-50'
}];
const teamMembers = [{
  name: 'Sarah Chen',
  role: 'Head of Sales',
  initials: 'SC',
  status: 'online',
  color: 'bg-blue-100 text-blue-700'
}, {
  name: 'David Miller',
  role: 'Support Lead',
  initials: 'DM',
  status: 'online',
  color: 'bg-green-100 text-green-700'
}, {
  name: 'Emily Rodriguez',
  role: 'Partnerships',
  initials: 'ER',
  status: 'away',
  color: 'bg-purple-100 text-purple-700'
}];
const offices = [{
  city: 'San Francisco',
  address: '100 Market St, Suite 500',
  timezone: 'PST (UTC-8)',
  phone: '+1 (415) 555-0123'
}, {
  city: 'London',
  address: '123 Oxford Street',
  timezone: 'GMT (UTC+0)',
  phone: '+44 20 7123 4567'
}, {
  city: 'Singapore',
  address: '1 Raffles Place',
  timezone: 'SGT (UTC+8)',
  phone: '+65 6789 0123'
}];
const faqs = [{
  q: 'How quickly will I hear back?',
  a: 'For sales inquiries, we typically respond within 2 hours during business hours. Support tickets are prioritized based on severity.'
}, {
  q: 'Do you offer live demos?',
  a: "Yes! Our sales team is happy to schedule a personalized walkthrough of the platform tailored to your institution's needs."
}, {
  q: 'Is there a free trial available?',
  a: 'We offer a 14-day free trial for qualified institutions. Contact our sales team to get set up.'
}, {
  q: 'Do you provide onboarding support?',
  a: 'Absolutely. All new accounts receive dedicated onboarding assistance to ensure a smooth transition.'
}];
export function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    inquiryType: 'sales',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organizationType: '',
    studentCount: '',
    message: ''
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {
      id,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };
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
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Let's Start a Conversation
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              Whether you're looking for a demo, have a support question, or
              just want to say hello, we're here to help.
            </p>

            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-400">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>&lt; 2 Hour Response Time</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>98% Satisfaction Rate</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>Global 24/7 Support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Channels */}
      <section className="py-12 -mt-20 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" animate="visible">
            {contactChannels.map((channel, index) => <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-slate-200" noPadding>
                  <div className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${channel.bg} flex items-center justify-center mb-4 ${channel.color}`}>
                      <channel.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">
                      {channel.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 h-10">
                      {channel.description}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-blue-600 font-medium cursor-pointer hover:underline">
                        <Mail className="w-4 h-4 mr-2" />
                        {channel.email}
                      </div>
                      <div className="flex items-center text-slate-500">
                        <Clock className="w-4 h-4 mr-2" />
                        Response: {channel.response}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* Main Content Split */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Column: Form */}
            <div className="lg:col-span-2">
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }}>
                <Card className="shadow-xl border-none overflow-hidden" noPadding>
                  <div className="p-8 md:p-10 bg-white">
                    {submitted ? <div className="text-center py-20">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                          <Send className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                          Message Received!
                        </h2>
                        <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                          Thanks for reaching out. One of our team members will
                          get back to you shortly at{' '}
                          <span className="font-semibold text-slate-900">
                            {formData.email}
                          </span>
                          .
                        </p>
                        <Button onClick={() => setSubmitted(false)} variant="outline" size="lg">
                          Send Another Message
                        </Button>
                      </div> : <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Send us a Message
                          </h2>
                          <p className="text-slate-600">
                            Fill out the form below and we'll route your inquiry
                            to the right team.
                          </p>
                        </div>

                        <div className="space-y-6">
                          {/* Inquiry Type */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                              I'm interested in...
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {['Sales', 'Support', 'Partnership', 'General'].map(type => <button key={type} type="button" onClick={() => setFormData(prev => ({
                            ...prev,
                            inquiryType: type.toLowerCase()
                          }))} className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${formData.inquiryType === type.toLowerCase() ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                                  {type}
                                </button>)}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <Input id="firstName" label="First Name" placeholder="Jane" required value={formData.firstName} onChange={handleInputChange} />
                            <Input id="lastName" label="Last Name" placeholder="Doe" required value={formData.lastName} onChange={handleInputChange} />
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <Input id="email" type="email" label="Work Email" placeholder="jane@school.edu" required value={formData.email} onChange={handleInputChange} />
                            <Input id="phone" type="tel" label="Phone Number (Optional)" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleInputChange} />
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <Select id="organizationType" label="Organization Type" options={[{
                          value: 'k12_school',
                          label: 'K-12 School'
                        }, {
                          value: 'university',
                          label: 'University / College'
                        }, {
                          value: 'district',
                          label: 'School District'
                        }, {
                          value: 'other',
                          label: 'Other'
                        }]} placeholder="Select type..." required value={formData.organizationType} onChange={handleInputChange} />
                            <Select id="studentCount" label="Number of Students" options={[{
                          value: '0-500',
                          label: 'Less than 500'
                        }, {
                          value: '500-1000',
                          label: '500 - 1,000'
                        }, {
                          value: '1000-5000',
                          label: '1,000 - 5,000'
                        }, {
                          value: '5000+',
                          label: 'More than 5,000'
                        }]} placeholder="Select range..." required value={formData.studentCount} onChange={handleInputChange} />
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                              How can we help?
                            </label>
                            <textarea id="message" rows={4} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" placeholder="Tell us a bit more about your needs..." required value={formData.message} onChange={handleInputChange}></textarea>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button type="submit" className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" disabled={isSubmitting}>
                            {isSubmitting ? <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending Message...
                              </span> : <span className="flex items-center">
                                Send Message{' '}
                                <ArrowRight className="ml-2 h-5 w-5" />
                              </span>}
                          </Button>
                          <p className="text-xs text-center text-slate-500 mt-4">
                            By submitting this form, you agree to our Terms of
                            Service and Privacy Policy.
                          </p>
                        </div>
                      </form>}
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Right Column: Team & Offices */}
            <div className="space-y-8">
              {/* Team Section */}
              <motion.div initial={{
              opacity: 0,
              x: 20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: 0.2
            }}>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Meet the Team
                </h3>
                <div className="space-y-4">
                  {teamMembers.map((member, index) => <Card key={index} className="hover:shadow-md transition-shadow cursor-default" noPadding>
                      <div className="p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${member.color} relative`}>
                          {member.initials}
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${member.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {member.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {member.role}
                          </div>
                        </div>
                      </div>
                    </Card>)}
                </div>
              </motion.div>

              {/* Offices Section */}
              <motion.div initial={{
              opacity: 0,
              x: 20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: 0.3
            }}>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-blue-600" />
                  Global Offices
                </h3>
                <div className="space-y-4">
                  {offices.map((office, index) => <Card key={index} className="hover:shadow-md transition-shadow" noPadding>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900">
                            {office.city}
                          </h4>
                          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {office.timezone}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-slate-400" />
                            {office.address}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400" />
                            {office.phone}
                          </div>
                        </div>
                      </div>
                    </Card>)}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600">
              Common questions about getting in touch with us.
            </p>
          </div>
          <div className="grid gap-6">
            {faqs.map((faq, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 10
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }}>
                <Card className="hover:border-blue-200 transition-colors" noPadding>
                  <div className="p-6">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-start">
                      <HelpCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                      {faq.q}
                    </h3>
                    <p className="text-slate-600 pl-8">{faq.a}</p>
                  </div>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>
    </PublicLayout>;
}