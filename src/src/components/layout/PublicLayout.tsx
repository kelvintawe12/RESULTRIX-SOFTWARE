import React, { useEffect, useState } from 'react';
import { Navbar } from '../common/Navbar';
import { Footer } from '../public/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUp } from 'lucide-react';
interface PublicLayoutProps {
  children: React.ReactNode;
}
export function PublicLayout({
  children
}: PublicLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  // Don't show back button on landing page
  const showBackButton = location.pathname !== '/';
  // Show scroll to top button when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  // Check if this is a content page (not landing page)
  const isLandingPage = location.pathname === '/';
  // Pages that should have a dark hero section
  const darkHeroPages = ['/about', '/features', '/pricing', '/security', '/contact', '/solutions/schools', '/solutions/universities', '/solutions/districts', '/case-studies', '/resources', '/blog'];
  const showDarkHero = darkHeroPages.includes(location.pathname);
  return <div className="min-h-screen flex flex-col bg-white font-sans">
      <Navbar />

      {/* Hero Section for Content Pages */}
      {!isLandingPage && (
        <div className={`w-full pt-16 ${showDarkHero ? 'bg-slate-900' : 'bg-slate-50'} transition-colors duration-300`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className={`text-3xl md:text-5xl font-bold mb-4 ${showDarkHero ? 'text-white' : 'text-slate-900'}`}>
                {location.pathname === '/about' && 'About Us'}
                {location.pathname === '/features' && 'Features'}
                {location.pathname === '/pricing' && 'Pricing'}
                {location.pathname === '/security' && 'Security'}
                {location.pathname === '/contact' && 'Contact Us'}
                {location.pathname === '/solutions/schools' && 'Solutions for Schools'}
                {location.pathname === '/solutions/universities' && 'Solutions for Universities'}
                {location.pathname === '/solutions/districts' && 'Solutions for Districts'}
                {location.pathname === '/resources' && 'Resources'}
                {location.pathname === '/case-studies' && 'Success Stories'}
                {location.pathname === '/blog' && 'Blog'}
              </h1>
              <p className={`text-lg max-w-2xl ${showDarkHero ? 'text-slate-300' : 'text-slate-600'}`}>
                {location.pathname === '/about' && 'Discover our mission to transform education management'}
                {location.pathname === '/features' && 'Explore the powerful features that make EduMaster the choice of leading institutions'}
                {location.pathname === '/pricing' && 'Simple, transparent pricing that works for schools of all sizes'}
                {location.pathname === '/security' && 'Enterprise-grade security to protect your institution\'s data'}
                {location.pathname === '/contact' && 'Get in touch with our team for questions or demos'}
                {location.pathname === '/solutions/schools' && 'Tailored solutions for primary and secondary schools'}
                {location.pathname === '/solutions/universities' && 'Comprehensive platform for higher education institutions'}
                {location.pathname === '/solutions/districts' && 'Centralized management for school districts'}
                {location.pathname === '/resources' && 'Helpful resources, guides, and support materials'}
                {location.pathname === '/case-studies' && 'See how leading educational institutions are transforming their operations with EduMaster'}
                {location.pathname === '/blog' && 'Latest insights, updates, and best practices for education management'}
              </p>
            </motion.div>
          </div>
        </div>
      )}

      <motion.main 
        className="flex-grow" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ 
          paddingTop: isLandingPage ? '0' : undefined
        }}
      >
        {children}
      </motion.main>

      {/* Back Button - Fixed position, bottom left */}
      <AnimatePresence>
        {showBackButton && <motion.button initial={{
        opacity: 0,
        x: -100
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: -100
      }} transition={{
        duration: 0.3
      }} onClick={() => navigate(-1)} className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-white text-slate-700 rounded-full shadow-lg border border-slate-200 hover:shadow-xl hover:border-slate-400 hover:text-slate-900 transition-all group">
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Back</span>
          </motion.button>}
      </AnimatePresence>

      {/* Scroll to Top Button - Fixed position, bottom right */}
      <AnimatePresence>
        {showScrollTop && <motion.button initial={{
        opacity: 0,
        scale: 0.8,
        y: 100
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} exit={{
        opacity: 0,
        scale: 0.8,
        y: 100
      }} transition={{
        duration: 0.3
      }} onClick={scrollToTop} className="fixed bottom-6 right-6 z-50 p-4 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-900 hover:shadow-xl transition-all group" aria-label="Scroll to top">
            <ArrowUp className="h-5 w-5 group-hover:-translate-y-1 transition-transform" />
          </motion.button>}
      </AnimatePresence>

      <Footer />
    </div>;
}

