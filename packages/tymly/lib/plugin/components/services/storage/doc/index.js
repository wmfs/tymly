'use strict'

module.exports = {
  description: 'This is the default in-memory storage service that ships with Tymly. Useful for testing and not much else.',
  blueprintDirs: {
    models: 'This sub-directory deals with the `M` portion of `MVC` - each JSON file in here defines a data model that can be subsequently used by a State Machine. Nested documents are supported along with a couple of extensions to help describe database indexes and primary keys. Tymly uses the JSON Schema standard for describing data models.'
  }
}
