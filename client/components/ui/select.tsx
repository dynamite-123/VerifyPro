import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="mb-5">
      <label 
        htmlFor={selectId} 
        className="block text-sm font-normal text-gray-600 mb-2"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 appearance-none bg-white
          ${error ? 'border-red-400' : 'border-gray-200'} 
          ${className}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                backgroundPosition: `right 0.5rem center`, 
                backgroundRepeat: `no-repeat`, 
                backgroundSize: `1.5em 1.5em`,
                paddingRight: `2.5rem` }}
        {...props}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Select;
