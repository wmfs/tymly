class EachPromise {
  constructor (body) {
    this.eachCb_ = () => { }

    this.promise_ = null
    this.body_ = body

    setTimeout(() => this.start(), 100)
  } // constructor

  start () {
    if (this.isThened) return

    this.body_(this.eachCb_, () => {}, err => { throw err })
  } // startBody

  get isThened () { return this.promise_ !== null }

  each (eachCb) {
    this.eachCb_ = eachCb
    this.each = undefined
    return this
  } // each

  then (thenCb) {
    return this.makePromise().then(thenCb)
  } // then

  catch (catchCb) {
    return this.makePromise().catch(catchCb)
  } // catchCb

  makePromise () {
    this.promise_ = new Promise((resolve, reject) => {
      this.body_(
        this.eachCb_,
        resolve,
        reject)
    })
    return this.promise_
  }
} // class EachPromise

module.exports = EachPromise
