"use client";

import { useState, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LogoLight from '@/assests/illumination.svg'; // Assuming this path is correct

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (password !== confirmPassword) {
      // Translated error message
      setError("Passwords do not match. Please check again.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Ensure the API endpoint is correct
      const response = await axios.post("http://localhost:8080/api/v1/auth/register", {
        username,
        password,
        firstName,
        lastName,
        phoneNumber,
      });

      // Check backend response carefully (adjust if needed)
      if (response.data === "User registered successfully") {
        router.push("/auth/login");
      } else {
         // Handle other potential success messages or scenarios if needed
         console.log("Registration response:", response.data);
         // Optionally, show a success message before redirecting
         // toast.success("Registration successful! Redirecting to login...");
         router.push("/auth/login");
      }
    } catch (error: unknown) {
       // Translated error messages
      if (axios.isAxiosError(error) && error.response) {
        setError(`Sign up failed. ${error.response.data?.message || error.response.data}`); // Try to get message field first
      } else if (error instanceof Error) {
        setError(`Sign up failed. ${error.message}`);
      } else {
        setError("Sign up failed. An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Main container with dark background and relative positioning
    <div className="min-h-screen bg-black flex flex-col text-white overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-blue-500/10 animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-purple-500/10 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-cyan-500/5 animate-pulse delay-1000"></div>

        {/* Decorative gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-900/20 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-20 bg-gradient-to-l from-purple-900/20 to-transparent"></div>
      </div>

      {/* Header */}
      <header className="w-full z-10 bg-black/80 backdrop-blur-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <Image
              src={LogoLight.src} // Ensure LogoLight is imported correctly
              alt="Synapse Logo"
              width={60} // Adjust size as needed
              height={24}
              className="object-contain"
            />
            <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Synapse Home
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {/* Translated Links */}
            <Link href="/" className="hover:text-blue-400 transition-colors">
              Home
            </Link>
            <Link href="/auth/login" className="hover:text-blue-400 transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 z-10">
        <div className="container mx-auto max-w-2xl">
          {/* Form container with blur effect */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden shadow-2xl p-8 md:p-10">
            {/* Form Header */}
            <div className="text-center mb-8">
              {/* Translated Title */}
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Create Your Account
              </h1>
              {/* Translated Subtitle */}
              <p className="text-gray-300">
                Create an account to start experiencing your smart home.
              </p>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name and Last Name grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   {/* Translated Label */}
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    // Translated Placeholder
                    placeholder="Enter your first name"
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                   {/* Translated Label */}
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                     // Translated Placeholder
                    placeholder="Enter your last name"
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Username (might be email) */}
              <div>
                 {/* Translated Label */}
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  // Consider type="email" if it's always an email
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  // Translated Placeholder
                  placeholder="Enter your username (e.g., email)"
                  className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Phone number */}
              <div>
                {/* Translated Label */}
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  // Translated Placeholder
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required // Adjust if phone number is optional
                  disabled={isLoading}
                />
              </div>

              {/* Password fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {/* Translated Label */}
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    // Translated Placeholder
                    placeholder="Create a password"
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  {/* Translated Label */}
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                     // Translated Placeholder
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Terms and conditions */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="ml-3 text-sm">
                  {/* Translated Label and Links */}
                  <label htmlFor="terms" className="text-gray-300">
                    I agree to the <a href="#" className="text-blue-400 hover:text-blue-300 underline">Terms of Service</a> and <a href="#" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</a>
                  </label>
                </div>
              </div>

              {/* Error message display */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm animate-pulse">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? (
                  // Loading spinner and translated text
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                   // Translated Button Text
                  'Sign Up'
                )}
              </button>
            </form>

            {/* Link to Login page */}
            <p className="mt-6 text-center text-gray-300">
               {/* Translated Text and Link */}
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium underline">
                Login
              </Link>
            </p>
          </div>

          {/* Features section below the form */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
             {/* Translated Feature Blocks */}
            <div className="p-4 bg-blue-900/20 backdrop-blur-sm rounded-lg">
              <div className="inline-flex items-center justify-center rounded-full bg-blue-500/20 p-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Safe & Secure</h3>
              <p className="mt-1 text-sm text-gray-300">Protect your home with our smart security system.</p>
            </div>

            <div className="p-4 bg-purple-900/20 backdrop-blur-sm rounded-lg">
              <div className="inline-flex items-center justify-center rounded-full bg-purple-500/20 p-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Energy Saving</h3>
              <p className="mt-1 text-sm text-gray-300">Optimize your home&#39;s energy consumption.</p>
            </div>

            <div className="p-4 bg-pink-900/20 backdrop-blur-sm rounded-lg">
              <div className="inline-flex items-center justify-center rounded-full bg-pink-500/20 p-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Remote Control</h3>
              <p className="mt-1 text-sm text-gray-300">Manage your home from anywhere in the world.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-black/80 backdrop-blur-md z-10">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
           {/* Translated Footer */}
          <p>© {new Date().getFullYear()} Synapse Home. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}