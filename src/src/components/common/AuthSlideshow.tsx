import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface Slide {
  title: string;
  description: string;
  image: string;
  color: string;
}
const slides: Slide[] = [{
  title: 'Comprehensive Student Management',
  description: 'Track student records, academic performance, and attendance all in one place.',
  image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
  color: 'from-blue-600 to-blue-800'
}, {
  title: 'Real-Time Analytics',
  description: 'Make data-driven decisions with powerful analytics and reporting tools.',
  image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  color: 'from-purple-600 to-purple-800'
}, {
  title: 'Seamless Fee Management',
  description: 'Automate fee collection, generate receipts, and track payments effortlessly.',
  image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
  color: 'from-green-600 to-green-800'
}, {
  title: 'Automated Report Cards',
  description: 'Generate professional report cards with customizable grading scales.',
  image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
  color: 'from-amber-600 to-amber-800'
}];
export function AuthSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };
  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };
  return <div className="relative h-full w-full overflow-hidden bg-slate-900">
      {/* Slides */}
      {slides.map((slide, index) => <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.color} opacity-90`} />
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-12 text-white">
            <div className="max-w-xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-4xl font-bold leading-tight">
                {slide.title}
              </h2>
              <p className="text-lg text-white/90">{slide.description}</p>
            </div>
          </div>
        </div>)}

      {/* Navigation Arrows */}
      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors">
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors">
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => <button key={index} onClick={() => goToSlide(index)} className={`h-2 rounded-full transition-all ${index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'}`} />)}
      </div>
    </div>;
}