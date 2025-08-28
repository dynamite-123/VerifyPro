import React from 'react';
import Logo from '../ui/logo';

interface UploadContainerProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const UploadContainer: React.FC<UploadContainerProps> = ({
  children,
  title,
  subtitle
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-2" />
          <h2 className="mt-2 text-2xl font-normal text-gray-800 tracking-tight">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-500 font-normal">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default UploadContainer;
