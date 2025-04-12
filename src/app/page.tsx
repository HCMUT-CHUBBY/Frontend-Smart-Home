"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Updated import for App Router
import homeImage from '@/assests/home.png'; // Fixed typo in @/assets
import Logo from '@/assests/logo.png'; // Fixed typo in @/assets
import styles from '@/styles/Home.module.css'; // Fixed to use @/styles

const HomePage: React.FC = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleSignUp = () => {
    router.push('/auth/register');
  };

  return (
    <div className={styles.container}>
      {/* Head component is not needed in App Router - use metadata exports instead */}
      
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src={Logo} alt="Smartt Logo" width={100} height={40} />
          <span className={styles.logoText}>Smartt</span>
        </div>
        <nav className={styles.navigation}>
          <Link href="/product" className={styles.navLink}>
            Product
          </Link>
          <div className={styles.dropdown}>
            <span className={styles.navLink}>About</span>
            <div className={styles.dropdownContent}>
              <Link href="/about/team">
                Our Team
              </Link>
              <Link href="/about/mission">
                Our Mission
              </Link>
            </div>
          </div>
          <Link href="/contract" className={styles.navLink}>
            Contract
          </Link>
          <Link href="/blog" className={styles.navLink}>
            Blog
          </Link>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              <span className={styles.highlight}>Smart Home</span>
            </h1>
            <h2 className={styles.subtitle}>
              Empowering Your Home,<br />
              Enriching Your Life
            </h2>
            <p className={styles.description}>
              Unlock the potential of your home with our revolutionary smart solution
            </p>
            <div className={styles.buttonGroup}>
              <button 
                className={styles.loginButton}
                onClick={handleLogin}
              >
                Log in
              </button>
              <button 
                className={styles.signupButton}
                onClick={handleSignUp}
              >
                Sign up
              </button>
            </div>
          </div>
          <div className={styles.heroImage}>
            <Image 
              src={homeImage} 
              alt="Smart Home Device" 
              width={600}
              height={500}
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;