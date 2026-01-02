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
  return <div className="min-h-screen flex flex-col bg-white font-sans">
      <Navbar />

      <motion.main className="flex-grow pt-16" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.5
    }}>
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
      }} onClick={() => navigate(-1)} className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-white text-slate-700 rounded-full shadow-lg border border-slate-200 hover:shadow-xl hover:border-indigo-300 hover:text-indigo-600 transition-all group">
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
      }} onClick={scrollToTop} className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all group" aria-label="Scroll to top">
            <ArrowUp className="h-5 w-5 group-hover:-translate-y-1 transition-transform" />
          </motion.button>}
      </AnimatePresence>

      <Footer />
    </div>;
}