# Dependencies

A list of dependencies used in this project The intent is to provide the process of using a specific dependency and ease the maintenance for the future.

## Live

### inflected

We have included the `inflected` package in our dependencies for two important reasons.

Firstly, it allows us to automatically pluralize table names when mapping class names to table names, which simplifies database operations and reduces the chances of errors caused by inconsistent naming conventions ensuring that the mapping between the class and database tables are consistent and predictable.

Secondly, it provides the flexibility to map different variations of field names for our `encryption-schemas`. This is useful because it allows to define field names once for a variety of formats (such as first_name, firstName, etc.) which will provide flexibility in naming for developers using the package.

### mongodb

The project is first giving support to MongoDB, as other Keonnie's projects will depend on this project to be able to move forward. Each database will be later put into its own packages, which will handle the connection and data management between the database and this core project.

### mongodb-client-encryption & mongocrypt

We believe that security is important, and therefore we have added the `mongodb-client-encryption` package as a dependency. This package allows us to provide the ability to encrypt data at the field level, such as Personally Identifiable Information (PII), for any application using our package with MongoDB.

Client-side field-level encryption (FLE) is a powerful tool for ensuring the security of sensitive data stored in a MongoDB database. By using FLE, we can ensure that PII data, such as email addresses, are always encrypted when stored in the database, providing an additional layer of protection against unauthorized access.

By including the `mongodb-client-encryption` package as a dependency, we are making it easy for developers to take advantage of this important security feature, while also ensuring that our package is always up-to-date with the latest security best practices.

`mongocryptd` is also required when using automatic encryption on Atlas.

### yaml

We have included the `yaml` library in our project to transform configuration files written in YAML format into JavaScript objects. This allows us to easily read and process YAML configuration files in applications, such as the `.karenc.yml` file that specifies the encryption settings for our this package. By using `yaml`, we can efficiently parse and serialize YAML data, making it easier to work with YAML configuration files in JavaScript applications.

## Development

### eslint & prettier & its plugins

Code quality and uniformity are important to us. The code base must be consistent in order to facilitate maintenance and keep the code uniform in accordance with community standards as well as our own rules.

### jest

All our projects related to JavaScript use `jest`, and we wanted to ensure that we kept things uniform across all projects. We love the syntax, the snapshot, and the mocking abilities of the entire package.

### typescript

This project needs to include a typescript package to ensure that this package can be used both with commonjs and esm. When building, this package is translated into typescript for that purpose.
