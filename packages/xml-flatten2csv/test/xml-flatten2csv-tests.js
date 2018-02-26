/* eslint-env mocha */

const path = require('path')
const fs = require('fs')
const expect = require('chai').expect
const xmlFlatten2csv = require('../lib')

describe('xmlFlatten2CSV', function () {
  it('convert simple xml to csv', async () => {
    const sourceFile = path.resolve(__dirname, 'fixtures', 'simpsons.xml')
    const outputFile = path.resolve(__dirname, 'output', 'simpsons.csv')
    const expectedFile = path.resolve(__dirname, 'expected', 'simpsons.csv')

    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile)

    await xmlFlatten2csv({
      xmlPath: sourceFile,
      csvPath: outputFile,
      rootXMLElement: 'Episode',
      pivotPath: '$.Person',
      headerMap: [
        ['$.Title', 'title', 'string'],
        ['@.Name', 'name', 'string'],
        ['@.Age', 'age', 'integer'],
        ['@.Gender', 'gender', 'string'],
        ['@.Siblings.Brother', 'brother', 'string'],
        ['@.Siblings.Sister', 'sister', 'string']
      ]
    })

    const output = fs.readFileSync(outputFile, { encoding: 'utf8' }).split('\n')
    const expected = fs.readFileSync(expectedFile, { encoding: 'utf8' }).split('\n')

    expect(output).to.eql(expected)
  })
})
