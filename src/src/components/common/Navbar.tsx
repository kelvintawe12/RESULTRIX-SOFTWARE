import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { School, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    setIsOpen(false);
    setActiveDropdown(null);
  }, [location]);
  const navLinks = [{
    name: 'Product',
    dropdown: [{
      name: 'Features',
      path: '/features'
    }, {
      name: 'Pricing',
      path: '/pricing'
    }, {
      name: 'Security',
      path: '/security'
    }]
  }, {
    name: 'Solutions',
    dropdown: [{
      name: 'For Schools',
      path: '/solutions/schools'
    }, {
      name: 'For Universities',
      path: '/solutions/universities'
    }, {
      name: 'For Districts',
      path: '/solutions/districts'
    }]
  }, {
    name: 'Resources',
    path: '/resources'
  }, {
    name: 'About',
    path: '/about'
  }, {
    name: 'Contact',
    path: '/contact'
  }];
  return <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
              <School className="w-6 h-6 text-white" />
            </div>
            <span className={`font-bold text-xl transition-colors ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
              EduMaster
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => <div key={link.name} className="relative" onMouseEnter={() => link.dropdown && setActiveDropdown(link.name)} onMouseLeave={() => setActiveDropdown(null)}>
                {link.dropdown ? <>
                    <button className={`flex items-center gap-1 text-sm font-medium transition-colors ${isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/90 hover:text-white'}`}>
                      {link.name}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {activeDropdown === link.name && <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {link.dropdown.map(item => <Link key={item.path} to={item.path} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                            {item.name}
                          </Link>)}
                      </div>}
                  </> : <Link to={link.path!} className={`text-sm font-medium transition-colors ${isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/90 hover:text-white'}`}>
                    {link.name}
                  </Link>}
              </div>)}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsOpen(!isOpen)} className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? 'text-slate-900 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && <div className="md:hidden bg-white border-t border-slate-200 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map(link => <div key={link.name}>
                {link.dropdown ? <>
                    <button onClick={() => setActiveDropdown(activeDropdown === link.name ? null : link.name)} className="flex items-center justify-between w-full text-left text-slate-900 font-medium py-2">
                      {link.name}
                      <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === link.name ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === link.name && <div className="pl-4 space-y-2 mt-2">
                        {link.dropdown.map(item => <Link key={item.path} to={item.path} className="block text-slate-600 hover:text-blue-600 py-1 transition-colors">
                            {item.name}
                          </Link>)}
                      </div>}
                  </> : <Link to={link.path!} className="block text-slate-900 font-medium py-2 hover:text-blue-600 transition-colors">
                    {link.name}
                  </Link>}
              </div>)}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <Link to="/login" className="block">
                <Button variant="secondary" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup" className="block">
                <Button variant="primary" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>}
    </nav>;
}