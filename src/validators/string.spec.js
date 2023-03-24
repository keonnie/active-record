import {
  isBlank,
  isValidString,
  validateString,
  ALLOWED_CHARACTERS_PATTERNS,
} from './string'

describe('Unit | Validators | String', () => {
  it('does not allow blank when enabled', () => {
    expect(isValidString('', { allowBlank: false })).toBe(false)
  })

  describe('when checking if empty', () => {
    test.each([
      ['', true],
      [null, true],
      [undefined, true],
      ['abc', false],
      ['   hello', false],
      ['hello   ', false],
      ['    ', true],
      ['  \n\t', true],
    ])('"%s" should return %s', (input, expected) => {
      expect(isBlank(input)).toBe(expected)
    })
  })

  it('does not allow anything then a string', () => {
    expect(() => validateString({})).toThrow(Error)
  })

  describe('when called with options.minLength', () => {
    test.each([[null], [undefined], ['']])(
      'does not throw an error if input is "%s" but allowBlank is true',
      (input) => {
        expect(() => validateString(input)).not.toThrow(Error)
      },
    )

    it('throws an error if string is too short', () => {
      expect(() => {
        validateString('abc', { minLength: 5 })
      }).toThrowError('String must be at least 5 characters long.')
    })

    it('does not throw an error if string is long enough', () => {
      expect(() => {
        validateString('abcde', { minLength: 5 })
      }).not.toThrow()
    })
  })

  describe('when called with options.maxLength', () => {
    test.each([[null], [undefined], ['']])(
      'does not throw an error if input is "%s" but allowBlank is true',
      (input) => {
        expect(() =>
          validateString(input, { maxLength: 5, allowBlank: true }),
        ).not.toThrow(Error)
      },
    )

    it('throws an error if value length is greater than maxLength', () => {
      expect(() => validateString('abcdef', { maxLength: 5 })).toThrow(Error)
    })

    it('does not throw an error if value length is less than maxLength', () => {
      expect(() => validateString('abc', { maxLength: 5 })).not.toThrow(Error)
    })
  })
  describe('when called with default options', () => {
    test.each([
      ['hello', true],
      ['hello world', true],
      ['   hello world   ', true],
      ['123', true],
      [' 123 ', true],
      ['abc123', true],
      ['a b c', true],
      ['+-*/', false],
      ['@#!$', false],
      ['<script>alert("xss");</script>', false],
      ['<img src=x onerror=alert("xss")>', false],
      [undefined, true],
      [null, true],
      ['', true],
      ['     ', true],
    ])('"%s" should return %s', (input, expected) => {
      expect(isValidString(input)).toBe(expected)
      if (expected) {
        expect(() => validateString(input)).not.toThrow(Error)
      } else {
        expect(() => validateString(input)).toThrow(Error)
      }
    })
  })

  describe('when called with options.allowedRegexPattern = ALLOWED_CHARACTERS_PATTERNS.ALPHA_NUMERIC', () => {
    test.each([
      ['', true],
      ['   ', false],
      ['abc123', true],
      ['5fb2b5ee5e6f534b6eeed100', true],
      ['abc-def-ghi', true],
      ['abc_def_ghi', true],
      ['abc.def.ghi', false],
      ['_abc123', true],
      ['abc123_', true],
      ['abc@123', false],
      ['ab#c123', false],
      ['abc123$', false],
      ['123abc', true],
      ['ABC123', true],
      ['!@#$', false],
      ['123456789012345678901234', true],
      ['1234567890123456789012345', true],
      ['12345678901234567890123!', false],
      ['12345678901234567890123_', true],
      ['12345678901234567890123-', true],
      ['12345678901234567890123.', false],
    ])('"%s" should return %s', (input, expected) => {
      const options = {
        allowedRegexPattern: ALLOWED_CHARACTERS_PATTERNS.ALPHA_NUMERIC,
      }

      expect(isValidString(input, options)).toBe(expected)
    })
  })

  describe('when called with options.allowedRegexPattern = ALLOWED_CHARACTERS_PATTERNS.COMMON_USE', () => {
    test.each([
      ['hello', true],
      ['hello world', true],
      ['   hello world   ', true],
      ['123', true],
      [' 123 ', true],
      ['abc123', true],
      ['a b c', true],
      ['+-*/', true],
      ['@#!$', true],
      // It has been concluded that XSS is not
      // the responsability of validator
      // ['<script>alert("xss");</script>', false],
      // ['<img src=x onerror=alert("xss")>', false],
      [undefined, true],
      [null, true],
      ['', true],
      ['     ', true],
      ['स्वागत', true],
      ['привет', true],
      ['你好', true],
      ['こんにちは', true],
      ['γεια σας', true],
    ])('"%s" should return %s', (input, expected) => {
      const options = {
        allowedRegexPattern: ALLOWED_CHARACTERS_PATTERNS.COMMON_USE,
      }

      expect(isValidString(input, options)).toBe(expected)
    })
  })

  describe('when called with options.allowedRegexPattern = ALLOWED_CHARACTERS_PATTERNS.URL_SAFE', () => {
    test.each([
      ['hello', true],
      ['http://www.example.com', true],
      ['https://www.example.com', true],
      ['ftp://ftp.example.com', true],
      ['www.example.com', true],
      ['example.com', true],
      ['example.com/foo/bar', true],
      ['123', true],
      ['abc123', true],
      ['a b c', false],
      ['+-*/', false],
      ['@#!$', false],
      ['<script>alert("xss");</script>', false],
      ['<img src=x onerror=alert("xss")>', false],
      [undefined, true],
      [null, true],
      ['', true],
      ['     ', false],
    ])('"%s" should return %s', (input, expected) => {
      const options = {
        allowedRegexPattern: ALLOWED_CHARACTERS_PATTERNS.URL_SAFE,
      }
      expect(isValidString(input, options)).toBe(expected)
    })
  })

  describe('when called with options.allowedRegexPattern = ALLOWED_CHARACTERS_PATTERNS.FILE_NAME_SAFE', () => {
    test.each([
      ['hello', true],
      ['example.doc', true],
      ['example.docx', true],
      ['example.txt', true],
      ['example.pdf', true],
      ['example.mp3', true],
      ['example-1.doc', true],
      ['example (1).docx', true],
      ['example_1.txt', true],
      ['example&$@123.pdf', false],
      ['example!@#$.txt', false],
      ['example%*()<>.mp3', false],
      [undefined, true],
      [null, true],
      ['', true],
      ['     ', false],
    ])('"%s" should return %s', (input, expected) => {
      const options = {
        allowedRegexPattern: ALLOWED_CHARACTERS_PATTERNS.FILE_NAME_SAFE,
      }
      expect(isValidString(input, options)).toBe(expected)
    })
  })
})
