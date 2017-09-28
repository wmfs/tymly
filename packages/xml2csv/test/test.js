/* eslint-env mocha */

'use strict'

const path = require('path')
const expect = require('chai').expect
const xml2csv = require('./../lib')

describe('Run some basic tests', function () {
  it('should convert the XML file to a CSV file', function (done) {
    xml2csv(
      {
        xmlPath: path.resolve(__dirname, 'fixtures', 'simpsons.xml'),
        csvPath: path.resolve(__dirname, 'output', 'simpsons.csv'),
        rootXMLElement: 'Person',
        headerMap: [
          ['Name', 'name', 'string'],
          ['Age', 'age', 'integer'],
          ['Gender', 'gender', 'string'],
          ['Brother', 'brother', 'string', 'Siblings'],
          ['Sister', 'sister', 'string', 'Siblings']
        ]
      },
      function (err) {
        expect(err).to.eql(null)
        done()
      }
    )
  })
})
