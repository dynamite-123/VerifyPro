import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  totalSteps,
  steps 
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step circle */}
            <div className="relative flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={`absolute -bottom-6 text-xs ${
                index === currentStep ? 'text-gray-900 font-medium' : 'text-gray-500 font-light'
              }`}>
                {step}
              </span>
            </div>
            
            {/* Connector line */}
            {index < totalSteps - 1 && (
              <div 
                className={`flex-1 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
