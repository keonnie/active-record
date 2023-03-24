# Dependencies

A list of dependencies used in this project The intent is to provide the process of using a specific dependency and ease the maintenance for the future.

## Live

### inflected

The project is mainly using it to be able to map class names to table names. Table names will be pluralized while models are singular. Having said that, we do foresee the usage of `inflected` in future implementation.

### mongodb

The project is first giving support to MongoDB, as other Keonnie's projects will depend on this project to be able to move forward. Each database will be later put into its own packages, which will handle the connection and data management between the database and this core project.

## Development

### eslint & prettier & its plugins

Code quality and uniformity are important to us. The code base must be consistent in order to facilitate maintenance and keep the code uniform in accordance with community standards as well as our own rules.

### jest

All our projects related to JavaScript use `jest`, and we wanted to ensure that we kept things uniform across all projects. We love the syntax, the snapshot, and the mocking abilities of the entire package.

### typescript

This project needs to include a typescript package to ensure that this package can be used both with commonjs and esm. When building, this package is translated into typescript for that purpose.
