import * as Yup from 'yup';

// Common special characters allowed in passwords
// Note: In regex character class, - must be at the end or escaped, ] and [ must be escaped
export const ALLOWED_SPECIAL_CHARACTERS = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~\\';
export const SPECIAL_CHARACTERS_DISPLAY = '! @ # $ % ^ & * ( ) _ + - = [ ] { } | ; : \' " , . < > ? / ~ \\';

// Password validation regex - includes uppercase letter and special character
// Using - at the end of character class to avoid escaping issues
// Escaping [ and ] since they have special meaning in character classes
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+=\[\]{}|;:'",.<>?/~\\-])/;

// Password validation schema
export const passwordValidation = Yup.string()
  .min(6, 'Password must be at least 6 characters')
  .matches(
    PASSWORD_REGEX,
    'Password must contain at least one uppercase letter and one special character'
  )
  .required('Password is required');

// Email validation schema
export const emailValidation = Yup.string()
  .email('Invalid email address')
  .required('Email is required');

// Password helper text
export const PASSWORD_HELPER_TEXT = `Must be at least 6 characters with one uppercase letter and one special character. Allowed special characters: ${SPECIAL_CHARACTERS_DISPLAY}`;

