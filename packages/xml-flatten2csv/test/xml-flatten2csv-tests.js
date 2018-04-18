/* eslint-env mocha */

const path = require('path')
const fs = require('fs')
const expect = require('chai').expect
const assert = require('chai').assert
const xmlFlatten2csv = require('../lib')

describe('xmlFlatten2csv', () => {
  const tests = [
    ['xml to csv', 'simpsons.csv', [
      ['$.Title', 'title', 'string'],
      ['@.Name', 'name', 'string'],
      ['@.Age', 'age', 'integer'],
      ['@.Siblings.Sister', 'sister', 'string'],
      ['@.Siblings.Brother', 'brother', 'string']
    ] ],
    ['xml to csv, with conditions', 'simpsons-conditions.csv', [
      ['$.Title', 'title', 'string'],
      ['@.Name', 'name', 'string'],
      [{test: '@.Age<=16', value: 'yes'}, 'child', 'string'],
      [{test: '@.Age>16', select: '@.Age'}, 'age', 'integer'],
      ['@.Siblings[?(@.Sister === "Nediana")].Sister', 'okely-dokely', 'string'],
      ['@.Siblings[?(@.Brother === "Bart")].Brother', 'eat-my-shorts', 'string']
    ] ],
    ['xml to csv, with value transforms', 'simpsons-transforms.csv', [
      ['$.Title', 'title', 'string'],
      [{select: '@.Name', transform: v => v.toUpperCase()}, 'name', 'string'],
      [{test: '@.Age<=16', value: 'yes'}, 'child', 'string'],
      [{test: '@.Age>16', select: '@.Age', transform: v => `${v} years old`}, 'age', 'string']
    ] ]
  ]

  describe('extract XML', () => {
    for (const [title, filename, headerMap] of tests) {
      it(title, async () => {
        const sourceFile = path.resolve(__dirname, 'fixtures', 'simpsons.xml')
        const outputFile = path.resolve(__dirname, 'output', filename)
        const expectedFile = path.resolve(__dirname, 'expected', filename)

        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile)

        await xmlFlatten2csv({
          xmlPath: sourceFile,
          csvPath: outputFile,
          rootXMLElement: 'Episode',
          pivotPath: '$.People.Person',
          headerMap: headerMap
        })

        const output = fs.readFileSync(outputFile, {encoding: 'utf8'}).split('\n')
        const expected = fs.readFileSync(expectedFile, {encoding: 'utf8'}).split('\n')

        expect(output).to.eql(expected)
      })
    }
  })

  describe('error cases', () => {
    const sourceFile = path.resolve(__dirname, 'fixtures', 'simpsons.xml')
    const outputFile = path.resolve(__dirname, 'output', 'fail.csv')

    it('bad input file', async () => {
      try {
        await xmlFlatten2csv({
          xmlPath: 'i-do-not-exist',
          csvPath: outputFile,
          rootXMLElement: 'Episode',
          pivotPath: '$.People.Person',
          headerMap: [
            ['$.Title', 'title', 'string'],
            ['@.Name', 'name', 'string'],
            ['@.Age', 'age', 'integer'],
            ['@.Siblings.Brother', 'brother', 'string'],
            ['@.Siblings.Sister', 'sister', 'string']
          ]
        })
      } catch (err) {
        expect(err.code).to.equal('ENOENT')
        return
      }

      assert.fail('Did not throw')
    })

    it('bad output file', async () => {
      try {
        await xmlFlatten2csv({
          xmlPath: sourceFile,
          csvPath: '/root/can#t"be/created',
          rootXMLElement: 'Episode',
          pivotPath: '$.Person',
          headerMap: [
            ['$.Title', 'title', 'string'],
            ['@.Name', 'name', 'string'],
            ['@.Age', 'age', 'integer'],
            ['@.Siblings.Brother', 'brother', 'string'],
            ['@.Siblings.Sister', 'sister', 'string']
          ]
        })
      } catch (err) {
        expect(err.code).to.equal('EACCES')
        return
      }

      assert.fail('Did not throw')
    })

    it('empty header map', async () => {
      try {
        await xmlFlatten2csv({
          xmlPath: sourceFile,
          csvPath: outputFile,
          rootXMLElement: 'Episode',
          pivotPath: '$.Person',
          headerMap: []
        })
      } catch (err) {
        return
      }

      assert.fail('Did not throw')
    })
  })
})
