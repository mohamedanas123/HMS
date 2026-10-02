export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 6) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
}

export const PASSWORD_REQUIREMENT_MSG = 'Password must be at least 6 characters and contain at least one letter and one number.';

export function isValidPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\s+/g, '');
  return /^\d{10,15}$/.test(cleaned);
}

export const PHONE_REQUIREMENT_MSG = 'Please enter a valid phone number (10 to 15 digits).';

