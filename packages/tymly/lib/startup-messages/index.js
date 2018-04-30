const util = require('util')

class StartupMessages {
  constructor () {
    this.reset()

    this.log = console.log
    this.err = console.error
  }

  setLog (newLog) {
    return this._setOutput('log', newLog)
  } // setLog

  setErr (newErr) {
    return this._setOutput('err', newErr)
  }

  _setOutput (name, newStr) {
    const old = this[name]
    this[name] = newStr
    return old
  }

  reset () {
    this.noErrors = true
    this.noWarnings = true
    this.errors = []
    this.warnings = []
  }

  title (text = 'Tymly') {
    this.log('')
    this.log(`Starting ${text}`)
    this.log('-'.repeat(9 + text.length))
  }

  heading (text) {
    this.log('')
    this.log('  ' + text + ':')
    this.log('')
  }

  subHeading (text) {
    this.log('  > ' + text)
  }

  info (text) {
    this.log('    - ' + text)
  }

  detail (text) {
    this.log('      . ' + text)
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
      this.log()
      this.log('WARNINGS')
      this.log('--------')
      this.log()
      let title = 'Tymly encountered ' + l + ' warning'
      if (l !== 1) {
        title += 's'
      }
      title += ' while ' + phaseLabel + ':'
      this.log(title)
      this.log()
      for (let i = 0; i < l; i++) {
        this.log('[' + (i + 1) + '] ' + this.warnings[i])
      }
    }
  }

  showErrors (phaseLabel) {
    this.err()
    this.err('ERRORS')
    this.err('------')
    const l = this.errors.length
    let title = 'Tymly encountered ' + l + ' error'
    if (l !== 1) {
      title += 's'
    }
    title += ' while ' + phaseLabel + ':'

    let error
    for (let i = 0; i < l; i++) {
      error = this.errors[i]
      this.err('')
      this.err('[' + (i + 1) + '] ' + error.name)
      this.err('  - ' + error.message)
      if (error.hasOwnProperty('body')) {
        this.err(error.body)
      }
    }

    this.err('')
    this.err(title)
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

module.exports = () => new StartupMessages()
