import React from 'react';
import Logo from '../ui/logo';

interface FormContainerProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const FormContainer: React.FC<FormContainerProps> = ({
  children,
  title,
  subtitle
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-2" />
          <h2 className="mt-6 text-2xl font-normal text-gray-800 tracking-tight">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text font-normal">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default FormContainer;
