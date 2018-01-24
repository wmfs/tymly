const tar = require('tar')
const fs = require('fs')
const mkdirp = require('mkdirp')

async function extract (tgzName, wd = process.cwd()) {
  if (!fs.existsSync(wd)) {
    mkdirp.sync(wd)
  }

  return tar.extract(
    {
      gzip: true,
      file: tgzName,
      sync: true,
      cwd: wd
    }
  )
} // extract

async function create (directory, tgzName) {
  return tar.create(
    {
      gzip: true,
      sync: true,
      file: tgzName
    },
    [directory]
  )
} // create

async function list (tgzName) {
  const l = []
  await tar.list(
    {
      gzip: true,
      file: tgzName,
      sync: true,
      onentry: entry => {
        if (['File', 'SymbolicLink'].indexOf(entry.type) !== -1) {
          l.push(entry.path)
        } // if ...
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
