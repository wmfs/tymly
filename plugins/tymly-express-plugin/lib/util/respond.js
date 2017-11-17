const boomUp = require('./boom-up')

function respond (res, err, result, code, msg) {
  if (err) {
    const boomErr = boomUp(err, msg)
    res.status(boomErr.output.statusCode).send(boomErr.output.payload)
  } else {
    res.status(code).send(!noContent(code) ? result : undefined)
  }
} // respond

function noContent (code) {
  return code === 204
} // noResponse

module.exports = respond
