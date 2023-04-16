# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2023-04-16

### Added

- Support for MongoDB Client-Side Field Level Encryption (CSFLE) with configuration file `.karenc.yml`
- Included `encryption.md` documentation providing details on setting up CSFLE
- Added `mongodb-client-encryption` and `mongocrypt` dependencies to enable CSFLE functionality
- Included `yaml` package as a dependency for transforming YAML configuration files into JSON objects
- Added predefined pattern for Personally Identifiable Information (PII) for models

### Changed

- Instantiation of MongoDB Client is now done at `connect`

## [0.0.1] - 2023-04-16

### Added

- Singleton database handler
- Facade for MongoDB support
- Model support through inheritance from `ActiveRecord`
- `find` support to search for the first single record matching arguments
- Primary key(s) indication through `static __primaryKey` in Models
- Auto-population of timestamp date/time (created_at & updated_at) with `static __timestamp`
- `id` getter/setter for Active Record Models
- Saving instance model via `Model.save`
- Creating and saving model via `Model.create`
- Newing model without saving via `Model.new`
- Finding first matching record or creating it via `Model.first_or_create`
- Add validators helpers for email
- Add validators helpers for string

[unreleased]: https://github.com/keonnie/active-record/compare/0.1.0...HEAD
[0.1.0]: https://github.com/keonnie/active-record/compare/0.0.1...0.1.0
[0.0.1]: https://github.com/keonnie/active-record/releases/tag/0.0.1
