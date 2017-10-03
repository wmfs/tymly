'use strict'

// Adapted from:
// https://github.com/pensierinmusica/firstline/blob/master/index.js
// The MIT License (MIT)
//
// Copyright (c) 2015 Alessandro Zanardi
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
//   The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const fs = require('fs')

module.exports = function (path) {
  return new Promise(function (resolve, reject) {
    const rs = fs.createReadStream(path, {encoding: 'utf8'})
    let acc = ''
    let pos = 0
    let index
    rs
      .on('data', function (chunk) {
        index = chunk.indexOf('\n')
        acc += chunk
        if (index === -1) {
          pos += chunk.length
        } else {
          pos += index
          rs.close()
        }
      })
      .on('close', function () {
        resolve(acc.slice(0, pos))
      })
      .on('error', function (err) {
        reject(err)
      })
  })
}
