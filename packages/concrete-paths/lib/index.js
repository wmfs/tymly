'use strict'

const DEFAULT_OPTIONS = {
  delimiter: ';'
}

const _ = require('lodash')
const globby = require('globby')
// const path = require('upath')

module.exports = async function concretePaths (sourcePatterns, suppliedOptions) {
  // Default any options
  const options = _.defaults(suppliedOptions, DEFAULT_OPTIONS)

  // Normalize input an array if supplied a single source string
  if (_.isString(sourcePatterns)) {
    sourcePatterns = [sourcePatterns]
  } else if (_.isUndefined(sourcePatterns) || _.isNull(sourcePatterns)) {
    sourcePatterns = []
  }

  if (_.isArray(sourcePatterns)) {
    // Split any delimited source paths and build an array of patterns for use with globby.
    let splitSourcePatterns = []
    sourcePatterns.forEach(sourcePath => {
      splitSourcePatterns = splitSourcePatterns.concat(sourcePath.split(options.delimiter))
    })

    // Now glob split source paths
    let concretePaths = []
    for (const sourcePattern of splitSourcePatterns) {
      concretePaths = concretePaths.concat(await globby(sourcePattern))
    }
    return concretePaths
  } else {
    throw new Error(`Unable to parse source input of ${sourcePatterns} into concrete paths`)
  }
}
