import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, HelpCircle, Loader } from 'lucide-react';
import { subscriptionService, SubscriptionPlan } from '../../services/subscriptionService';

export function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getPlans();
      setPlans(data);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      setError('Failed to load pricing plans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    // Navigate to signup with pre-selected plan
    navigate('/signup', { state: { selectedPlanId: planId } });
  };

  const getDisplayPrice = (plan: SubscriptionPlan) => {
    if (billingPeriod === 'annual' && plan.interval === 'year') {
      // Show annual pricing (already yearly price)
      return plan.price;
    }
    // For monthly billing, show monthly equivalent
    if (plan.interval === 'year') {
      return Math.round(plan.price / 12);
    }
    return plan.price;
  };

  const getDisplayPeriod = (plan: SubscriptionPlan) => {
    if (billingPeriod === 'annual') {
      return '/year';
    }
    return plan.interval === 'year' ? '/month (billed annually)' : '/month';
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (billingPeriod === 'annual' && plan.interval === 'year') {
      const monthlyEquivalent = plan.price / 12;
      const annualMonthly = monthlyEquivalent * 12;
      const savings = annualMonthly - plan.price;
      return savings > 0 ? Math.round((savings / annualMonthly) * 100) : 0;
    }
    return 0;
  };

  const staticFeatures = [
    'Student & teacher management',
    'Attendance tracking',
    'Grade management',
    'Report generation',
    'Mobile app access',
    'Email support',
    'Data backup & security',
    '99.9% uptime SLA',
    'Regular updates & improvements'
  ];

const faqs = [
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can change your plan anytime. Changes take effect on your next billing cycle.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, bank transfers, and PayPal. Enterprise customers can also arrange custom payment terms.'
  },
  {
    question: 'Is there a long-term contract?',
    answer: 'No, all plans are month-to-month with no long-term commitment. You can cancel anytime.'
  },
  {
    question: 'Do you offer educational discounts?',
    answer: 'Yes, registered educational institutions may qualify for special discounts. Contact our sales team for more information.'
  },
  {
    question: 'What\'s included in the free trial?',
    answer: 'You get full access to all features of your chosen plan for 14 days. No credit card required to start.'
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No setup fees for our standard plans. Enterprise customers may have custom implementation costs.'
  }
];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={fetchPlans}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-slate-900 to-blue-900 pt-20 pb-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your school. All plans include a 14-day free trial, no credit card required.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-blue-600'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-white text-blue-600'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Annual <span className="text-sm">(Save 20%)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 sm:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl overflow-hidden transition-all ${
                  plan.is_popular
                    ? 'ring-2 ring-blue-500 shadow-2xl scale-105'
                    : 'border border-slate-200 hover:border-slate-300'
                } ${plan.is_popular ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-white'}`}
              >
                {plan.is_popular && (
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 text-center text-sm font-semibold">
                    🌟 Most Popular
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-600 text-sm mb-6">{plan.description || ''}</p>

                  <div className="mb-8">
                    <span className="text-5xl font-bold text-slate-900">
                      ${getDisplayPrice(plan)}
                    </span>
                    <span className="text-slate-600 ml-2">{getDisplayPeriod(plan)}</span>
                    {getSavings(plan) > 0 && (
                      <p className="text-sm text-green-600 font-semibold mt-2">
                        Save {getSavings(plan)}% with annual billing
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all mb-8 ${
                      plan.is_popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Start Free Trial
                  </button>

                  <div className="space-y-4">
                    {Array.isArray(plan.features) && plan.features.length > 0 ? (
                      plan.features.map((feature: string, featureIndex: number) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{feature}</span>
                        </div>
                      ))
                    ) : (
                      staticFeatures.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{feature}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 sm:py-32 bg-slate-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-slate-600">All plans include these features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Student & teacher management',
              'Attendance tracking',
              'Grade management',
              'Report generation',
              'Mobile app access',
              'Email support',
              'Data backup & security',
              '99.9% uptime SLA',
              'Regular updates & improvements'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-900">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 sm:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-600">Got questions? We have answers.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <button
                key={index}
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full text-left p-6 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">{faq.question}</h3>
                  <HelpCircle
                    className={`w-5 h-5 text-slate-600 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                {expandedFaq === index && (
                  <p className="mt-4 text-slate-600">{faq.answer}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of schools managing their operations with EduMaster. Try for free today.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-slate-100 transition-all shadow-lg"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
