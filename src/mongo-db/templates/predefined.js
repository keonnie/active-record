const algorithm = 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
const base = {
  algorithm,
}

export const ENCRYPTION_PREDEFINED = {
  PII_STRING: {
    encrypt: {
      ...base,
      bsonType: 'string',
    },
  },
  PII_DATE: {
    encrypt: {
      ...base,
      bsonType: 'date',
    },
  },
}
