import { MongoClient, __mockConnect, ObjectId } from '../../__mocks__/mongodb'
import {
  ClientEncryption,
  __mockCreateDataKey,
  __mockGetKeyByAltName,
} from '../../__mocks__/mongodb-client-encryption'

const CONFIG_YAML_CONTENTS = `
masterKeys:
  keyAltName:
    projectId: myproject
    location: mylocation
    keyRing: mykeyring
    keyName: mykeyname
    provider: gcp
  anotherkeyAltName:
    projectId: anotherproject
    location: anotherlocation
    keyRing: anotherkeyring
    keyName: anotherkeyname
    provider: gcp

collections:
  collection1:
    masterKey: keyAltName
    fields:
      field1:
        type: string
        encryption: deterministic
      field2:
        type: int
        encryption: random
  collection2:
    masterKey:
      projectId: customproject
      location: customlocation
      keyRing: customkeyring
      keyName: customkeyname
      keyAltName: customKeyAltName
      provider: gcp
    fields:
      field3:
        type: object
        encryption: deterministic
      field4:
        type: string
        encryption: random
  collection3:
    masterKey: anotherkeyAltName
    includes:
      - PII
    fields:
      field5:
        type: string
        encryption: deterministic
  collection4:
    masterKey: anotherkeyAltName
    includes:
      - PII
`

const username = 'k'
const password = 'd'
const cluster = 'abc.mongodb.net'
const dbname = 'test'
const vaultDBname = `${dbname}-vault`
const keyVaultNamespace = `${vaultDBname}.__default`
const kmsProviders = {
  gcp: {
    email: 'service@iam.com',
    privateKey: 'abc123',
  },
}

const { __mockReadFile } = await import('../../__mocks__/node/fs/promises')
__mockReadFile.mockResolvedValue(CONFIG_YAML_CONTENTS)
const { getEncryptionSettings, map } = await import('./encryption')

describe('Unit | MongoDB | Encryption', () => {
  const mockKeys = {
    keyAltName: new ObjectId(),
    anotherkeyAltName: new ObjectId(),
    customKeyAltName: new ObjectId(),
  }

  beforeAll(() => {
    __mockGetKeyByAltName.mockImplementation((name) => {
      if (['anotherkeyAltName'].includes(name)) return null

      return { _id: mockKeys[name] }
    })

    __mockCreateDataKey.mockResolvedValue(mockKeys.anotherkeyAltName)
  })

  describe('when building encryption settings', () => {
    const config = {
      username,
      password,
      cluster,
      dbname,
      kmsProviders,
    }

    it('require at least one kmsProvider to be defined', async () => {
      await expect(() => getEncryptionSettings()).rejects.toThrow(
        Error('At least one KMS Provider must be defined.'),
      )
    })

    it('notify only support for GCP', async () => {
      await expect(() =>
        getEncryptionSettings({ kmsProviders: { aws: {} } }),
      ).rejects.toThrow(Error('Only GCP is supported as KMS.'))
    })

    describe('with correct settings', () => {
      let settings = null
      beforeAll(async () => {
        settings = await getEncryptionSettings(config)
      })

      it('include autoEncryption & KMS Providers', async () => {
        expect(settings).toEqual(
          expect.objectContaining({
            autoEncryption: expect.objectContaining({
              kmsProviders,
            }),
          }),
        )
      })

      it('include key vault namespace', async () => {
        expect(settings).toEqual(
          expect.objectContaining({
            autoEncryption: expect.objectContaining({
              keyVaultNamespace: 'test-vault.__default',
            }),
          }),
        )
      })

      it('include schema map', async () => {
        expect(settings).toEqual(
          expect.objectContaining({
            autoEncryption: expect.objectContaining({
              schemaMap: expect.any(Object),
            }),
          }),
        )
      })
    })
  })

  describe('when mapping', () => {
    describe('for master keys', () => {
      beforeAll(async () => {
        await map({
          username,
          password,
          cluster,
          dbname,
          kmsProviders,
        })
      })

      it('establish connection to vault database', async () => {
        expect(MongoClient).toHaveBeenCalled()
        expect(MongoClient).toHaveBeenCalledWith(
          `mongodb+srv://${username}:${password}@${cluster}/${vaultDBname}?retryWrites=true&w=majority`,
          expect.any(Object),
        )
        expect(__mockConnect).toHaveBeenCalled()
      })

      it('create client encryption', async () => {
        expect(ClientEncryption).toHaveBeenCalledWith(
          expect.objectContaining(MongoClient.prototype),
          expect.objectContaining({
            keyVaultNamespace,
            kmsProviders,
          }),
        )
      })

      it('check if master keys exists', async () => {
        expect(__mockGetKeyByAltName).toHaveBeenCalledWith('keyAltName')
        expect(__mockGetKeyByAltName).toHaveBeenCalledWith('anotherkeyAltName')
        expect(__mockGetKeyByAltName).toHaveBeenCalledWith('customKeyAltName')
      })

      it('create keys if not exists', () => {
        expect(__mockCreateDataKey).toHaveBeenCalledWith('gcp', {
          masterKey: {
            projectId: 'anotherproject',
            location: 'anotherlocation',
            keyRing: 'anotherkeyring',
            keyName: 'anotherkeyname',
          },
          keyAltNames: ['anotherkeyAltName'],
        })
      })
    })

    describe('for schema', () => {
      let schema = null
      beforeAll(async () => {
        schema = await map({
          username,
          password,
          cluster,
          dbname,
          kmsProviders,
        })
      })

      it('create mapping for each collection', () => {
        expect(schema).toEqual(
          expect.objectContaining({
            [`${dbname}.collection1`]: expect.any(Object),
            [`${dbname}.collection2`]: expect.any(Object),
            [`${dbname}.collection3`]: expect.any(Object),
            [`${dbname}.collection4`]: expect.any(Object),
          }),
        )
      })

      it('define collection as bsontype as Ojbect', () => {
        expect(schema).toEqual(
          expect.objectContaining({
            [`${dbname}.collection1`]: expect.objectContaining({
              bsonType: 'object',
            }),
          }),
        )
      })

      it('include encryption key id', () => {
        expect(schema).toEqual(
          expect.objectContaining({
            [`${dbname}.collection1`]: expect.objectContaining({
              encryptMetadata: {
                keyId: [mockKeys.keyAltName],
              },
            }),
            [`${dbname}.collection2`]: expect.objectContaining({
              encryptMetadata: {
                keyId: [mockKeys.customKeyAltName],
              },
            }),
            [`${dbname}.collection3`]: expect.objectContaining({
              encryptMetadata: {
                keyId: [mockKeys.anotherkeyAltName],
              },
            }),
            [`${dbname}.collection4`]: expect.objectContaining({
              encryptMetadata: {
                keyId: [mockKeys.anotherkeyAltName],
              },
            }),
          }),
        )
      })

      it('define fields to be encrypted', () => {
        expect(schema).toEqual(
          expect.objectContaining({
            [`${dbname}.collection1`]: expect.objectContaining({
              properties: {
                field1: {
                  encrypt: {
                    bsonType: 'string',
                    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
                  },
                },
                field2: {
                  encrypt: {
                    bsonType: 'int',
                    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
                  },
                },
              },
            }),
            [`${dbname}.collection2`]: expect.objectContaining({
              properties: {
                field3: {
                  encrypt: {
                    bsonType: 'object',
                    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
                  },
                },
                field4: {
                  encrypt: {
                    bsonType: 'string',
                    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
                  },
                },
              },
            }),
            [`${dbname}.collection3`]: expect.objectContaining({
              properties: expect.objectContaining({
                field5: {
                  encrypt: {
                    bsonType: 'string',
                    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
                  },
                },
              }),
            }),
          }),
        )
      })

      test.each([
        ['email'],
        ['first_name'],
        ['firstName'],
        ['last_name'],
        ['firstName'],
        ['address'],
        ['phone_number'],
        ['passport'],
        ['passport_number'],
        ['passportNumber'],
        ['phone_number'],
        ['social_security_number'],
        ['socialSecurityNumber'],
        ['ssn'],
        ['personal_public_service_number'],
        ['personalPublicServiceNumber'],
        ['pps_number'],
        ['ppsNumber'],
        ['pps'],
        ['date_of_birth'],
        ['dateOfBirth'],
        ['dob'],
      ])('defined include field %s', (fieldname) => {
        expect(schema).toEqual(
          expect.objectContaining({
            [`${dbname}.collection3`]: expect.objectContaining({
              properties: expect.objectContaining({
                [`${fieldname}`]: expect.objectContaining({
                  encrypt: expect.any(Object),
                }),
              }),
            }),
            [`${dbname}.collection4`]: expect.objectContaining({
              properties: expect.objectContaining({
                [`${fieldname}`]: expect.objectContaining({
                  encrypt: expect.any(Object),
                }),
              }),
            }),
          }),
        )
      })
    })
  })
})
