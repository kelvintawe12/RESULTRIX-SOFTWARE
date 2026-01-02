import React from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Check, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
const tiers = [{
  name: 'Starter',
  price: '$49',
  period: '/month',
  description: 'Perfect for small schools or pilot programs.',
  features: ['Up to 100 Students', 'Basic Reporting', 'Attendance Tracking', 'Email Support'],
  cta: 'Start Free Trial',
  variant: 'outline' as const
}, {
  name: 'Professional',
  price: '$149',
  period: '/month',
  description: 'The standard for growing institutions.',
  features: ['Up to 500 Students', 'Advanced Analytics', 'Fee Management', 'Parent Portal', 'Priority Support'],
  cta: 'Get Started',
  highlighted: true,
  variant: 'default' as const
}, {
  name: 'Enterprise',
  price: 'Custom',
  period: '',
  description: 'For large networks and universities.',
  features: ['Unlimited Students', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Guarantee', 'On-premise Option'],
  cta: 'Contact Sales',
  variant: 'outline' as const
}];
const faqs = [{
  q: 'Is there a setup fee?',
  a: 'No, all our plans include free setup and onboarding assistance to get you started quickly.'
}, {
  q: 'Can I change plans later?',
  a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
}, {
  q: 'Do you offer discounts for non-profits?',
  a: 'Yes, we offer a 20% discount for registered non-profit educational institutions. Contact sales for details.'
}, {
  q: 'Is my data secure?',
  a: 'Absolutely. We use bank-grade encryption and perform regular security audits to ensure your data is safe.'
}, {
  q: 'What kind of support do you offer?',
  a: 'All plans include email support. Professional and Enterprise plans include priority phone and chat support.'
}, {
  q: 'Do you offer training?',
  a: 'Yes, we provide comprehensive video tutorials and documentation. Live training is available for Enterprise plans.'
}];
export function PricingPage() {
  return <PublicLayout>
      {/* Hero */}
      <section className="bg-slate-900 text-white py-24 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Choose the plan that fits your school's needs. No hidden fees,
              cancel anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 bg-white -mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.1,
            duration: 0.5
          }} whileHover={{
            y: -8
          }}>
                <Card className={`h-full flex flex-col ${tier.highlighted ? 'border-blue-500 shadow-xl ring-1 ring-blue-500' : 'border-slate-200 shadow-lg'}`} noPadding>
                  <div className="text-center pb-8 pt-6 px-6">
                    {tier.highlighted && <div className="mx-auto bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">
                        MOST POPULAR
                      </div>}
                    <h3 className="text-2xl font-bold text-slate-900">
                      {tier.name}
                    </h3>
                    <div className="mt-4 flex items-baseline justify-center text-slate-900">
                      <span className="text-5xl font-extrabold tracking-tight">
                        {tier.price}
                      </span>
                      <span className="ml-1 text-xl font-medium text-slate-500">
                        {tier.period}
                      </span>
                    </div>
                    <p className="mt-4 text-slate-600">{tier.description}</p>
                  </div>
                  <div className="flex-1 px-6 pb-6">
                    <ul className="space-y-4">
                      {tier.features.map((feature, i) => <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-slate-600">{feature}</span>
                        </li>)}
                    </ul>
                  </div>
                  <div className="pt-8 px-6 pb-6">
                    <Button className={`w-full py-6 text-lg ${tier.highlighted ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`} variant={tier.variant === 'default' ? 'default' : 'outline'}>
                      {tier.cta}
                    </Button>
                  </div>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            {faqs.map((faq, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 10
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.05
          }}>
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start">
                  <HelpCircle className="h-5 w-5 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-slate-600 pl-7">{faq.a}</p>
              </motion.div>)}
          </div>
          <div className="mt-16 text-center">
            <p className="text-slate-600 mb-4">Still have questions?</p>
            <Link to="/contact">
              <Button variant="link" className="text-blue-600 font-semibold">
                Contact our support team &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>;
}