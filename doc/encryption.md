# Automatic Encryption

## Summary

---

The `@keonnie/active-record` package provides a convenient and automated way to handle field-level encryption in your ActiveRecord models when using the `MongoDB Driver`.

With the `Automatic Encryption` feature, you can define encryption settings for specific fields in your models through a configuration file named `.karenc.yml`. This file allows you to specify fields, encryption types (`deterministic` or `random`), field types (e.g. `string`, `int`, `obj`), and optionally include preset configurations, such as `PII`.

The package automatically applies the defined encryption settings to the specified fields during data persistence and retrieval, making it easy to add encryption to your `ActiveRecord` models without the need for manual encryption code.

Please note that the `Automatic Encryption` feature is currently supported only for the `MongoDB Driver`.

## Compatibility

| Name                   | Version |
| ---------------------- | ------- |
| MongoDB Node.js Driver | > 4.0   |

## Configuration

---

### Pre-requisite

Client-Side Field Level Encryption (CSFLE) in MongoDB requires the installation and configuration of `mongocryptd`, a local encryption daemon. `mongocryptd` is responsible for handling encryption and decryption operations required for CSFLE. It runs locally on the client machine and communicates with the MongoDB server to perform encryption and decryption tasks. To set up CSFLE in MongoDB, you need to install and configure `mongocryptd` on your system. You can follow the official installation guide provided by MongoDB for detailed instructions. The installation guide can be found at:

https://www.mongodb.com/docs/manual/administration/install-enterprise-linux/#std-label-install-enterprise-linux

### Setting up Connection

To set up the connection with the MongoDB server, you can use the `MongoDBFacade.connect(...)` method provided by the `@keonnie/active-record` package. This method requires the following arguments:

| Name       | Type     | Description                                                                                                                               |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `username` | `string` | The username to connect to the MongoDB server.                                                                                            |
| `password` | `string` | The password for the provided username.                                                                                                   |
| `cluster`  | `string` | The MongoDB cluster to connect to, in the format `<cluster-name>.mongodb.net`.                                                            |
| `dbname`   | `string` | The name of the database to connect to.                                                                                                   |
| `opts`     | `object` | You can also provide an optional opts object that can contain additional configuration options, such as `kmsProviders` and `autoEncrypt`. |

Here's an example of how you can use the `MongoDBFacade.connect` method to set up the connection with `automatic encryption`:

```js
import { MongoDBFacade } from '@keonnie/active-record'

const username = 'my-username'
const password = 'my-password'
const cluster = 'my-cluster.mongodb.net'
const dbname = 'my-dbname'

const opts = {
  autoEncrypt: true
  kmsProviders: {
    gcp: {
      projectId: 'my-project-id',
      location: 'my-location',
      keyRing: 'my-key-ring',
      keyName: 'my-key-name',
    }
  },
}

await MongoDBFacade.connect(username, password, cluster, dbname, opts);
```

**Note**: If the specified database name is "mydb", a new database with the same name suffixed with `-vault` (e.g., `mydb-vault`) will be created to store the encrypted fields.

### File Requirement

The `@keonnie/active-record` package requires a YAML configuration file to be present in the root of your project. The filename should be name `.karenc.yml`, to uniquely identify it for the package. This configuration file contains the encryption settings for different collections and master keys used.

The package will automatically discover and load this configuration file during runtime to configure the encryption settings for your `ActiveRecord` models. If the configuration file is not present, the package will not be able to apply encryption to the fields in your models, and you may encounter errors or unexpected behavior.

Please ensure that the configuration file is properly formatted according to the provided schema, and that it is located in the root of your project before using the package for encryption in your `ActiveRecord` models.

#### **Master Keys**

Master keys are defined under the `masterKeys` key in the YAML file. Each master key is represented by a master key name (equivalent to `keyAltName`), followed by its configuration options. The available configuration options for a master key are as follows:

- `projectId` (required): The project ID of the KMS provider where the master key is stored.

- `provider` (required): The KMS provider where the master key is hosted. This should correspond to a valid KMS provider that has been configured in your application. _Currently, only support `gcp`_.

- `location` (required): The region of the KMS provider where the master key is stored.

- `keyRing` (required): The key ring of the KMS provider where the master key is stored.

- `keyName` (required): The key name of the KMS provider where the master key is stored.

#### **Collections**

Collections are defined under the `collections` key in the YAML file. Each collection is represented by a collection name, followed by its configuration options. The available configuration options for a collection are as follows:

- `masterKey` (required): The master key to use for encryption. This can be either a reference to a master key defined in the `masterKeys` section of the YAML file, or an inline definition of the master key with its configuration options.

- `includes` (optional): The preset to use for the field. This can be a predefined preset name, such as `PII`, which is provided by the `ActiveRecord` package. If a preset is specified, it will override any other field-level configuration options for the field.

- `fields` (required): The fields to encrypt for this collection. Fields are defined as key-value pairs, where the key is the name of the field, and the value is an object that specifies the field's configuration options.

  - `type` (required): The type of the field's value. This can be a string, int, obj, or any other valid data type.

  - `encryption` (required): The type of encryption to use for the field. This can be `deterministic` or `random`, depending on the desired encryption method.

## Example Configuration

---

### Google Cloud KMS

Here's an example YAML configuration that illustrates the usage of the encryption configuration for Google Cloud KMS:

```yaml
# .karenc.yml
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
      provider: gcp
      projectId: anotherproject
      location: anotherlocation
      keyRing: anotherkeyring
      keyName: anothercryptokey
      keyAltName: differentKeyAltName
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
```
