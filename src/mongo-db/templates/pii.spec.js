import { PII_ENCRYPTION_SCHEMA_MAP, ENCRYPTION_PREDEFINED } from '.'

describe('Unit | Encrypted Schema | PII', () => {
  test.each([
    ['email', 'PII_STRING'],
    ['first_name', 'PII_STRING'],
    ['firstName', 'PII_STRING'],
    ['last_name', 'PII_STRING'],
    ['firstName', 'PII_STRING'],
    ['address', 'PII_STRING'],
    ['phone_number', 'PII_STRING'],
    ['passport', 'PII_STRING'],
    ['passport_number', 'PII_STRING'],
    ['passportNumber', 'PII_STRING'],
    ['phone_number', 'PII_STRING'],
    ['social_security_number', 'PII_STRING'],
    ['socialSecurityNumber', 'PII_STRING'],
    ['ssn', 'PII_STRING'],
    ['personal_public_service_number', 'PII_STRING'],
    ['personalPublicServiceNumber', 'PII_STRING'],
    ['pps_number', 'PII_STRING'],
    ['ppsNumber', 'PII_STRING'],
    ['pps', 'PII_STRING'],
    ['date_of_birth', 'PII_DATE'],
    ['dateOfBirth', 'PII_DATE'],
    ['dob', 'PII_DATE'],
  ])('includes %s field', (name, keyConfig) => {
    let expector = {}

    expector[name] = ENCRYPTION_PREDEFINED[keyConfig]

    expect(PII_ENCRYPTION_SCHEMA_MAP).toEqual(expect.objectContaining(expector))
  })
})
