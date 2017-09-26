/* eslint-env mocha */

'use strict'

const chai = require('chai')
const expect = chai.expect
const combSuf = require('../functions/utils/combine-numbers-and-suffixes')

describe('Combine suffixes and numbers tests', function () {
  const testlabels = [
    ['a single start number', [51, null, null, null], '51'],
    ['a single end number', [null, null, 51, null], '51']
  ]

  for (const test of testlabels) {
    it(test[0], function () {
      const label = combSuf(...test[1])
      expect(label).to.eql(test[2])
    })
  }

  it('Should test a single start number', function () {
    const label = combSuf(51, null, null, null)
    expect(label).to.eql('51')
  })

  it('Should test a single end number', function () {
    const label = combSuf(null, null, 51, null)
    expect(label).to.eql('51')
  })

  it('Should test a start number and suffix', function () {
    const label = combSuf(51, 'A', null, null)
    expect(label).to.eql('51A')
  })

  it('Should test a single start suffix', function () {
    const label = combSuf(null, 'A', null, null)
    expect(label).to.eql('A')
  })

  it('Should test a end number and suffix', function () {
    const label = combSuf(null, null, 51, 'A')
    expect(label).to.eql('51A')
  })

  it('Should test a single end suffix', function () {
    const label = combSuf(null, null, null, 'A')
    expect(label).to.eql('A')
  })

  it('Should test a start and end number', function () {
    const label = combSuf(51, null, 53, null)
    expect(label).to.eql('51-53')
  })

  it('Should test a start and end numbers plus start suffix', function () {
    const label = combSuf(51, 'A', 53, null)
    expect(label).to.eql('51A-53')
  })

  it('Should test a start and end numbers plus end suffix', function () {
    const label = combSuf(51, null, 53, 'A')
    expect(label).to.eql('51-53A')
  })

  it('Should test a start and end numbers plus suffixes', function () {
    const label = combSuf(51, 'A', 53, 'C')
    expect(label).to.eql('51A-53C')
  })

  it('Should test null numbers and suffixes', function () {
    const label = combSuf(51, 'A', 53, 'C')
    expect(label).to.eql('51A-53C')
  })
})
