import { MongoClient } from 'mongodb'
import { ClientEncryption } from 'mongodb-client-encryption'
import { titleize } from 'inflected'

import { getYAMLFile } from '../helpers/get-root-app-file'
import { DEFAULT_CONNECTION } from '../facades/mongodb-facade'
import { PREDEFINED_SCHEMAS } from './templates'

const MONGODB_ENCRYPTION_CONFIG_FILE_NAME = '.karenc.yml'
const CONFIGURATION = await getYAMLFile(MONGODB_ENCRYPTION_CONFIG_FILE_NAME)

/**
 * Get the vault database name.
 * Add suffix `-vault` to the
 * database name provided.
 *
 * @param {String} dbname
 * @returns {String} The vault database name
 */
function getVaultName(dbname) {
  return `${dbname}-vault`
}

/**
 * Get the vault namespace.
 * Compose of the vault database
 * name followed with the collection
 * which is `__default`.
 *
 * @param {String} dbname
 * @returns {String} The vault namespace
 */
function getVaultNamespace(dbname) {
  return `${getVaultName(dbname)}.__default`
}

/**
 * Build and get the encryption setting
 * to provide to a Mongo DB client
 *
 * @param {{
 *   username: String,
 *   password: String,
 *   cluster: String,
 *   dbname: String,
 *   kmsProviders: {
 *     gcp: {
 *       email: String,
 *       privateKey: String,
 *     }
 *   }
 * }} opts
 * @returns {{
 *   autoEncryption: {
 *     keyVaultNamespace: String,
 *     kmsProviders: {
 *       gcp: {
 *         email: String,
 *         privateKey: String,
 *       }
 *     },
 *     schemaMap: {
 *       [dbname.collection]: {
 *         bsonType: String,
 *         encryptMetadata: {
 *           keyId: [UUID()]
 *         },
 *         [fieldname]: {
 *           encrypt: {
 *             bsonType: String,
 *             algorithm: String,
 *           }
 *         }
 *       }
 *     }
 *   }
 * }}
 */
export async function getEncryptionSettings(opts = {}) {
  const { dbname, kmsProviders } = opts

  if (typeof kmsProviders !== 'object' || Object.keys(kmsProviders).length < 1)
    throw new Error('At least one KMS Provider must be defined.')
  if (!Object.keys(kmsProviders).includes('gcp'))
    throw new Error('Only GCP is supported as KMS.')

  const keyVaultNamespace = getVaultNamespace(dbname)
  const schemaMap = await map(opts)

  return {
    autoEncryption: {
      keyVaultNamespace,
      kmsProviders,
      schemaMap,
    },
  }
}

/**
 * Create schema map for MongoDB
 * CSFLE.
 *
 * @param {{
 *   username: String,
 *   password: String,
 *   cluster: String,
 *   dbname: String,
 *   kmsProviders: {
 *     gcp: {
 *       email: String,
 *       privateKey: String,
 *     }
 *   }
 * }} opts
 * @returns {{
 *   [dbname.collection]: {
 *     bsonType: String,
 *     encryptMetadata: {
 *       keyId: [UUID()]
 *     },
 *     [fieldname]: {
 *       encrypt: {
 *         bsonType: String,
 *         algorithm: String,
 *       }
 *     }
 *   }
 * }} Encryption schema map for collections
 */
export async function map(opts) {
  const { username, password, cluster, dbname, kmsProviders } = opts

  if (Object.keys(CONFIGURATION).length === 0)
    throw new Error('No configuration file detected.')

  // Load all the master keys
  const masterkeys = await loadMasterKeys(
    username,
    password,
    cluster,
    dbname,
    kmsProviders,
  )

  let schemaMap = {}
  for (const [k, v] of Object.entries(CONFIGURATION.collections)) {
    const masterKey = v.masterKey?.keyAltName || v.masterKey
    if (!masterKey) throw new Error(`"${k}" is missing master key.`)

    let schema = {
      bsonType: 'object',
      encryptMetadata: {
        keyId: [masterkeys[masterKey]],
      },
      properties: {},
    }

    if (v.fields) {
      for (const [fieldname, fieldvalues] of Object.entries(v.fields)) {
        const algorithmType = titleize(fieldvalues.encryption)
        schema.properties[`${fieldname}`] = {
          encrypt: {
            bsonType: fieldvalues.type,
            algorithm: `AEAD_AES_256_CBC_HMAC_SHA_512-${algorithmType}`,
          },
        }
      }
    }

    for (const predef of v.includes || []) {
      schema.properties = {
        ...schema.properties,
        ...PREDEFINED_SCHEMAS[predef],
      }
    }

    schemaMap[`${dbname}.${k}`] = schema
  }

  return schemaMap
}

/**
 * Load all the master keys provider
 * in the configuration file.
 *
 * If master key does not exist,
 * it will create it in the vault.
 *
 * @param {String} username
 * @param {String} password
 * @param {String} cluster
 * @param {String} dbname
 * @param {{
 *   gcp: {
 *     email: String,
 *     privateKey: String,
 *   }
 * }} kmsProviders
 * @returns {{
 *   [keyAltName]: UUID()
 * }}
 */
async function loadMasterKeys(
  username,
  password,
  cluster,
  dbname,
  kmsProviders,
) {
  const vaultDBname = getVaultName(dbname)
  const keyVaultNamespace = getVaultNamespace(dbname)

  const vaultClient = new MongoClient(
    `mongodb+srv://${username}:${password}@${cluster}/${vaultDBname}?retryWrites=true&w=majority`,
    DEFAULT_CONNECTION,
  )

  await vaultClient.connect()

  const vault = new ClientEncryption(vaultClient, {
    keyVaultNamespace,
    kmsProviders,
  })

  // Collect all the keys
  let keys = []

  if (CONFIGURATION.masterKeys) {
    keys = Object.entries(CONFIGURATION.masterKeys).reduce((acc, [k, v]) => {
      v.keyAltName = k
      acc.push(v)
      return acc
    }, [])
  }

  for (const [, v] of Object.entries(CONFIGURATION.collections)) {
    if (!v.masterKey?.keyAltName) continue

    keys.push(v.masterKey)
  }

  let masterkeys = {}

  for (const k of keys) {
    const { provider, projectId, location, keyRing, keyName, keyAltName } = k
    const datakey = await vault.getKeyByAltName(keyAltName)
    let key = null
    if (datakey) {
      key = datakey._id
    } else {
      key = await vault.createDataKey(provider, {
        masterKey: {
          projectId,
          location,
          keyRing,
          keyName,
        },
        keyAltNames: [keyAltName],
      })
    }

    masterkeys[keyAltName] = key
  }

  return masterkeys
}
