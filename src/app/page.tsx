"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import LogoLight from '@/assests/illumination.svg'
import homesvg from '@/assests/ah1.svg'

const HomePage: React.FC = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleSignUp = () => {
    router.push('/auth/register');
  };
  

  return (
    <div className="min-h-screen bg-gray-700 text-white">
      {/* Header with glass effect */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
   <Image 
     src={LogoLight.src} // <<< QUAN TRỌNG: Truy cập thuộc tính .src từ object import
     alt="Smartt Logo" 
     width={60}         // <<< Vẫn truyền width, height để next/image biết kích thước
     height={24}
     className="object-contain" // Giữ class này nếu cần
   />
   <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Synapse Home</span>
 </div>
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="group relative">
              <span className="cursor-pointer hover:text-blue-400 transition-colors">
                Product
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </span>
            </div>
            
            <div className="group relative">
            {/* Thêm padding-bottom (ví dụ pb-2) vào span này */}
            <span className="cursor-pointer hover:text-blue-400 transition-colors inline-block pb-2 mt-2"> {/* Đổi thành inline-block hoặc block nếu cần để padding có hiệu lực */}
              About
              {/* Giữ nguyên span cho hiệu ứng gạch chân */}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
            </span>
            {/* Xóa mt-2 khỏi div dropdown này */}
            <div className="absolute hidden group-hover:block top-full left-0 p-2 bg-gray-900 rounded-md shadow-lg min-w-40 border border-gray-800 z-20"> 
              <Link href="/home/about/team" className="block py-2 px-4 hover:bg-gray-800 rounded transition-colors">
                Our Team
              </Link>
              <Link href="/about/mission" className="block py-2 px-4 hover:bg-gray-800 rounded transition-colors">
                Our Mission
              </Link>
            </div>
          </div>
            
            <div className="group relative">
           {/* Đổi span thành Link */}
           <Link href="/home/contract" className="cursor-pointer hover:text-blue-400 transition-colors">
             Contract
             {/* Hiệu ứng gạch chân vẫn nằm bên trong Link */}
             <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
           </Link>
         </div>
            <div className="group relative">
            {/* Đổi span thành Link */}
           <Link href="/home/blog" className="cursor-pointer hover:text-blue-400 transition-colors">
             Blog
             {/* Hiệu ứng gạch chân vẫn nằm bên trong Link */}
             <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
           </Link>
         </div>
          </nav>
          
          {/* Mobile menu button */}
          <button className="md:hidden text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </header>
      
      {/* Hero Section */}
      <main className="pt-24">
        <div className="container mx-auto px-4 min-h-screen flex flex-col-reverse md:flex-row items-center">
          {/* Hero Content */}
          <div className="md:w-1/2 space-y-6 text-center md:text-left" data-aos="fade-right">
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
              Synapse Home
              </span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-300">
              Empowering Your Home,<br />
              Enriching Your Life
            </h2>
            <p className="text-gray-400 max-w-md">
              Unlock the potential of your home with our revolutionary smart solution that connects your devices seamlessly for a more comfortable and efficient lifestyle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button 
                onClick={handleLogin}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1"
              >
                Log in
              </button>
              <button 
                onClick={handleSignUp}
                className="px-6 py-3 bg-transparent border border-blue-500 rounded-full font-medium hover:bg-blue-500/10 transition-all duration-300 transform hover:-translate-y-1"
              >
                Sign up
              </button>
            </div>
            
            {/* Floating stats */}
            <div className="flex justify-center md:justify-start gap-6 mt-8">
              <div className="bg-gray-900/80 backdrop-blur-md p-3 rounded-lg shadow-lg">
                <div className="text-2xl font-bold text-blue-400">50+</div>
                <div className="text-sm text-gray-400">Smart Devices</div>
              </div>
              <div className="bg-gray-900/80 backdrop-blur-md p-3 rounded-lg shadow-lg">
                <div className="text-2xl font-bold text-purple-400">24/7</div>
                <div className="text-sm text-gray-400">Support</div>
              </div>
              <div className="bg-gray-900/80 backdrop-blur-md p-3 rounded-lg shadow-lg">
                <div className="text-2xl font-bold text-pink-400">99%</div>
                <div className="text-sm text-gray-400">Satisfaction</div>
              </div>
            </div>
          </div>
          

          {/* Hero Image */}
          <div className="md:w-1/2 relative mb-8 md:mb-0" data-aos="fade-left">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-30 blur-3xl animate-pulse"></div>
              <Image 
                src={homesvg.src} 
                alt="Smart Home Device" 
                width={600}
                height={500}
                className="relative z-10 rounded-2xl transform transition-transform duration-500 hover:scale-105"
              />
              
              {/* Floating elements */}
              <div className="absolute top-1/4 -left-6 w-12 h-12 bg-blue-500 rounded-full opacity-30 animate-float"></div>
              <div className="absolute bottom-1/3 -right-4 w-8 h-8 bg-purple-500 rounded-full opacity-30 animate-float-delayed"></div>
            </div>
          </div>
        </div>
        
        {/* Features section teaser */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Discover Smart Features</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Energy Efficient</h3>
              <p className="text-gray-400">Optimize your home&#39;s energy consumption with smart monitoring and automation.</p>
            </div>
            
            {/* Feature Card 2 */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Enhanced Security</h3>
              <p className="text-gray-400">Keep your home safe with intelligent security systems and real-time monitoring.</p>
            </div>
            
            {/* Feature Card 3 */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Voice Control</h3>
              <p className="text-gray-400">Control your entire home with simple voice commands through our smart assistant.</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gradient-to-b from-black to-gray-900 pt-16 pb-8 border-t border-gray-800">
  {/* Animated wave divider */}
  <div className="relative -mt-24 mb-12 h-24 overflow-hidden">
    <svg className="absolute bottom-0 w-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path fill="rgba(17, 24, 39, 0.8)" fillOpacity="1" 
        d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,208C672,192,768,128,864,122.7C960,117,1056,171,1152,176C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
        <animate attributeName="d" 
          dur="12s" 
          repeatCount="indefinite" 
          values="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,208C672,192,768,128,864,122.7C960,117,1056,171,1152,176C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                 M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,176C672,181,768,235,864,240C960,245,1056,203,1152,197.3C1248,192,1344,224,1392,240L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                 M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,208C672,192,768,128,864,122.7C960,117,1056,171,1152,176C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;" 
        />
      </path>
    </svg>
  </div>

  <div className="container mx-auto px-4">
    {/* Main footer content */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      {/* Company Info */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
            <Image src={LogoLight} alt="Synapse Home Logo" width={48} height={48} className="object-contain" />
          </div>
          <div>
            <h3 className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Synapse Home</h3>
            <p className="text-gray-400 text-sm">Smarter living, better life</p>
          </div>
        </div>
        <p className="text-gray-400 max-w-xs">
          Transforming everyday homes into intelligent living spaces with cutting-edge smart home solutions.
        </p>
        <div className="flex gap-4">
          <a href="#" className="group">
            <div className="bg-gray-800 p-2 rounded-full group-hover:bg-blue-600 transition-all duration-300 transform group-hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-white">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </div>
          </a>
          <a href="#" className="group">
            <div className="bg-gray-800 p-2 rounded-full group-hover:bg-pink-600 transition-all duration-300 transform group-hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>
          </a>
          <a href="#" className="group">
            <div className="bg-gray-800 p-2 rounded-full group-hover:bg-blue-800 transition-all duration-300 transform group-hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-white">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </div>
          </a>
          <a href="#" className="group">
            <div className="bg-gray-800 p-2 rounded-full group-hover:bg-gray-600 transition-all duration-300 transform group-hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
          </a>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h4 className="text-lg font-semibold mb-6 text-white relative inline-block">
          Quick Links
          <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"></span>
        </h4>
        <ul className="space-y-3">
          <li>
            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full transform scale-0 group-hover:scale-100 transition-transform"></span>
              Home
            </a>
          </li>
          <li>
            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full transform scale-0 group-hover:scale-100 transition-transform"></span>
              Products
            </a>
          </li>
          <li>
            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full transform scale-0 group-hover:scale-100 transition-transform"></span>
              Solutions
            </a>
          </li>
          <li>
            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full transform scale-0 group-hover:scale-100 transition-transform"></span>
              About Us
            </a>
          </li>
          <li>
            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full transform scale-0 group-hover:scale-100 transition-transform"></span>
              Blog
            </a>
          </li>
          <li>
            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full transform scale-0 group-hover:scale-100 transition-transform"></span>
              Contact
            </a>
          </li>
        </ul>
      </div>

      {/* Products */}
      <div>
        <h4 className="text-lg font-semibold mb-6 text-white relative inline-block">
          Our Products
          <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"></span>
        </h4>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <div className="min-w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
            </div>
            <div>
              <h5 className="text-white text-sm font-medium">Smart Lighting</h5>
              <p className="text-gray-400 text-xs">Intelligent lighting solutions for optimal comfort</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="min-w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h5 className="text-white text-sm font-medium">Security Systems</h5>
              <p className="text-gray-400 text-xs">Advanced protection for your home and family</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="min-w-8 h-8 bg-pink-500/20 rounded flex items-center justify-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </div>
            <div>
              <h5 className="text-white text-sm font-medium">Climate Control</h5>
              <p className="text-gray-400 text-xs">Energy-efficient temperature management</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Newsletter */}
      <div>
        <h4 className="text-lg font-semibold mb-6 text-white relative inline-block">
          Stay Updated
          <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"></span>
        </h4>
        <p className="text-gray-400 mb-4">Subscribe to our newsletter for the latest updates and offers.</p>
        <form className="space-y-3">
          <div className="relative">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg py-2.5 px-4 text-white font-medium w-full hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
            Subscribe
          </button>
        </form>
        <div className="mt-6">
          <h5 className="text-white text-sm font-medium mb-3">Contact Info</h5>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>info@synapsehome.com</span>
            </div>
            <div className="flex items-start gap-2 text-gray-400 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>123 Innovation Street, Tech City, CA 94043, USA</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
    </footer>
      {/* Add some extra CSS for animations */}
      <style jsx>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes float-delayed {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HomePage;