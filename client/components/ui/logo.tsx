import React from 'react';
import { Montserrat, Poppins } from 'next/font/google';

// Load fonts
const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['700'],
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['600'],
});

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`inline-block tracking-wide ${sizeClasses[size]} ${className}`}>
      <span className={`${montserrat.className} text-gray-900 font-bold align-middle`}>Verify</span>
      <span className={`${poppins.className} text-green-600 font-extrabold align-middle`}>Pro</span>
    </div>
  );
};

export default Logo;
