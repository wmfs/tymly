/* eslint-env mocha */

'use strict'

const PGClient = require('pg-client-helper')
const process = require('process')
const chai = require('chai')
const chaiSubset = require('chai-subset')
chai.use(chaiSubset)
const expect = chai.expect

describe('This will break everything', function () {
  const client = new PGClient(process.env.PG_CONNECTION_STRING)

  const script = [
    'BEGIN',
    'CREATE SCHEMA IF NOT EXISTS banjax;',
    'DROP TABLE IF EXISTS banjax.test;',
    'CREATE TABLE banjax.test (id bigint not null primary key,info text not null);',
    'INSERT INTO banjax.test (id, info) VALUES (1, \'Flubble\')',
    'COMMIT;'
  ]
  const statements = script.map(sql => { return { sql: sql } })

  it('Fire off some sql statements', async () => {
    const errors = []
    const t = new Promise((resolve, reject) => {
      const cb = err => {
        errors.push(err)
        resolve(errors)
      }
      client.run(statements, cb)
    })

    await t
    expect(errors[0]).to.equal(null)
  })

  it('Fire them off twice in a row', async () => {
    const errors = []
    const t = new Promise((resolve, reject) => {
      const cb = err => {
        errors.push(err)
        if (errors.length === 2) {
          resolve(errors)
        }
      }
      client.run(statements, (err) => {
        cb(err)
        client.run(statements, cb)
      })
    })

    await t
    expect(errors[0]).to.equal(null)
    expect(errors[1]).to.equal(null)
  })

  xit('Fire off conflicting sql statements simultaneously', async () => {
    const errors = []
    const t = new Promise((resolve, reject) => {
      const cb = err => {
        errors.push(err)
        if (errors.length === 2) {
          resolve(errors)
        }
      }
      client.run(statements, cb)
      client.run(statements, cb)
    })

    await t
    expect(errors[0]).to.equal(null)
    expect(errors[1]).to.equal(null)
  })
})
