'use strict'

module.exports = {
  description: 'Provides a mechanism for states to refer to site-specific values',
  blueprintDirs: {
    'registry-keys': 'Consider a blueprint that defines a simple workflow that sends a Tweet - what Twitter username/password should be used? This is where _Registry Keys_ come in useful... a simple key/value store inside Tymly, where keys are declared inside this sub-directory. To help conjure administrative screens and help validation, the required value content is described using JSON Schema.'
  }
}
