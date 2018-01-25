const fs = require('fs')
const path = require('path')
const tar = require('tar')
const mkdirp = require('mkdirp')

async function create (directory, tgzName) {
  const fn = monkeyPatchReadLink()
  try {
    return await createTar(directory, tgzName)
  } finally {
    fn.restore()
  }
} // create

function createTar (directory, tgzName) {
  return tar.create(
    {
      gzip: true,
      file: tgzName
    },
    [directory]
  )
} // createTar

const noPatch = { restore: () => {} }
class RelativeReadlink {
  constructor () {
    this.original = fs.readlink
    fs.readlink = this.relativeReadlink.bind(this)
  } // constructor

  relativeReadlink (linkFrom, options, callback) {
    const thunkedOptions = (typeof options !== 'function') ? options : { }
    const thunkedCallback = (typeof options === 'function' ? options : callback)

    this.original(
      linkFrom,
      thunkedOptions,
      (err, linkTo) => thunkedCallback(err, this.relativize(linkFrom, linkTo))
    )
  } // relativeReadlink

  relativize (linkFrom, linkTo) {
    const relativeLink = path.relative(linkFrom, linkTo)
      .replace(/\\/g, '/') // convert forward slashes to back slashes
      .replace('../', '')  // and trim off one level

    return relativeLink
  } // relativize

  restore () {
    fs.readlink = this.original
  } // restore
} // class RelativeReadlink

function monkeyPatchReadLink () {
  return (process.platform === 'win32')
    ? new RelativeReadlink()
    : noPatch
} // monkeyPatchReadLink

async function extract (tgzName, wd = process.cwd()) {
  if (!fs.existsSync(wd)) {
    mkdirp.sync(wd)
  }

  return tar.extract(
    {
      gzip: true,
      file: tgzName,
      cwd: wd
    }
  )
} // extract

async function list (tgzName) {
  const l = []
  await tar.list(
    {
      gzip: true,
      file: tgzName,
      sync: true,
      onentry: entry => {
        if (entry.type === 'File') {
          l.push(entry.path)
        } // if ...
        if (entry.type === 'SymbolicLink') {
          l.push(`${entry.path} -> ${entry.linkpath}`)
        }
      }
    } // options
  )
  return l
} // list

module.exports = {
  create: create,
  extract: extract,
  list: list
}
