import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  Users,
  BarChart3,
  Shield,
  Globe,
  Smartphone,
  Truck,
  Star,
  Zap,
  Clock,
  Bell
} from 'lucide-react';

const stats = [
  { label: 'Active Schools', value: '500+' },
  { label: 'Students Managed', value: '50K+' },
  { label: 'Countries', value: '15+' },
  { label: 'Uptime', value: '99.9%' }
];

const heroFeatures = [
  {
    icon: Users,
    title: 'Student Management',
    description: 'Complete student records, enrollment, and academic history tracking'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Real-time performance tracking and detailed progress reports'
  },
  {
    icon: Truck,
    title: 'Financial Management',
    description: 'Automated billing, payment tracking, and financial reporting'
  },
  {
    icon: Bell,
    title: 'Communication',
    description: 'Integrated messaging, announcements, and parent notifications'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level security with 99.9% uptime guarantee'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed even with large datasets'
  }
];

const testimonials = [
  {
    name: 'Dr. James Wilson',
    role: 'Principal, Central High School',
    image: '👨‍💼',
    content: 'EduMaster transformed how we manage our school. Operations that took days now take minutes.',
    rating: 5
  },
  {
    name: 'Sarah Johnson',
    role: 'Bursar, St. Mary Academy',
    image: '👩‍💼',
    content: 'The financial management features are incredible. Billing is now automated and error-free.',
    rating: 5
  },
  {
    name: 'Prof. Michael Chen',
    role: 'Academic Director, University College',
    image: '👨‍🏫',
    content: 'The analytics dashboard gives us insights we never had before. Student performance tracking is seamless.',
    rating: 5
  }
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    description: 'Perfect for small schools',
    features: [
      'Up to 100 students',
      'Basic reporting',
      'Email support',
      'Mobile app access',
      '1 administrator'
    ],
    cta: 'Get Started',
    highlighted: false
  },
  {
    name: 'Professional',
    price: '$299',
    period: '/month',
    description: 'Most popular for growing schools',
    features: [
      'Up to 1000 students',
      'Advanced analytics',
      'Priority support',
      'Mobile app access',
      '5 administrators',
      'Custom reports',
      'API access'
    ],
    cta: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'For large institutions',
    features: [
      'Unlimited students',
      'Custom development',
      '24/7 dedicated support',
      'Mobile app access',
      'Unlimited administrators',
      'Advanced security',
      'SLA guarantee',
      'On-premise option'
    ],
    cta: 'Contact Sales',
    highlighted: false
  }
];

export function LandingPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 to-blue-900 pt-20 sm:pt-28 pb-12 sm:pb-16 overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-blue-900/80"></div>
        </div>

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-blue-400/50 mb-4 sm:mb-8">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-blue-300">Now Available • Live in 150+ Schools</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-bold text-white mb-3 sm:mb-6 leading-tight">
            Manage Your School
            <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl mt-1 sm:mt-2">
              Effortlessly
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-300 max-w-lg sm:max-w-2xl md:max-w-3xl mx-auto mb-6 sm:mb-12 px-4">
            Complete school management system designed for modern educational institutions. Automate operations, streamline communication, and boost student success.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center mb-8 sm:mb-16 px-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm md:text-base"
            >
              Get Started Free
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 border border-white/20 transition-all text-xs sm:text-sm md:text-base"
            >
              Explore Features
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8 pt-4 sm:pt-8 border-t border-white/10 px-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hero Features Grid */}
      <section className="py-12 sm:py-16 md:py-32 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {heroFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-4 sm:p-6 lg:p-8 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 mb-1.5 sm:mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm lg:text-base text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 md:py-32 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Loved by Schools Worldwide</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
              Join hundreds of schools that trust EduMaster for their management needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-4 sm:p-6 lg:p-8 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
                  <div className="text-2xl sm:text-3xl lg:text-4xl">{testimonial.image}</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-xs sm:text-sm lg:text-base">{testimonial.name}</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-slate-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 italic text-xs sm:text-sm lg:text-base">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 md:py-32 bg-slate-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the plan that works best for your school. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-6">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl overflow-hidden transition-all ${
                  plan.highlighted
                    ? 'ring-2 ring-blue-500 shadow-xl scale-105'
                    : 'border border-slate-200 hover:border-slate-300'
                } ${plan.highlighted ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-white'}`}
              >
                {plan.highlighted && (
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 text-center text-[10px] sm:text-xs md:text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 mb-4 sm:mb-6">{plan.description}</p>

                  <div className="mb-4 sm:mb-6">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-xs sm:text-sm md:text-base text-slate-600">{plan.period}</span>
                  </div>

                  <button
                    className={`w-full py-2 sm:py-2.5 lg:py-3 rounded-lg font-semibold transition-all mb-4 sm:mb-6 lg:mb-8 text-xs sm:text-sm md:text-base ${
                      plan.highlighted
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {plan.cta}
                  </button>

                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 sm:gap-3">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm md:text-base text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-32 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to Transform Your School?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 px-4">
            Join hundreds of schools already using EduMaster. Start your free 14-day trial today, no credit card required.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-slate-100 transition-all shadow-lg text-xs sm:text-sm md:text-base"
          >
            Start Free Trial
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}