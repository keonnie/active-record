import { jest } from '@jest/globals'

const __mockedResolveMX = jest.fn()

jest.unstable_mockModule('node:dns/promises', () => ({
  resolveMx: __mockedResolveMX,
}))

await import('node:dns/promises')
const {
  isValidEmail,
  isValidEmailMX,
  validateEmail,
  validateEmailMX,
  MAX_EMAIL_LOCAL_LENGTH,
  MAX_EMAIL_DOMAIN_LENGTH,
  MAX_LABEL_DOMAIN_LENGTH,
} = await import('./email')

describe('Unit | Validators | Email', () => {
  afterEach(() => {
    __mockedResolveMX.mockReset()
  })

  describe('with `isValidEmail`', () => {
    test.each([
      // Standard email format
      ['example.com', false],
      ['test@', false],
      // RFC 5321 - Length validation
      ['a@b.com', true],
      ['a@b.c', false],
      ['a@b.c.', false],
      ['ab@c.com', true],
      ['a@bc.com', true],
      ['a'.repeat(MAX_EMAIL_LOCAL_LENGTH + 1) + '@b.com', false],
      ['a@' + 'b'.repeat(MAX_EMAIL_DOMAIN_LENGTH) + '.com', false],
      ['a@b.co' + 'm'.repeat(MAX_EMAIL_DOMAIN_LENGTH + 1), false],
      ['ab@c.' + 'c'.repeat(MAX_LABEL_DOMAIN_LENGTH + 1), false],
      [
        'a'.repeat(MAX_EMAIL_LOCAL_LENGTH) +
          '@' +
          'b'.repeat(MAX_EMAIL_DOMAIN_LENGTH - 2),
        false,
      ],
      // RFC 5322
      ['john.doe@example.com', true],
      ['jane.doe+test@example.com', true],
      ['jane.doe.test@example.co.uk', true],
      ['john.doe@example..com', false],
      ['jane.doe@ example.com', false],
      ['jane.doe@example.c', false],
      ['john.doe@example.123', false],
      ['jane.doe@example.com.', false],
      ['jane.doe@.example.com', false],
      ['jane.doe@example..com', false],
      ['john.doe@example.com.', false],
      ['jane.doe@-example.com', false],
      ['jane.doe@example-.com', false],
      ['jane.doe@exa_mple.com', false],
      ['jane.doe@.com', false],
      ['jane.doe@-example.co.uk', false],
      ['jane.doe@example-.co.uk', false],
      ['jane.doe@exa_mple.co.uk', false],
      ['jane.doe@.co.uk', false],
      ['jane.doe@example.com..', false],
      ['john.doe@example.com@', false],
      ['john.doe@-example.com.', false],
      ['john.doe@example.com-', false],
      ['jane.doe@example..com.', false],
      ['jane.doe@example..com-', false],
      ['jane.doe@example.com@com', false],
      ['jane.doe@.example.com.', false],
      ['jane.doe@.example.com-', false],
      ['jane.doe@example.com..com', false],
      ['jane.doe@example.com.-com', false],
      ['jane.doe@-example.co.uk.', false],
      ['jane.doe@example-.co.uk.', false],
      ['jane.doe@exa_mple.co.uk.', false],
      ['jane.doe@.co.uk.', false],
      ['jane.doe@.co.uk-', false],
    ])('validates email "%s" correctly', async (email, expected) => {
      expect(isValidEmail(email)).toBe(expected)
    })
  })

  describe('with `validateEmail`', () => {
    it('throw error on invalid', async () => {
      expect(() => validateEmail('invalid@-')).toThrow(Error)
    })
  })

  describe('when running MX Record validation', () => {
    it('should return true for a valid email with valid MX record', async () => {
      // Mock the DNS resolution to return a valid MX record
      __mockedResolveMX.mockResolvedValue([{ exchange: 'example.com' }])

      const result = await isValidEmailMX('john.doe@example.com')
      expect(result).toBe(true)
      expect(__mockedResolveMX).toHaveBeenCalledWith('example.com')
    })

    it('should return false for a valid email with invalid MX record', async () => {
      // Mock the DNS resolution to return an empty list of MX records
      __mockedResolveMX.mockResolvedValue([])

      const result = await isValidEmailMX('john.doe@example.com')
      expect(result).toBe(false)
      expect(__mockedResolveMX).toHaveBeenCalledWith('example.com')
    })

    it('should return false for an email with invalid domain', async () => {
      __mockedResolveMX.mockRejectedValue()

      const result = await isValidEmailMX('john.doe@invalid.example.com')
      expect(result).toBe(false)
      expect(__mockedResolveMX).toHaveBeenCalledWith('invalid.example.com')
    })

    it('throw an error for invalid domain', async () => {
      __mockedResolveMX.mockRejectedValue()
      await expect(
        validateEmailMX('john.doe@invalid.example.com'),
      ).rejects.toThrow(Error)
    })
  })
})
