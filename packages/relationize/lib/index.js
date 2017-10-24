
const loader = require('./loader')
const parser = require('./parser')
const promisify = require('util').promisify

const NotSet = 'NotSet'
const relationizeP = promisify(relationize)

function relationize (options, callback = NotSet) {
  if (callback === NotSet) {
    return relationizeP(options)
  }

  loader(options, function (err, schemaFiles) {
    if (err) {
      callback(err)
    } else {
      callback(null, parser(schemaFiles, options))
    }
  }
  )
}

module.exports = relationize
