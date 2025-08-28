import React from 'react';

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
    <div className={`font-normal tracking-wide ${sizeClasses[size]} ${className}`}>
      <span className="text-gray-900">Verify</span>
      <span className="text-gray-600 font-light">Pro</span>
    </div>
  );
};

export default Logo;
