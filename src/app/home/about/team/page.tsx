"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import duy from '@/assests/qwq.jpg'
const TeamPage: React.FC = () => {
  const router = useRouter();
  
  // Team member data
  const teamMembers = [
    {
      id: 1,
      name: "Nguyễn Bảo Trâm",
      studentId: "2213572",
      role: "Backend Developer",
      bio: "Specializes in creating beautiful user interfaces with React and Next.js.",
      image: duy.src
    },
    {
      id: 2,
      name: "Hồ Gia Thắng",
      studentId: "2213187",
      role: "Backend Developer",
      bio: "Expert in building robust server-side applications and APIs.",
      image: duy.src
    },
    {
      id: 3,
      name: "Đặng Quốc Phú",
      studentId: "2212576",
      role: "IOT",
      bio: "Creates intuitive and engaging user experiences for our products.",
      image: duy.src
    },
    {
      id: 4,
      name: "Mai Văn Hoàng Duy",
      studentId: "2210508",
      role: "Frontend Developer",
      bio: "Ensures smooth deployment and operation of our applications.",
      image: duy.src
    },
    {
      id: 5,
      name: "Nguyễn Huy Hoàng",
      studentId: "2211091",
      role: "Backend Developer",
      bio: "Makes sure our products meet the highest quality standards.",
      image: duy.src
    }
  ];

  return (
    <div className="min-h-screen bg-gray-700 text-white pt-24">
      {/* Header with navigation */}
      <header className="fixed w-full top-0 z-50 bg-black/80 backdrop-blur-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2" onClick={() => router.push('/')} style={{cursor: 'pointer'}}>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">SH</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Synapse Home</span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-400 hover:text-blue-400 transition-colors">Home</Link>
            <Link href="/home/product" className="text-gray-400 hover:text-blue-400 transition-colors">Products</Link>
            <Link href="/home/about/team" className="text-white font-medium">Our Team</Link>
            <Link href="/home/blog" className="text-gray-400 hover:text-blue-400 transition-colors">Blog</Link>
          </nav>
          
          {/* Mobile menu button */}
          <button className="md:hidden text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        {/* Page heading */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Meet Our <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Team</span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-6"></div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our talented team of developers, designers, and engineers are dedicated to creating the smart home solutions of tomorrow.
          </p>
        </div>
        
        {/* Team grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div 
              key={member.id} 
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="relative h-64 overflow-hidden group">
                <Image 
                  src={member.image} 
                  alt={member.name} 
                  width={300} 
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                    <p className="text-blue-400">{member.role}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-sm text-gray-400 mb-1">Student ID: {member.studentId}</p>
                <p className="text-blue-400 mb-3">{member.role}</p>
                <p className="text-gray-400">{member.bio}</p>
                
                <div className="mt-4 flex gap-3">
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Team vision section */}
        <div className="mt-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mb-6"></div>
              <p className="text-gray-400 mb-4">
                At Synapse Home, we believe in creating technology that seamlessly integrates into your life, enhancing comfort, security, and efficiency without complexity.
              </p>
              <p className="text-gray-400">
                Our team combines expertise in software development, design, engineering, and user experience to build smart home solutions that are both powerful and intuitive.
              </p>
              
              <div className="mt-8">
                <Link 
                  href="/about/mission" 
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 inline-block"
                >
                  Learn About Our Mission
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
              <div className="relative bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">Team Values</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Innovation</h4>
                      <p className="text-sm text-gray-400">Pushing boundaries to create solutions that truly improve lives.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Simplicity</h4>
                      <p className="text-sm text-gray-400">Creating technology that&#39;s powerful yet easy to use.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 bg-pink-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Quality</h4>
                      <p className="text-sm text-gray-400">Building reliable products that stand the test of time.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Collaboration</h4>
                      <p className="text-sm text-gray-400">Working together to achieve extraordinary results.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 Synapse Home. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="text-gray-500 hover:text-blue-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-blue-400 transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-blue-400 transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TeamPage;