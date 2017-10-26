class Status {
  static get RUNNING () { return 'RUNNING' }
  static get STOPPED () { return 'STOPPED' }
  static get COMPLETE () { return 'COMPLETE' }
  static get SUCCEEDED () { return 'SUCCEEDED' }
  static get FAILED () { return 'FAILED' }
}

module.exports = Status
