import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { BookOpen, FileText, Video, ArrowRight } from 'lucide-react';
const categories = ['All Resources', 'Getting Started', 'Best Practices', 'Platform Updates'];
const resources = [{
  title: 'Getting Started Guide',
  category: 'Getting Started',
  type: 'Guide',
  icon: BookOpen,
  description: 'A comprehensive guide to setting up your school instance for the first time.'
}, {
  title: 'Fee Collection Best Practices',
  category: 'Best Practices',
  type: 'Article',
  icon: FileText,
  description: 'Learn how top schools are improving their fee collection rates by up to 40%.'
}, {
  title: 'New Gradebook Features',
  category: 'Platform Updates',
  type: 'Video',
  icon: Video,
  description: 'Walkthrough of the new grading interface and reporting tools.'
}, {
  title: 'Parent Communication 101',
  category: 'Best Practices',
  type: 'Guide',
  icon: BookOpen,
  description: 'Strategies for keeping parents engaged and informed throughout the year.'
}, {
  title: 'Importing Student Data',
  category: 'Getting Started',
  type: 'Video',
  icon: Video,
  description: 'Step-by-step tutorial on bulk importing student records from Excel.'
}, {
  title: 'Security Whitepaper',
  category: 'Best Practices',
  type: 'Article',
  icon: FileText,
  description: 'Deep dive into our security infrastructure and data protection measures.'
}, {
  title: 'Mobile App Launch',
  category: 'Platform Updates',
  type: 'Article',
  icon: FileText,
  description: 'Announcing our new mobile application for parents and teachers.'
}, {
  title: 'Teacher Training Deck',
  category: 'Getting Started',
  type: 'Guide',
  icon: BookOpen,
  description: 'Presentation slides to help you train your staff on the new system.'
}, {
  title: 'End of Term Checklist',
  category: 'Best Practices',
  type: 'Guide',
  icon: BookOpen,
  description: 'Ensure you have everything wrapped up correctly before the break.'
}];
export function ResourcesPage() {
  return (
      <>
      {/* Categories */}
      <section className="border-b border-slate-200 bg-white sticky top-16 z-10 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex overflow-x-auto py-4 space-x-8 no-scrollbar">
            {categories.map((cat, index) => <button key={index} className={`whitespace-nowrap text-sm font-medium transition-colors ${index === 0 ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-600 hover:text-blue-600'}`}>
                {cat}
              </button>)}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 bg-slate-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" initial="hidden" whileInView="visible" viewport={{
          once: true
        }} variants={{
          hidden: {
            opacity: 0
          },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}>
            {resources.map((resource, index) => <motion.div key={index} variants={{
            hidden: {
              opacity: 0,
              y: 20
            },
            visible: {
              opacity: 1,
              y: 0
            }
          }}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer border-slate-200 p-0">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <resource.icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {resource.type}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3">
                      {resource.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {resource.description}
                    </p>
                    <div className="text-blue-600 font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform">
                      Read More <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </Card>
              </motion.div>)}
          </motion.div>
        </div>
      </section>
      </>
  );
}