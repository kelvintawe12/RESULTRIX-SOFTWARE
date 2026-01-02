import React from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';
import { Scale, FileText, Shield, AlertCircle, Check, Mail } from 'lucide-react';
export function TermsOfServicePage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  const sections = [{
    id: 'acceptance',
    title: '1. Acceptance of Terms'
  }, {
    id: 'services',
    title: '2. Description of Services'
  }, {
    id: 'accounts',
    title: '3. User Accounts'
  }, {
    id: 'subscription',
    title: '4. Subscription & Billing'
  }, {
    id: 'usage',
    title: '5. Acceptable Use'
  }, {
    id: 'intellectual',
    title: '6. Intellectual Property'
  }, {
    id: 'termination',
    title: '7. Termination'
  }, {
    id: 'liability',
    title: '8. Limitation of Liability'
  }, {
    id: 'changes',
    title: '9. Changes to Terms'
  }, {
    id: 'contact',
    title: '10. Contact Information'
  }];
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-slate-900 text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-slate-800 rounded-full mb-6">
            <Scale className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Please read these terms carefully before using the EduMaster
            platform.
          </p>
          <div className="mt-8 text-sm text-slate-400 font-medium bg-slate-800/50 inline-block px-4 py-2 rounded-lg">
            Last Updated: January 15, 2024 • Effective Date: February 1, 2024
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24">
              <h3 className="font-bold text-slate-900 mb-4 px-3">
                Table of Contents
              </h3>
              <nav className="space-y-1">
                {sections.map(section => <button key={section.id} onClick={() => scrollToSection(section.id)} className="block w-full text-left px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                    {section.title}
                  </button>)}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-12">
            {/* Introduction Card */}
            <Card className="bg-blue-50 border-blue-100" noPadding>
              <div className="p-6 flex gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">
                    Important Notice
                  </h3>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    By accessing or using EduMaster, you agree to be bound by
                    these Terms of Service and all applicable laws and
                    regulations. If you do not agree with any of these terms,
                    you are prohibited from using or accessing this site.
                  </p>
                </div>
              </div>
            </Card>

            <section id="acceptance" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>
                  These Terms of Service ("Terms") constitute a legally binding
                  agreement between you and EduMaster Inc. ("EduMaster," "we,"
                  "us," or "our") governing your access to and use of the
                  EduMaster website, mobile application, and related services
                  (collectively, the "Services").
                </p>
                <p className="mt-4">
                  By creating an account, accessing, or using the Services, you
                  acknowledge that you have read, understood, and agree to be
                  bound by these Terms. If you are entering into these Terms on
                  behalf of an educational institution, you represent that you
                  have the authority to bind such entity to these Terms.
                </p>
              </div>
            </section>

            <section id="services" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                2. Description of Services
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>
                  EduMaster provides a comprehensive school management platform
                  that includes student information systems, grading, attendance
                  tracking, financial management, and communication tools. We
                  reserve the right to modify, suspend, or discontinue any part
                  of the Services at any time with or without notice.
                </p>
                <ul className="mt-4 space-y-2 list-none pl-0">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Cloud-based administration tools</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Mobile applications for parents and staff</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Data analytics and reporting features</span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="accounts" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                3. User Accounts
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>
                  To access certain features of the Services, you must register
                  for an account. You agree to provide accurate, current, and
                  complete information during the registration process and to
                  update such information to keep it accurate, current, and
                  complete.
                </p>
                <div className="mt-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-3">
                    Account Security Responsibilities
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      • You are responsible for safeguarding your password.
                    </li>
                    <li>
                      • You agree not to disclose your password to any third
                      party.
                    </li>
                    <li>
                      • You must notify us immediately upon becoming aware of
                      any breach of security.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="subscription" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                4. Subscription & Billing
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>
                  The Services are offered on a subscription basis. You agree to
                  pay all fees associated with your chosen subscription plan.
                  Fees are non-refundable except as required by law or as
                  explicitly stated in these Terms.
                </p>
                <p className="mt-4">
                  <strong>Automatic Renewal:</strong> Unless you cancel your
                  subscription before the end of the current subscription
                  period, your subscription will automatically renew for an
                  additional period of the same duration.
                </p>
              </div>
            </section>

            <section id="usage" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                5. Acceptable Use
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>You agree not to use the Services to:</p>
                <ul className="mt-4 grid md:grid-cols-2 gap-4 list-none pl-0">
                  <li className="bg-red-50 p-4 rounded-lg text-red-800 text-sm">
                    Violate any applicable law or regulation.
                  </li>
                  <li className="bg-red-50 p-4 rounded-lg text-red-800 text-sm">
                    Infringe upon the rights of others.
                  </li>
                  <li className="bg-red-50 p-4 rounded-lg text-red-800 text-sm">
                    Upload malicious code or viruses.
                  </li>
                  <li className="bg-red-50 p-4 rounded-lg text-red-800 text-sm">
                    Interfere with the proper working of the Services.
                  </li>
                </ul>
              </div>
            </section>

            <section id="intellectual" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                6. Intellectual Property
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>
                  The Services and their original content, features, and
                  functionality are and will remain the exclusive property of
                  EduMaster and its licensors. The Services are protected by
                  copyright, trademark, and other laws of both the United States
                  and foreign countries.
                </p>
              </div>
            </section>

            <section id="termination" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                7. Termination
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>
                  We may terminate or suspend your account immediately, without
                  prior notice or liability, for any reason whatsoever,
                  including without limitation if you breach the Terms. Upon
                  termination, your right to use the Services will immediately
                  cease.
                </p>
              </div>
            </section>

            <section id="liability" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                8. Limitation of Liability
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p className="uppercase text-sm font-bold text-slate-500 mb-2">
                  Disclaimer
                </p>
                <p>
                  In no event shall EduMaster, nor its directors, employees,
                  partners, agents, suppliers, or affiliates, be liable for any
                  indirect, incidental, special, consequential or punitive
                  damages, including without limitation, loss of profits, data,
                  use, goodwill, or other intangible losses.
                </p>
              </div>
            </section>

            <section id="changes" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                9. Changes to Terms
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>
                  We reserve the right, at our sole discretion, to modify or
                  replace these Terms at any time. If a revision is material we
                  will try to provide at least 30 days notice prior to any new
                  terms taking effect. What constitutes a material change will
                  be determined at our sole discretion.
                </p>
              </div>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                10. Contact Information
              </h2>
              <Card className="bg-slate-50 border-slate-200" noPadding>
                <div className="p-6">
                  <p className="text-slate-600 mb-4">
                    If you have any questions about these Terms, please contact
                    us:
                  </p>
                  <div className="flex items-center gap-3 text-blue-600 font-medium">
                    <Mail className="w-5 h-5" />
                    <a href="mailto:legal@edumaster.com" className="hover:underline">
                      legal@edumaster.com
                    </a>
                  </div>
                  <div className="mt-4 text-sm text-slate-500">
                    EduMaster Inc.
                    <br />
                    100 Market St, Suite 500
                    <br />
                    San Francisco, CA 94105
                  </div>
                </div>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>;
}