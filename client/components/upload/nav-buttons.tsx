import React from 'react';

interface NavButtonsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
  nextText?: string;
  loading?: boolean;
}

const NavButtons: React.FC<NavButtonsProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isNextDisabled = false,
  nextText,
  loading = false
}) => {
  return (
    <div className="flex justify-between mt-8">
      {currentStep > 0 ? (
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all font-normal"
          disabled={loading}
        >
          Back
        </button>
      ) : (
        <div></div>
      )}
      
      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled || loading}
        className={`px-6 py-2 rounded-lg text-white transition-all
          ${isNextDisabled 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          currentStep === totalSteps - 1 
            ? (nextText || 'Submit') 
            : (nextText || 'Next')
        )}
      </button>
    </div>
  );
};

export default NavButtons;
