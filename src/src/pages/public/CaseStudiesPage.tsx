import React from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { TrendingUp, Clock, CheckCircle, Quote, MapPin } from 'lucide-react';
const caseStudies = [{
  id: 1,
  school: 'Greenwood Academy',
  location: 'London, UK',
  image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  challenge: 'Struggling with fragmented systems for attendance, grading, and communication, leading to 15+ hours of weekly admin overhead per teacher.',
  solution: "Implemented EduMaster's all-in-one platform to unify academic and administrative workflows.",
  results: ['Reduced admin time by 65%', '100% digitization of student records', 'Improved parent engagement by 40%'],
  quote: "EduMaster didn't just digitize our records; it transformed our entire school culture. Teachers can finally focus on teaching instead of paperwork.",
  author: 'Sarah Jenkins',
  role: 'Principal'
}, {
  id: 2,
  school: 'Riverside High School',
  location: 'California, USA',
  image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  challenge: 'Facing significant revenue leakage due to manual fee tracking and lack of automated payment reminders.',
  solution: "Deployed EduMaster's Financial Suite with automated invoicing and online payment gateway integration.",
  results: ['98% fee collection rate (up from 82%)', 'Reduced overdue payments by 75%', 'Saved $12k annually in administrative costs'],
  quote: 'The ROI was immediate. The automated fee reminders alone recovered enough revenue in the first month to pay for the annual subscription.',
  author: 'Michael Chen',
  role: 'Bursar'
}, {
  id: 3,
  school: 'International School of Lagos',
  location: 'Lagos, Nigeria',
  image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  challenge: 'Needed a reliable, offline-capable solution to manage 2,000+ students across multiple campuses with intermittent internet access.',
  solution: "Utilized EduMaster's PWA capabilities and multi-campus management features.",
  results: ['Seamless multi-campus synchronization', 'Zero downtime during outages', 'Standardized curriculum across all branches'],
  quote: "EduMaster's offline capabilities are a game-changer for us. We can continue operations smoothly regardless of connectivity issues.",
  author: 'Dr. Adebayo Okafor',
  role: 'Director of Studies'
}];
export function CaseStudiesPage() {
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
              Success Stories
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              See how leading educational institutions around the world are
              transforming their operations with EduMaster.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Case Studies List */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {caseStudies.map((study, index) => <motion.div key={study.id} initial={{
          opacity: 0,
          y: 40
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true,
          margin: '-100px'
        }} transition={{
          duration: 0.8
        }} className={`flex flex-col lg:flex-row gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              {/* Image Side */}
              <div className="w-full lg:w-1/2">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                  <div className="absolute inset-0 bg-indigo-900/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  <img src={study.image} alt={study.school} className="w-full h-[400px] object-cover transform group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                    <div className="flex items-center text-white gap-2">
                      <MapPin className="h-5 w-5 text-indigo-400" />
                      <span className="font-medium">{study.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Side */}
              <div className="w-full lg:w-1/2 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {study.school}
                  </h2>
                  <div className="h-1 w-20 bg-indigo-600 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> The Challenge
                    </h3>
                    <p className="text-slate-600 text-sm">{study.challenge}</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> The Solution
                    </h3>
                    <p className="text-slate-600 text-sm">{study.solution}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" /> Key
                    Results
                  </h3>
                  <ul className="space-y-2">
                    {study.results.map((result, i) => <li key={i} className="flex items-center text-slate-700">
                        <div className="h-2 w-2 rounded-full bg-indigo-600 mr-3" />
                        {result}
                      </li>)}
                  </ul>
                </div>

                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 relative">
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-indigo-200" />
                  <p className="text-slate-700 italic mb-4 relative z-10">
                    "{study.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                      {study.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {study.author}
                      </p>
                      <p className="text-slate-500 text-xs">{study.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>)}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to write your success story?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Join over 500 schools transforming their education management with
            EduMaster.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 border-0">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-indigo-200 text-white hover:bg-indigo-700">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>;
}