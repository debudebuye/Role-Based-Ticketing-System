import { getPasswordStrength, validatePassword } from '../utils/passwordValidation.js';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  if (!password) return null;

  const { strength, color, percentage } = getPasswordStrength(password);
  const errors = validatePassword(password);
  const isValid = errors.length === 0;

  const getStrengthColor = () => {
    switch (color) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'good': return 'Good';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  const requirements = [
    { test: password.length >= 8, text: 'At least 8 characters' },
    { test: /[a-z]/.test(password), text: 'One lowercase letter' },
    { test: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { test: /\d/.test(password), text: 'One number' },
    { test: /[@$!%*?&]/.test(password), text: 'One special character (@$!%*?&)' }
  ];

  return (
    <div className="mt-2">
      {/* Strength Bar */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className={`text-sm font-medium ${
          color === 'red' ? 'text-red-600' :
          color === 'yellow' ? 'text-yellow-600' :
          color === 'blue' ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {getStrengthText()}
        </span>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                req.test ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {req.test ? '✓' : '○'}
              </div>
              <span className={req.test ? 'text-green-600' : 'text-gray-500'}>
                {req.text}
              </span>
            </div>
          ))}
          
          {/* Show specific errors */}
          {errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {errors.slice(0, 3).map((error, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs text-red-600">
                  <div className="w-3 h-3 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    ✕
                  </div>
                  <span>{error}</span>
                </div>
              ))}
              {errors.length > 3 && (
                <div className="text-xs text-red-600 ml-5">
                  +{errors.length - 3} more issues
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;