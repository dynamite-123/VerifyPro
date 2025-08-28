import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="mb-5">
      <label 
        htmlFor={inputId} 
        className="block text-sm font-normal text-gray-600 mb-2"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full text-black px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 
          ${error ? 'border-red-400' : 'border-gray-200'} 
          ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;
