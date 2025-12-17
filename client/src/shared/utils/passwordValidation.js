// Password validation utilities

export const validatePassword = (password) => {
  const errors = [];
  
  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special character
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  // Check for common weak passwords
  const weakPasswords = [
    'password', 'password123', '12345678', 'qwerty123', 'admin123',
    'welcome123', 'letmein123', 'monkey123', '123456789', 'password1',
    'qwertyuiop', 'asdfghjkl', 'zxcvbnm123', 'iloveyou123', 'welcome1',
    'admin1234', 'root1234', 'test1234', 'user1234', 'guest1234'
  ];
  
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common and easily guessable');
  }
  
  // Check for repeated characters (more than 3 in a row)
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Password cannot contain more than 3 repeated characters in a row');
  }
  
  // Check for sequential characters
  const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiopasdfghjklzxcvbnm'];
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 4; i++) {
      if (password.toLowerCase().includes(seq.substring(i, i + 4))) {
        errors.push('Password cannot contain sequential characters (like 1234 or abcd)');
        break;
      }
    }
  }
  
  return errors;
};

export const getPasswordStrength = (password) => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[@$!%*?&]/.test(password),
    longLength: password.length >= 12,
    extraSymbols: /[^A-Za-z0-9@$!%*?&]/.test(password)
  };
  
  // Basic requirements
  if (checks.length) score += 1;
  if (checks.lowercase) score += 1;
  if (checks.uppercase) score += 1;
  if (checks.numbers) score += 1;
  if (checks.symbols) score += 1;
  
  // Bonus points
  if (checks.longLength) score += 1;
  if (checks.extraSymbols) score += 1;
  
  // Determine strength
  if (score < 3) return { strength: 'weak', color: 'red', percentage: (score / 7) * 100 };
  if (score < 5) return { strength: 'medium', color: 'yellow', percentage: (score / 7) * 100 };
  if (score < 6) return { strength: 'good', color: 'blue', percentage: (score / 7) * 100 };
  return { strength: 'strong', color: 'green', percentage: (score / 7) * 100 };
};

export const passwordValidationRules = {
  required: 'Password is required',
  validate: (value) => {
    const errors = validatePassword(value);
    return errors.length === 0 || errors[0]; // Return first error or true if valid
  }
};