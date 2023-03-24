import { resolveMx } from 'node:dns/promises'

export const MAX_EMAIL_LOCAL_LENGTH = 64
export const MAX_EMAIL_DOMAIN_LENGTH = 255
export const MAX_LABEL_DOMAIN_LENGTH = 63

const MAX_EMAIL_LENGTH = 256

const EMAIL_LOCAL_PART_REGEX =
  /^[\w.!#$%&'*+/=?^`{|}~-]+(?:\.[\w.!#$%&'*+/=?^`{|}~-]+)*$/
const EMAIL_DOMAIN_PART_REGEX =
  /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/
const DOMAIN_LABEL_REGEX = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/

/**
 * Validates the given email address based on
 * RFC 5322 and optionally validates its MX records
 *
 * @param {string} email - The email address to validate
 *
 * @returns {Boolean} - Return true if email is valid
 *
 * @throws {Error} If fail validation
 */
export function validateEmail(email) {
  validateEmailLength(email)
  validateEmailFormat(email)
  return true
}

/**
 * Validates the given email address based on
 * RFC 5322 and optionally validates its MX records
 *
 * @param {string} email - The email address to validate
 *
 * @returns {Boolean} - True if the email is valid, false otherwise
 */
export function isValidEmail(email) {
  try {
    validateEmail(email)
    return true
  } catch {
    return false
  }
}

/**
 * Validates an email address by checking the
 * MX record of its domain.
 *
 * @param {string} email - The email address to be validated.
 *
 * @returns {Promise<void>} Returns true if the email address is valid, false otherwise.
 *
 * @throws {Error} if the email format is invalid
 * or no MX records are found for the domain.
 */
export async function validateEmailMX(email) {
  try {
    const [, domain] = parseEmail(email)
    const mxRecords = await resolveMx(domain)
    if (mxRecords.length > 0) return true

    throw new Error(`No MX records found for domain ${domain}`)
  } catch {
    throw new Error('Unable to validate MX records')
  }
}

/**
 * Validates an email address by checking the
 * MX record of its domain.
 *
 * @param {string} email - The email address to be validated.
 *
 * @returns {Promise<boolean>} Returns true if the email address is valid, false otherwise
 */
export async function isValidEmailMX(email) {
  try {
    await validateEmailMX(email)
    return true
  } catch {
    return false
  }
}

/**
 * Validates the format of the given email address based on RFC 5322
 * @param {string} email - The email address to validate
 * @returns {void}
 * @throws {Error} If email is not in a valid format
 */
function validateEmailFormat(email) {
  const [localPart, domainPart] = parseEmail(email)

  const labels = domainPart.split('.')
  if (!labels.every(isValidLabel)) {
    throw new Error('Domain part of email address contains invalid characters')
  }

  if (
    !EMAIL_LOCAL_PART_REGEX.test(localPart) ||
    !EMAIL_DOMAIN_PART_REGEX.test(domainPart)
  ) {
    throw new Error('Invalid email')
  }

  return true
}

/**
 * Validates the length of the given email address
 * based on RFC 5321 and RFC 1034 for domain
 *
 * @param {string} email - The email address to validate
 *
 * @throws {Error} - If the email is too long or
 * the local or domain parts exceed their respective
 * length limits based on RFC 5321
 */
function validateEmailLength(email) {
  const [localPart, domainPart] = parseEmail(email)

  if (localPart.length > MAX_EMAIL_LOCAL_LENGTH)
    throw new Error('Local part of email address is too long')
  if (domainPart.length > MAX_EMAIL_DOMAIN_LENGTH)
    throw new Error('Domain part of email address is too long')
  if (email.length > MAX_EMAIL_LENGTH)
    throw new Error('Email address (local and domain) is too long')
}

/**
 * Extract local and domain parts
 * of email
 * @param {String} email
 *
 * @returns {[String, String]}
 *
 * @throws {Error} If email malformatted
 */
function parseEmail(email) {
  // Check no more then one `@` symbol
  if ((email.match(/@/g) || []).length !== 1) throw new Error('Invalid email')

  const [local, domain] = email.split('@')
  // Check that email has a local and domain part
  if (local && domain) return [local, domain]

  throw new Error('The email is malformatted')
}

/**
 * Checks if a label in a domain name is valid according to RFC 1035.
 * A label can contain only ASCII letters (a-z, A-Z), digits (0-9),
 * and hyphens ("-"), and cannot start or end with a hyphen.
 *
 * @param {string} label - The label to check
 *
 * @returns {boolean} - True if the label is valid, false otherwise
 */
function isValidLabel(label) {
  return DOMAIN_LABEL_REGEX.test(label)
}
