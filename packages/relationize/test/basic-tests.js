/* eslint-env mocha */

'use strict'

const relationize = require('./../lib/index')
const chai = require('chai')
const chaiSubset = require('chai-subset')
chai.use(chaiSubset)
const expect = chai.expect
const path = require('path')

const schemaDir = path.resolve(__dirname, 'fixtures', 'schema')
const expectedDir = path.resolve(__dirname, 'fixtures', 'expected')

describe('Run some basic tests', function () {
  it('database structure for a simple schema', done => {
    const peopleSchema = require(path.resolve(schemaDir, 'people/people.json'))

    relationize({
      source: {
        schemas: [{
          namespace: 'relationizeTest',
          schema: peopleSchema
        }]
      }
    },
    (err, dbStructure) => {
      if (err) return done(err)

      const expected = require(path.resolve(expectedDir, 'people-structure.json'))
      expect(dbStructure).to.containSubset(expected)

      done()
    }
    )
  })

  it('database structure for a nested schema', async () => {
    const dbStructure = await relationize({
      source: {
        paths: [{
          namespace: 'relationizeTest',
          path: path.resolve(schemaDir, 'planet')
        }]
      }
    })

    const expected = require(path.resolve(expectedDir, 'planet-structure.json'))
    expect(dbStructure).to.containSubset(expected)
  })

  xit('database structure for a table and a view', async () => {
    const peopleSchema = require(path.resolve(schemaDir, 'people/people.json'))

    const dbStructure = await relationize({
      source: {
        schemas: [{
          namespace: 'relationizeTest',
          schema: peopleSchema
        }]
      }
    })

    const expected = require(path.resolve(expectedDir, 'people-with-view-structure.json'))
    expect(dbStructure).to.containSubset(expected)
  })
})
