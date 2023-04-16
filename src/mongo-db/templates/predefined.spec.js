import { ENCRYPTION_PREDEFINED } from './predefined'

describe('Unit | Encryption Schemas | Config', () => {
  describe('for PII String', () => {
    it('use `AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic` algorithm', () => {
      expect(ENCRYPTION_PREDEFINED.PII_STRING).toEqual(
        expect.objectContaining({
          encrypt: expect.objectContaining({
            bsonType: 'string',
            algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
          }),
        }),
      )
    })
  })

  describe('for PII date', () => {
    it('use `AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic` algorithm', () => {
      expect(ENCRYPTION_PREDEFINED.PII_DATE).toEqual(
        expect.objectContaining({
          encrypt: expect.objectContaining({
            bsonType: 'date',
            algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
          }),
        }),
      )
    })
  })
})
