import React, { Children } from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';
import { Shield, Lock, Eye, Database, Globe, Mail, FileCheck } from 'lucide-react';
export function PrivacyPolicyPage() {
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
    id: 'intro',
    title: '1. Introduction'
  }, {
    id: 'collection',
    title: '2. Information We Collect'
  }, {
    id: 'usage',
    title: '3. How We Use Information'
  }, {
    id: 'sharing',
    title: '4. Information Sharing'
  }, {
    id: 'security',
    title: '5. Data Security'
  }, {
    id: 'rights',
    title: '6. Your Rights'
  }, {
    id: 'children',
    title: "7. Children's Privacy"
  }, {
    id: 'contact',
    title: '8. Contact Us'
  }];
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-slate-900 text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-slate-800 rounded-full mb-6">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            We are committed to protecting your privacy and ensuring the
            security of your data.
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
            {/* Compliance Card */}
            <Card className="bg-green-50 border-green-100" noPadding>
              <div className="p-6">
                <h3 className="font-bold text-green-900 mb-4 flex items-center">
                  <FileCheck className="w-5 h-5 mr-2" />
                  Compliance Standards
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded border border-green-100 text-center text-sm font-medium text-green-800">
                    GDPR Compliant
                  </div>
                  <div className="bg-white p-3 rounded border border-green-100 text-center text-sm font-medium text-green-800">
                    FERPA Compliant
                  </div>
                  <div className="bg-white p-3 rounded border border-green-100 text-center text-sm font-medium text-green-800">
                    SOC 2 Type II
                  </div>
                </div>
              </div>
            </Card>

            <section id="intro" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                1. Introduction
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>
                  EduMaster Inc. ("EduMaster," "we," "us," or "our") respects
                  your privacy and is committed to protecting it through our
                  compliance with this policy. This policy describes the types
                  of information we may collect from you or that you may provide
                  when you visit the website or use our services.
                </p>
              </div>
            </section>

            <section id="collection" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                2. Information We Collect
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p className="mb-4">
                  We collect several types of information from and about users
                  of our Services, including:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center">
                      <Database className="w-4 h-4 mr-2 text-blue-500" />
                      Personal Information
                    </h4>
                    <p className="text-sm">
                      Name, email address, phone number, job title, and
                      institution name.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-blue-500" />
                      Usage Data
                    </h4>
                    <p className="text-sm">
                      IP address, browser type, operating system, and
                      interaction data.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="usage" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                3. How We Use Information
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <ul className="space-y-3 list-none pl-0">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    To provide and maintain our Service
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    To notify you about changes to our Service
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    To provide customer support
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    To gather analysis or valuable information so that we can
                    improve our Service
                  </li>
                </ul>
              </div>
            </section>

            <section id="sharing" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                4. Information Sharing
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>
                  We do not sell, trade, or otherwise transfer to outside
                  parties your Personally Identifiable Information unless we
                  provide users with advance notice. This does not include
                  website hosting partners and other parties who assist us in
                  operating our website, conducting our business, or serving our
                  users, so long as those parties agree to keep this information
                  confidential.
                </p>
              </div>
            </section>

            <section id="security" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                5. Data Security
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <div className="flex items-start gap-4 bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <Lock className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="mb-2">
                      We implement a variety of security measures to maintain
                      the safety of your personal information.
                    </p>
                    <ul className="text-sm space-y-1 text-slate-500">
                      <li>• Encryption in transit (TLS 1.2+)</li>
                      <li>• Encryption at rest (AES-256)</li>
                      <li>• Regular security audits and penetration testing</li>
                      <li>• Strict access controls and authentication</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section id="rights" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                6. Your Rights
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p className="mb-4">
                  Depending on your location, you may have certain rights
                  regarding your personal information, including:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="border border-slate-200 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-1">
                      Right to Access
                    </h4>
                    <p className="text-sm">
                      Request copies of your personal data.
                    </p>
                  </div>
                  <div className="border border-slate-200 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-1">
                      Right to Rectification
                    </h4>
                    <p className="text-sm">
                      Request correction of inaccurate information.
                    </p>
                  </div>
                  <div className="border border-slate-200 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-1">
                      Right to Erasure
                    </h4>
                    <p className="text-sm">
                      Request deletion of your personal data.
                    </p>
                  </div>
                  <div className="border border-slate-200 p-4 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-1">
                      Right to Object
                    </h4>
                    <p className="text-sm">
                      Object to processing of your personal data.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="children" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                7. Children's Privacy
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>
                  Protecting the privacy of young children is especially
                  important. For that reason, EduMaster does not knowingly
                  collect or solicit personal information from anyone under the
                  age of 13 without parental consent. If we learn that we have
                  collected personal information from a child under age 13
                  without verification of parental consent, we will delete that
                  information as quickly as possible.
                </p>
              </div>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                8. Contact Us
              </h2>
              <Card className="bg-slate-50 border-slate-200" noPadding>
                <div className="p-6">
                  <p className="text-slate-600 mb-4">
                    If you have any questions regarding this privacy policy, you
                    may contact us using the information below:
                  </p>
                  <div className="flex items-center gap-3 text-blue-600 font-medium">
                    <Mail className="w-5 h-5" />
                    <a href="mailto:privacy@edumaster.com" className="hover:underline">
                      privacy@edumaster.com
                    </a>
                  </div>
                  <div className="mt-4 text-sm text-slate-500">
                    EduMaster Inc.
                    <br />
                    Attn: Data Protection Officer
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