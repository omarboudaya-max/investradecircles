/**
 * Input Validation Utilities
 * Reusable validators for common fields across the app.
 */

export const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required.';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (value && value.trim().length < min) {
      return `Must be at least ${min} characters.`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (value && value.trim().length > max) {
      return `Must be at most ${max} characters.`;
    }
    return null;
  },

  email: (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !re.test(value)) return 'Invalid email address.';
    return null;
  },

  noScript: (value) => {
    if (value && /<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(value)) {
      return 'Invalid content detected.';
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL.';
    }
  },
};

/**
 * Run multiple validators against a value.
 * Returns the first error found, or null if valid.
 * @param {string} value
 * @param {Function[]} rules
 * @returns {string|null}
 */
export function validate(value, rules) {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

/**
 * Sanitize a string by trimming and removing dangerous characters.
 * @param {string} value
 * @returns {string}
 */
export function sanitize(value) {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/[<>]/g, '');
}