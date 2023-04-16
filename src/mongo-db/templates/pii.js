import { ENCRYPTION_PREDEFINED } from './predefined'
import { camelize } from 'inflected'

const PII_FIELDS = Object.freeze([
  ['email', 'PII_STRING'],
  ['first_name', 'PII_STRING'],
  ['last_name', 'PII_STRING'],
  ['address', 'PII_STRING'],
  ['phone_number', 'PII_STRING'],
  ['passport', 'PII_STRING'],
  ['passport_number', 'PII_STRING'],
  ['social_security_number', 'PII_STRING'],
  ['socialSecurityNumber', 'PII_STRING'],
  ['ssn', 'PII_STRING'],
  ['pps', 'PII_STRING'],
  ['pps_number', 'PII_STRING'],
  ['personal_public_service_number', 'PII_STRING'],
  ['date_of_birth', 'PII_DATE'],
  ['dob', 'PII_DATE'],
])

let schema = PII_FIELDS.reduce((acc, [name, type]) => {
  acc[name] = ENCRYPTION_PREDEFINED[type]

  let camelized = camelize(name, false)
  if (camelized != name) {
    acc[camelized] = ENCRYPTION_PREDEFINED[type]
  }

  return acc
}, {})

export const PII_ENCRYPTION_SCHEMA_MAP = Object.freeze(schema)
