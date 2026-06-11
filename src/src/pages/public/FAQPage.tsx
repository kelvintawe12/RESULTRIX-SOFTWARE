import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const categories = [
  {
    name: 'Getting Started',
    faqs: [
      {
        q: 'What is EduMaster?',
        a: 'EduMaster is a comprehensive school management system that helps institutions streamline operations, manage student records, handle finances, and improve communication with stakeholders.'
      },
      {
        q: 'How do I get started?',
        a: 'Sign up for a free 14-day trial on our website. No credit card required. You\'ll get immediate access to all features.'
      },
      {
        q: 'Do you offer training?',
        a: 'Yes, we provide comprehensive onboarding, video tutorials, and documentation. Our support team is also available 24/7 to help.'
      }
    ]
  },
  {
    name: 'Features',
    faqs: [
      {
        q: 'What features are included in each plan?',
        a: 'Visit our pricing page to see a detailed comparison of features for each plan. All plans include core features like student management and reporting.'
      },
      {
        q: 'Can I import my existing data?',
        a: 'Yes, we support bulk import from CSV files. Our team can also help with data migration from other systems.'
      },
      {
        q: 'Is there a mobile app?',
        a: 'Yes, EduMaster offers iOS and Android apps with full access to all features.'
      }
    ]
  },
  {
    name: 'Billing',
    faqs: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards, bank transfers, and PayPal. Contact our sales team for custom payment arrangements.'
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes, there are no long-term contracts. You can cancel your subscription anytime with no penalties.'
      },
      {
        q: 'Do you offer educational discounts?',
        a: 'Yes, registered educational institutions may qualify for special discounts. Contact our sales team for details.'
      }
    ]
  },
  {
    name: 'Security',
    faqs: [
      {
        q: 'Is my data secure?',
        a: 'Absolutely. We use enterprise-grade encryption, regular security audits, and comply with FERPA, GDPR, and other data protection regulations.'
      },
      {
        q: 'Where is my data stored?',
        a: 'Your data is stored in secure, redundant cloud servers with automatic daily backups. We have servers in multiple regions for reliability.'
      },
      {
        q: 'Can I request an on-premise deployment?',
        a: 'Yes, our Enterprise plan includes on-premise deployment options. Contact our sales team for details.'
      }
    ]
  }
];

export function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Getting Started');

  const selectedCategory = categories.find(c => c.name === activeCategory);
  const filteredFaqs = selectedCategory?.faqs.filter(faq =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-slate-900 to-blue-900 pt-20 pb-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Find answers to common questions about EduMaster
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 sm:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Search */}
          <div className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
              />
            </div>
          </div>

          {/* Categories and FAQs */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Category Links */}
            <div className="lg:col-span-1">
              <div className="space-y-2 sticky top-8">
                {categories.map(category => (
                  <button
                    key={category.name}
                    onClick={() => {
                      setActiveCategory(category.name);
                      setSearchQuery('');
                      setExpandedIndex(null);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                      activeCategory === category.name
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ List */}
            <div className="lg:col-span-3">
              {filteredFaqs.length > 0 ? (
                <div className="space-y-4">
                  {filteredFaqs.map((faq, index) => {
                    const key = `${activeCategory}-${index}`;
                    const isExpanded = expandedIndex === key;

                    return (
                      <button
                        key={key}
                        onClick={() => setExpandedIndex(isExpanded ? null : key)}
                        className="w-full text-left p-6 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-900 pr-4">{faq.q}</h3>
                          <ChevronDown
                            className={`w-5 h-5 text-slate-600 flex-shrink-0 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                        {isExpanded && (
                          <p className="mt-4 text-slate-600 leading-relaxed">{faq.a}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600 text-lg">No results found. Try a different search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-32 bg-slate-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Didn't find your answer?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Contact our support team - we're here to help!
          </p>
          <a
            href="mailto:support@edumaster.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
          >
            Contact Support
          </a>
        </div>
      </section>
    </div>
  );
}
