import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Calendar, Clock, ArrowRight } from 'lucide-react';
const categories = ['All', 'Product Updates', 'Best Practices', 'Case Studies', 'Tips & Tricks'];
const blogPosts = [{
  id: 1,
  title: 'The Future of EdTech: Trends to Watch in 2024',
  excerpt: 'Explore the emerging technologies shaping the classroom of tomorrow, from AI-driven personalized learning to immersive VR experiences.',
  date: 'Mar 15, 2024',
  author: 'Dr. Emily Carter',
  category: 'Best Practices',
  readTime: '5 min read',
  image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
}, {
  id: 2,
  title: 'Introducing Advanced Analytics Dashboard',
  excerpt: 'We are thrilled to launch our new analytics suite, giving school administrators unprecedented visibility into academic performance and financial health.',
  date: 'Mar 10, 2024',
  author: 'Product Team',
  category: 'Product Updates',
  readTime: '3 min read',
  image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
}, {
  id: 3,
  title: '5 Ways to Improve Parent-Teacher Communication',
  excerpt: 'Effective communication is the backbone of student success. Learn actionable strategies to bridge the gap between home and school.',
  date: 'Feb 28, 2024',
  author: 'Sarah Jenkins',
  category: 'Tips & Tricks',
  readTime: '4 min read',
  image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
}, {
  id: 4,
  title: 'How Riverside High Saved $12k Annually',
  excerpt: 'A deep dive into how one high school transformed their financial operations and recovered lost revenue using EduMaster.',
  date: 'Feb 15, 2024',
  author: 'Michael Chen',
  category: 'Case Studies',
  readTime: '6 min read',
  image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
}, {
  id: 5,
  title: 'Streamlining Report Card Generation',
  excerpt: 'Stop spending weekends on grading. Discover how to automate report card generation while maintaining personalized feedback.',
  date: 'Feb 02, 2024',
  author: 'James Wilson',
  category: 'Tips & Tricks',
  readTime: '4 min read',
  image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
}, {
  id: 6,
  title: 'Security Best Practices for Schools',
  excerpt: 'Data privacy is non-negotiable. Learn the essential security protocols every modern educational institution needs to implement.',
  date: 'Jan 25, 2024',
  author: 'Security Team',
  category: 'Best Practices',
  readTime: '7 min read',
  image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
}];
export function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  return <PublicLayout>
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-4xl md:text-5xl font-bold mb-6">
            EduMaster Blog
          </motion.h1>
          <motion.p initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.1
        }} className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Insights, updates, and resources for modern school administrators
            and educators.
          </motion.p>

          {/* Search Bar */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2
        }} className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input type="text" placeholder="Search articles..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-sm transition-all" />
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map(cat => <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'}`}>
                {cat}
              </button>)}
          </div>

          {/* Blog Grid */}
          {filteredPosts.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => <motion.div key={post.id} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full group">
                  <div className="relative h-48 overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-600 uppercase tracking-wide">
                      {post.category}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.readTime}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-slate-600 text-sm mb-6 flex-1 leading-relaxed">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {post.author.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {post.author}
                        </span>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>)}
            </div> : <div className="text-center py-20">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No articles found
              </h3>
              <p className="text-slate-500">
                We couldn't find any posts matching "{searchQuery}". Try a
                different search term.
              </p>
            </div>}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Subscribe to our newsletter
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Get the latest insights, tips, and product updates delivered
            straight to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input placeholder="Enter your email address" className="flex-1" />
            <Button>Subscribe</Button>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            We care about your data in our{' '}
            <a href="/privacy" className="underline hover:text-slate-600">
              privacy policy
            </a>
            .
          </p>
        </div>
      </section>
    </PublicLayout>;
}