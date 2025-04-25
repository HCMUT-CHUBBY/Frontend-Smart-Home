"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import home from '@/assests/smarthome/aa.jpg'
// Blog post types
interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  tags: string[];
}

const BlogPage: React.FC = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Sample blog data
  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "Smart Home Security: Protecting Your Digital Fortress",
      excerpt: "Learn how to keep your smart home secure from cyber threats and unauthorized access.",
      content: "As smart homes become increasingly popular, security concerns are on the rise...",
      author: "Nguyễn Bảo Trâm",
      date: "April 15, 2025",
      category: "Security",
      image: home.src,
      tags: ["security", "smart home", "cybersecurity"]
    },
    {
      id: 2,
      title: "Voice Assistants: The Future of Home Control",
      excerpt: "How voice technology is revolutionizing the way we interact with our homes.",
      content: "Voice assistants have come a long way since their introduction...",
      author: "Hồ Gia Thắng",
      date: "April 10, 2025",
      category: "Technology",
      image: home.src,
      tags: ["voice assistants", "AI", "smart home"]
    },
    {
      id: 3,
      title: "Energy Efficiency: Smart Solutions for a Greener Home",
      excerpt: "Discover how smart home technology can help reduce your energy consumption.",
      content: "With growing concerns about climate change, energy efficiency has become...",
      author: "Đặng Quốc Phú",
      date: "April 5, 2025",
      category: "Sustainability",
      image: home.src,
      tags: ["energy efficiency", "green living", "smart thermostats"]
    },
    {
      id: 4,
      title: "Smart Lighting: Creating the Perfect Atmosphere",
      excerpt: "How to use smart lighting to enhance your home's ambiance and functionality.",
      content: "Lighting plays a crucial role in setting the mood and functionality of a space...",
      author: "Mai Văn Hoàng Duy",
      date: "March 28, 2025",
      category: "Lifestyle",
      image: home.src,
      tags: ["smart lighting", "home decor", "automation"]
    },
    {
      id: 5,
      title: "The Connected Kitchen: Smart Appliances for Modern Cooking",
      excerpt: "Explore how smart kitchen appliances are transforming the culinary experience.",
      content: "The kitchen has always been the heart of the home, and now it's getting smarter...",
      author: "Nguyễn Huy Hoàng",
      date: "March 20, 2025",
      category: "Lifestyle",
      image: home.src,
      tags: ["kitchen", "appliances", "cooking"]
    },
    {
      id: 6,
      title: "Smart Home for Beginners: Where to Start",
      excerpt: "A comprehensive guide for those taking their first steps into the world of smart homes.",
      content: "Building a smart home can seem overwhelming at first, but with the right approach...",
      author: "Nguyễn Bảo Trâm",
      date: "March 15, 2025",
      category: "Guides",
      image: home.src,
      tags: ["beginners", "guide", "smart home basics"]
    }
  ];
  
  // Get unique categories
  const categories = ["all", ...Array.from(new Set(blogPosts.map(post => post.category)))];
  
  // Filter posts based on selected category
  const filteredPosts = selectedCategory === "all" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

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
            <Link href="/home/about/team" className="text-gray-400 hover:text-blue-400 transition-colors">Our Team</Link>
            <Link href="/home/blog" className="text-white font-medium">Blog</Link>
          </nav>
          
          {/* Mobile menu button */}
          <button className="md:hidden text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </header>
      
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-b from-gray-900 to-black py-16 mb-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Synapse <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Blog</span>
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-6"></div>
            <p className="text-gray-400">
              Discover the latest trends, tips, and insights about smart home technology and connected living.
            </p>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Blog posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => (
            <div 
              key={post.id} 
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="relative h-48 overflow-hidden">
                <Image 
                  src={post.image} 
                  alt={post.title} 
                  width={800} 
                  height={450}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-blue-500/90 text-white text-xs font-medium px-2 py-1 rounded-full">
                  {post.category}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 hover:text-blue-400 transition-colors cursor-pointer">
                  {post.title}
                </h3>
                <div className="flex items-center gap-3 mb-3 text-sm text-gray-400">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>By {post.author}</span>
                </div>
                <p className="text-gray-400 mb-4">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                <button 
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium flex items-center gap-2"
                  onClick={() => {
                    // In a real app, this would navigate to the blog post
                    alert(`Reading: ${post.title}`);
                  }}
                >
                  Read More
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Newsletter */}
        <div className="mt-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12">
          <div className="md:max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-gray-400 mb-6">
              Subscribe to our newsletter to receive the latest articles, tips, and updates about smart home technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-grow px-4 py-3 bg-gray-800 border border-gray-700 focus:border-blue-500 rounded-lg focus:outline-none text-white"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 whitespace-nowrap">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
     </div>
  );
}
export default BlogPage;