'use strict'
const util = require('util')

class StartupMessages {
  constructor () {
    this.reset()
  }

  reset () {
    this.noErrors = true
    this.noWarnings = true
    this.errors = []
    this.warnings = []
  }

  title (text) {
    console.log('')
    console.log('Starting Tymly')
    console.log('---------------')
  }

  heading (text) {
    console.log('')
    console.log('  ' + text + ':')
    console.log('')
  }

  subHeading (text) {
    console.log('  > ' + text)
  }

  info (text) {
    console.log('    - ' + text)
  }

  detail (text) {
    console.log('      . ' + text)
  }

  error (err) {
    this.noErrors = false
    this.errors.push(err)
  }

  warning (warning) {
    this.noWarnings = false
    this.warnings.push(warning)
  }

  showAnyWarnings (phaseLabel) {
    const l = this.warnings.length
    if (l > 0) {
      console.log()
      console.log('WARNINGS')
      console.log('--------')
      console.log()
      let title = 'Tymly encountered ' + l + ' warning'
      if (l !== 1) {
        title += 's'
      }
      title += ' while ' + phaseLabel + ':'
      console.log(title)
      console.log()
      for (let i = 0; i < l; i++) {
        console.log('[' + (i + 1) + '] ' + this.warnings[i])
      }
    }
  }

  showErrors (phaseLabel) {
    console.error()
    console.error('ERRORS')
    console.error('------')
    const l = this.errors.length
    let title = 'Tymly encountered ' + l + ' error'
    if (l !== 1) {
      title += 's'
    }
    title += ' while ' + phaseLabel + ':'

    let error
    for (let i = 0; i < l; i++) {
      error = this.errors[i]
      console.error('')
      console.error('[' + (i + 1) + '] ' + error.name)
      console.error('  - ' + error.message)
      if (error.hasOwnProperty('body')) {
        console.error(error.body)
      }
    }

    console.error('')
    console.error(title)
  }

  makeErrorsForCallback (eventLabel) {
    const l = this.errors.length
    let message = 'Encountered ' + l + ' error'
    if (l !== 1) {
      message += 's'
    }
    message += ' while ' + eventLabel + '. First error: ' + util.inspect(this.errors[0])

    return {
      name: 'errors',
      message: message
    }
  }
}

module.exports = new StartupMessages()
