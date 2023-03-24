export const ALLOWED_CHARACTERS_PATTERNS = {
  NONE: null,
  ALPHA_NUMERIC: /^[a-zA-Z0-9_-]+$/,
  COMMON_USE:
    /^[\p{L}\p{N}\s!"#$%&'()*+,-./:;<=>?@[\\\]^_{|}~\u0080-\uFFFF]*$/u,
  FILE_NAME_SAFE: /^(?!\s+$)[\w\s\-().[\]]*$/i,
  URL_SAFE: /^[\w.~\-/]*(:\/\/[\w.~\-/]+)*$/,
}

/**
 * Check if a given string is blank.
 *
 * @param {string} str - The string to check.
 * @returns {boolean} Returns true if the string is blank, otherwise false.
 */
export function isBlank(value) {
  return !value || value.trim().length === 0
}

/**
 * Validates if a string meet requirement.
 *
 * @param {string} value The string to validate.
 * @param {{
 *   allowBlank?: boolean,
 *   minLength?: number,
 *   maxLength?: number,
 *   allowedRegexPattern?: RegExp | keyof typeof ALLOWED_CHARACTERS_PATTERNS,
 * }} [options] The options object for validation.
 *
 * @throws {Error} If the string is not valid and `allowBlank` is `false`.
 *
 * @returns {void} Throws an error if `allowBlank` is `false` and the string is not valid. Otherwise, returns nothing.
 */
export function validateString(value, options = {}) {
  const {
    allowBlank = true,
    allowedRegexPattern = ALLOWED_CHARACTERS_PATTERNS.NONE,
    minLength = null,
    maxLength = null,
  } = options

  if (value === undefined || value === null || value === '') {
    if (allowBlank) return

    throw new Error('String cannot be blank')
  }

  if (typeof value !== 'string') {
    throw new Error('Value must be a string')
  }

  if (minLength !== null && value.length < minLength) {
    throw new Error(`String must be at least ${minLength} characters long.`)
  }

  if (maxLength !== null && value.length > maxLength) {
    throw new Error(`String must be at most ${maxLength} characters long.`)
  }

  let regex = /^[a-zA-Z0-9\s]*$/

  if (allowedRegexPattern instanceof RegExp) {
    regex = allowedRegexPattern
  }

  if (!regex.test(value)) {
    throw new Error('String contains invalid characters.')
  }
}

/**
 * Validates if a string meet requirement.
 *
 * @param {string} value The string to validate.
 * @param {{
 *   allowBlank?: boolean,
 *   minLength?: number,
 *   maxLength?: number,
 *   allowedRegexPattern?: RegExp | keyof typeof ALLOWED_CHARACTERS_PATTERNS,
 * }} [options] The options object for validation.
 *
 * @returns {boolean} `true` if the string is valid, otherwise `false`.
 */
export function isValidString(value, options = {}) {
  try {
    validateString(value, options)
    return true
  } catch (error) {
    return false
  }
}
