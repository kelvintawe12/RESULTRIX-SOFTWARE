import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Search, ChevronDown, ChevronUp, HelpCircle, Shield, CreditCard, Settings, MessageCircle } from 'lucide-react';
const categories = [{
  id: 'general',
  name: 'General',
  icon: HelpCircle
}, {
  id: 'pricing',
  name: 'Pricing',
  icon: CreditCard
}, {
  id: 'technical',
  name: 'Technical',
  icon: Settings
}, {
  id: 'security',
  name: 'Security',
  icon: Shield
}, {
  id: 'support',
  name: 'Support',
  icon: MessageCircle
}];
const faqs = [
// General
{
  category: 'general',
  question: 'What is EduMaster?',
  answer: 'EduMaster is a comprehensive school management SaaS platform designed to streamline administrative tasks, academic management, and financial operations for educational institutions of all sizes.'
}, {
  category: 'general',
  question: 'Who is EduMaster for?',
  answer: 'EduMaster is built for K-12 schools, colleges, universities, and training centers. It serves school administrators, teachers, students, parents, and bursars with dedicated portals for each role.'
}, {
  category: 'general',
  question: 'How does multi-tenancy work?',
  answer: 'Each school gets its own secure, isolated environment within our platform. Your data is completely separated from other institutions, ensuring privacy and security while benefiting from a shared, robust infrastructure.'
}, {
  category: 'general',
  question: 'Can I try before buying?',
  answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card is required to start your trial.'
}, {
  category: 'general',
  question: 'How long does setup take?',
  answer: 'Most schools can get up and running within 24-48 hours. Our bulk import tools allow you to quickly migrate student and staff data from Excel or CSV files.'
},
// Pricing
{
  category: 'pricing',
  question: 'What plans do you offer?',
  answer: 'We offer three main tiers: Starter (for small schools), Professional (for growing institutions), and Enterprise (for large networks). Visit our Pricing page for detailed feature comparisons.'
}, {
  category: 'pricing',
  question: 'Is there a free trial?',
  answer: 'Yes, all plans come with a 14-day free trial. You can test the full functionality of the platform before committing to a subscription.'
}, {
  category: 'pricing',
  question: 'Can I change plans later?',
  answer: 'Absolutely. You can upgrade or downgrade your plan at any time directly from your admin dashboard. Changes take effect immediately.'
}, {
  category: 'pricing',
  question: 'Do you offer discounts for non-profits?',
  answer: 'Yes, we offer a 20% discount for registered non-profit educational institutions and NGOs. Please contact our sales team with your registration details.'
},
// Technical
{
  category: 'technical',
  question: 'What technologies do you use?',
  answer: 'EduMaster is built on a modern stack including React, TypeScript, and Supabase (PostgreSQL). We use enterprise-grade encryption and cloud infrastructure to ensure performance and reliability.'
}, {
  category: 'technical',
  question: 'Is there an API?',
  answer: 'Yes, our Enterprise plan includes access to our REST API, allowing you to integrate EduMaster with other tools like LMS platforms, accounting software, or biometric systems.'
}, {
  category: 'technical',
  question: 'Can I export my data?',
  answer: 'Yes, you retain full ownership of your data. You can export student records, financial reports, and academic data in standard formats like CSV, Excel, and PDF at any time.'
}, {
  category: 'technical',
  question: 'What browsers are supported?',
  answer: 'EduMaster works on all modern browsers including Chrome, Firefox, Safari, and Edge. It is also fully responsive and works great on tablets and mobile devices.'
}, {
  category: 'technical',
  question: 'Do you have a mobile app?',
  answer: 'EduMaster is a Progressive Web App (PWA), meaning you can install it on your phone or desktop directly from the browser for an app-like experience without needing an app store.'
},
// Security
{
  category: 'security',
  question: 'How is my data protected?',
  answer: 'We use bank-grade AES-256 encryption for data at rest and TLS 1.3 for data in transit. Our infrastructure is hosted in secure data centers with 24/7 monitoring and regular security audits.'
}, {
  category: 'security',
  question: 'Are you GDPR compliant?',
  answer: 'Yes, we are fully GDPR compliant. We provide tools to help you manage consent, data access requests, and the right to be forgotten.'
}, {
  category: 'security',
  question: 'What about backups?',
  answer: 'We perform automatic daily backups of all data, with point-in-time recovery capabilities. Your data is replicated across multiple availability zones to prevent data loss.'
},
// Support
{
  category: 'support',
  question: 'What support do you offer?',
  answer: 'All plans include email support. Professional plans add priority chat support, and Enterprise plans include a dedicated account manager and phone support.'
}, {
  category: 'support',
  question: 'How do I get help?',
  answer: 'You can access our Help Center directly from the dashboard, submit a support ticket, or email support@edumaster.com. Our team typically responds within 2-4 hours.'
}, {
  category: 'support',
  question: 'Do you provide training?',
  answer: 'Yes, we provide comprehensive documentation and video tutorials. For Enterprise clients, we offer personalized onboarding and training sessions for your staff.'
}];
export function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);
  const toggleItem = (question: string) => {
    setOpenItems(prev => prev.includes(question) ? prev.filter(item => item !== question) : [...prev, question]);
  };
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.h1 initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked Questions
          </motion.h1>
          <motion.p initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.1
        }} className="text-xl text-slate-300 mb-8">
            Everything you need to know about EduMaster. Can't find the answer
            you're looking for? Contact our support team.
          </motion.p>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2
        }} className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input type="text" placeholder="Search for answers..." value={searchQuery} onChange={e => {
            setSearchQuery(e.target.value);
            if (e.target.value) setActiveCategory('all');
          }} className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-sm" />
          </motion.div>
        </div>
      </section>

      {/* Categories & Questions */}
      <section className="py-16 bg-slate-50 min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar Categories */}
            <div className="md:col-span-1 space-y-2">
              <h3 className="font-semibold text-slate-900 mb-4 px-4">
                Categories
              </h3>
              {categories.map(cat => <button key={cat.id} onClick={() => {
              setActiveCategory(cat.id);
              setSearchQuery('');
            }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeCategory === cat.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}>
                  <cat.icon className={`h-5 w-5 ${activeCategory === cat.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {cat.name}
                </button>)}
            </div>

            {/* Questions List */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {filteredFaqs.length > 0 ? filteredFaqs.map((faq, index) => <motion.div key={index} initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                delay: index * 0.05
              }} className="border-b border-slate-100 last:border-0">
                      <button onClick={() => toggleItem(faq.question)} className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors">
                        <span className="font-medium text-slate-900 text-lg pr-8">
                          {faq.question}
                        </span>
                        {openItems.includes(faq.question) ? <ChevronUp className="h-5 w-5 text-indigo-600 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />}
                      </button>
                      <AnimatePresence>
                        {openItems.includes(faq.question) && <motion.div initial={{
                    height: 0,
                    opacity: 0
                  }} animate={{
                    height: 'auto',
                    opacity: 1
                  }} exit={{
                    height: 0,
                    opacity: 0
                  }} transition={{
                    duration: 0.2
                  }} className="overflow-hidden">
                            <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                              {faq.answer}
                            </div>
                          </motion.div>}
                      </AnimatePresence>
                    </motion.div>) : <div className="p-12 text-center text-slate-500">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg">
                      No questions found matching "{searchQuery}"
                    </p>
                    <button onClick={() => setSearchQuery('')} className="text-indigo-600 font-medium mt-2 hover:underline">
                      Clear search
                    </button>
                  </div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Still have questions?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Our support team is available 24/7 to help you with any questions or
            issues.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="px-8">
              Contact Support
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              View Documentation
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>;
}