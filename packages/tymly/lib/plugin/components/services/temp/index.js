'use strict'
const schema = require('./schema.json')

// A service for a dealing with a temp directory
//
// Order of play:
// 1] Use the explicitly defined tempDir config
// 2] Else use the $TYMLY_TEMPDIR environment variable
// 3] Else use the system temp dir

const os = require('os')
const mkdirp = require('mkdirp')
const path = require('path')

class TempService {
  boot (options, callback) {
    options.messages.info('Discovering:')

    const fromConfig = options.config.tempDir
    const fromEnvVariable = process.env.TYMLY_TEMPDIR
    const fromSystem = os.tmpdir()

    options.messages.detail('Config: ' + fromConfig)
    options.messages.detail('$TYMLY_TEMPDIR: ' + fromEnvVariable)
    options.messages.detail('System: ' + fromSystem)

    /**
     * This is the value as derived by first considering if a `tempDir` value is specified in the config, failing that if a `$TYMLY_TEMPDIR` environment variable has been set... and if all else fails use the system temp dir (i.e. the value returned by `os.tmpdir()`)
     * @property {string} tempDir The root of Tymly's temporary directory
     * @example
     * console.log(temp.tempDir) // /some/absolute/dir
     */
    this.tempDir = fromConfig || fromEnvVariable || fromSystem

    options.messages.info('Resolved: ' + this.tempDir)

    callback(null)
  }

  /**
   * Makes a new temporary directory using [mkdirp](https://www.npmjs.com/package/mkdirp)
   * @param {string} subDirPath A sub dir to create relative to `temp.tempDir`
   * @param {Function} callback called with the absolute path to the dir that was created
   * @returns {undefined}
   * @example
   * temp.makeDirPath(
   *   'some/subDir',},
   *   function (err, fullPath) {
   *     // Where fullPath would be something absolute, e.g:
   *     //   /temp/dir/some/subDir
   *   }
   * )
   */
  makeTempDir (subDirPath, callback) {
    const fullPath = path.join(this.tempDir, 'tymly', subDirPath)
    mkdirp(
      fullPath,
      function (err) {
        if (err) {
          callback(err)
        } else {
          callback(null, fullPath)
        }
      }
    )
  }
}

module.exports = {
  schema: schema,
  serviceClass: TempService
}
