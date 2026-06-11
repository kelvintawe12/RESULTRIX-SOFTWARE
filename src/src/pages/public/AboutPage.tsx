import React from 'react';
import { Users, Zap, Award, Globe, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-slate-900 to-blue-900 pt-20 pb-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">About EduMaster</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Empowering schools worldwide with technology that transforms education
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 sm:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Our Mission</h2>
              <p className="text-xl text-slate-600 mb-6">
                We believe that every school deserves access to world-class management tools. Our mission is to make school administration simpler, more efficient, and more effective through innovative technology.
              </p>
              <p className="text-lg text-slate-600 mb-8">
                Since 2020, we've been dedicated to empowering educational institutions with tools that streamline operations, improve student outcomes, and foster meaningful connections between schools, teachers, students, and families.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
              >
                Join Our Community
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl h-96 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Users className="w-24 h-24 mx-auto mb-4 opacity-50" />
                <p>Our Mission</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 sm:py-32 bg-slate-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-slate-600">The principles that guide everything we do</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Zap,
                title: 'Innovation',
                description: 'Continuously improving and evolving our platform with cutting-edge technology'
              },
              {
                icon: Award,
                title: 'Excellence',
                description: 'Delivering the highest quality service and support to our customers'
              },
              {
                icon: Globe,
                title: 'Accessibility',
                description: 'Making powerful tools available to schools of all sizes and budgets'
              },
              {
                icon: Users,
                title: 'Community',
                description: 'Building strong relationships with our users and supporting their success'
              }
            ].map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="p-8 bg-white rounded-xl border border-slate-200">
                  <Icon className="w-10 h-10 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{value.title}</h3>
                  <p className="text-slate-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 sm:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: 'Schools Using EduMaster', value: '500+' },
              { label: 'Students Managed', value: '50,000+' },
              { label: 'Countries', value: '15+' },
              { label: 'Years of Experience', value: '4+' }
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                <p className="text-5xl font-bold text-blue-600 mb-2">{stat.value}</p>
                <p className="text-slate-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 sm:py-32 bg-slate-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Team</h2>
            <p className="text-xl text-slate-600">
              Dedicated professionals passionate about transforming education
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Johnson', role: 'Founder & CEO', bio: 'Former educator with 10+ years in school administration' },
              { name: 'Michael Chen', role: 'CTO', bio: 'Software architect with expertise in educational technology' },
              { name: 'Emma Wilson', role: 'Chief Product Officer', bio: 'Product strategist focused on user experience' }
            ].map((member, index) => (
              <div key={index} className="p-6 bg-white rounded-xl border border-slate-200 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-sm font-medium text-blue-600 mb-2">{member.role}</p>
                <p className="text-slate-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Join Schools Making a Difference</h2>
          <p className="text-xl text-blue-100 mb-8">
            Experience the EduMaster difference. Start your free trial today.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-slate-100 transition-all"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
