/**
 * Same rules as Settings "Change Password" (validatePasswordChange).
 * @param {string} password
 * @returns {string|null} Error message or null if valid.
 */
export function validatePasswordStrength(password) {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'Password must contain uppercase, lowercase, and number';
  }
  return null;
}
