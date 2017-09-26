/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const getBlpuLabel = require('../functions/get-blpu-label')
const reducedFlatData = require('./fixtures/flatTest.json')
const flatData = require('./fixtures/flat.json')

describe('General addressbox tests', function () {
  it('Should test flat label with reduced json fields', function () {
    const label = getBlpuLabel(reducedFlatData)
    expect(label).to.be.eql('Organisation, Flat 2 1A-2B, 121 Alphington Road, Exeter, EX2 8JD')
  })
  it('Should test flat label', function () {
    const label = getBlpuLabel(flatData)
    expect(label).to.be.eql('Flat 2, 121 Alphington Road, Exeter, EX2 8JD')
  })
})
