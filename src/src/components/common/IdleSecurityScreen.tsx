import React, { useEffect, useState, useId, createElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, Eye, MousePointer, CheckCircle } from 'lucide-react';
import { useIdleDetection } from '../../hooks/useIdleDetection';
const slides = [{
  id: 1,
  text: 'Your session is still active',
  icon: Lock,
  color: 'text-blue-600',
  bg: 'bg-blue-50',
  gradient: 'from-blue-500/20 to-blue-600/5'
}, {
  id: 2,
  text: "Step away? We've got you covered",
  icon: Shield,
  color: 'text-green-600',
  bg: 'bg-green-50',
  gradient: 'from-green-500/20 to-green-600/5'
}, {
  id: 3,
  text: 'Security first, always',
  icon: Eye,
  color: 'text-purple-600',
  bg: 'bg-purple-50',
  gradient: 'from-purple-500/20 to-purple-600/5'
}, {
  id: 4,
  text: 'Move your mouse to continue',
  icon: MousePointer,
  color: 'text-amber-600',
  bg: 'bg-amber-50',
  gradient: 'from-amber-500/20 to-amber-600/5'
}, {
  id: 5,
  text: 'Your data is protected',
  icon: CheckCircle,
  color: 'text-emerald-600',
  bg: 'bg-emerald-50',
  gradient: 'from-emerald-500/20 to-emerald-600/5'
}];
export function IdleSecurityScreen() {
  const {
    isIdle
  } = useIdleDetection(5 * 60 * 1000); // 5 minutes
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    if (!isIdle) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isIdle]);
  if (!isIdle) return null;
  return <AnimatePresence>
      {isIdle && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} transition={{
      duration: 0.5
    }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl">
          <div className="relative w-full max-w-lg p-8 mx-4 text-center">
            <AnimatePresence mode="wait">
              <motion.div key={currentSlide} initial={{
            opacity: 0,
            y: 20,
            scale: 0.95
          }} animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }} exit={{
            opacity: 0,
            y: -20,
            scale: 0.95
          }} transition={{
            duration: 0.5,
            ease: 'easeOut'
          }} className="relative z-10 flex flex-col items-center">
                {/* Icon Container */}
                <div className={`w-32 h-32 mb-8 rounded-3xl flex items-center justify-center shadow-2xl ${slides[currentSlide].bg} relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].gradient}`} />
                  {createElement(slides[currentSlide].icon, {
                className: `w-16 h-16 ${slides[currentSlide].color} relative z-10`,
                strokeWidth: 1.5
              })}
                </div>

                {/* Text */}
                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight drop-shadow-md">
                  {slides[currentSlide].text}
                </h2>
                <p className="text-slate-300 text-lg font-medium">
                  Your session is locked due to inactivity
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Progress Indicators */}
            <div className="absolute bottom-[-60px] left-0 right-0 flex justify-center gap-3">
              {slides.map((_, index) => <motion.div key={index} className={`h-1.5 rounded-full transition-colors duration-300 ${index === currentSlide ? 'bg-white w-8' : 'bg-white/20 w-2'}`} layoutId={`indicator-${index}`} />)}
            </div>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          </div>
        </motion.div>}
    </AnimatePresence>;
}