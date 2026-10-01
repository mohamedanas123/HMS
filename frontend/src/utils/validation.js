/**
 * Validates password to ensure it contains at least one letter and at least one integer,
 * with a minimum length of 6 characters.
 *
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 6) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
}

export const PASSWORD_REQUIREMENT_MSG = 'Password must be at least 6 characters and contain at least one letter and one number.';
