/* eslint-env mocha */
'use strict'

// const chai = require('chai')
// const expect = chai.expect
const concretePaths = require('./../lib')
const path = require('path')

describe('Run some basic path-discovery things', function () {
  it('Should test simple glob-pattern string usage', async() => {
    const result = await concretePaths(path.resolve(__dirname, './fixtures/stuff/**/*.js'))
    console.log('>>>>', result)
  })
})
