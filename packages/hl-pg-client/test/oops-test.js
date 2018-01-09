/* eslint-env mocha */

const PGClient = require('../lib/index')
const process = require('process')
const expect = require('chai').expect

function sqlf (statements) {
  return statements.map(sql => { return { sql: sql } })
}

function postInsert (result, ctx) {
  if (result.command === 'SELECT') {
    ctx.returnValue = result.rows[0].count
  }
}

describe('Ensure transaction isolation', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  const client = new PGClient(process.env.PG_CONNECTION_STRING)

  const setupScript = [
    'BEGIN;',
    'CREATE SCHEMA IF NOT EXISTS banjax;',
    'DROP TABLE IF EXISTS banjax.test;',
    'CREATE TABLE banjax.test (id bigint not null primary key,info text not null);',
    'COMMIT;'
  ]
  const tearDown = [
    'BEGIN;',
    'DROP TABLE IF EXISTS banjax.test;',
    'DROP SCHEMA IF EXISTS banjax;',
    'COMMIT;'
  ]

  const test1 = sqlf([
    'INSERT INTO banjax.test VALUES (0, \'hello\');',
    'INSERT INTO banjax.test VALUES (1, \'hello\');',
    'INSERT INTO banjax.test VALUES (2, \'hello\');',
    'INSERT INTO banjax.test VALUES (3, \'hello\');',
    'INSERT INTO banjax.test VALUES (4, \'hello\');',
    'INSERT INTO banjax.test VALUES (5, \'hello\');',
    'INSERT INTO banjax.test VALUES (6, \'hello\');',
    'INSERT INTO banjax.test VALUES (7, \'hello\');',
    'INSERT INTO banjax.test VALUES (8, \'hello\');',
    'INSERT INTO banjax.test VALUES (9, \'hello\');',
    'INSERT INTO banjax.test VALUES (10, \'hello\');',
    'INSERT INTO banjax.test VALUES (11, \'hello\');',
    'INSERT INTO banjax.test VALUES (12, \'hello\');',
    'INSERT INTO banjax.test VALUES (13, \'hello\');',
    'INSERT INTO banjax.test VALUES (14, \'hello\');',
    'INSERT INTO banjax.test VALUES (15, \'hello\');',
    'INSERT INTO banjax.test VALUES (16, \'hello\');',
    'INSERT INTO banjax.test VALUES (17, \'hello\');',
    'INSERT INTO banjax.test VALUES (18, \'hello\');',
    'INSERT INTO banjax.test VALUES (19, \'hello\');',
    'SELECT COUNT(*) FROM banjax.test;'
  ])
  test1.forEach(s => { s.postStatementHook = postInsert })
  const test2 = sqlf([
    'INSERT INTO banjax.test VALUES (31, \'hello\');',
    'INSERT INTO banjax.test VALUES (32, \'hello\');',
    'INSERT INTO banjax.test VALUES (33, \'hello\');',
    'INSERT INTO banjax.test VALUES (34, \'hello\');',
    'INSERT INTO banjax.test VALUES (35, \'hello\');',
    'INSERT INTO banjax.test VALUES (36, \'hello\');',
    'INSERT INTO banjax.test VALUES (37, \'hello\');',
    'INSERT INTO banjax.test VALUES (38, \'hello\');',
    'INSERT INTO banjax.test VALUES (39, \'hello\');',
    'INSERT INTO banjax.test VALUES (20, \'hello\');',
    'INSERT INTO banjax.test VALUES (21, \'hello\');',
    'INSERT INTO banjax.test VALUES (22, \'hello\');',
    'INSERT INTO banjax.test VALUES (23, \'hello\');',
    'INSERT INTO banjax.test VALUES (24, \'hello\');',
    'INSERT INTO banjax.test VALUES (25, \'hello\');',
    'INSERT INTO banjax.test VALUES (26, \'hello\');',
    'INSERT INTO banjax.test VALUES (27, \'hello\');',
    'INSERT INTO banjax.test VALUES (28, \'hello\');',
    'INSERT INTO banjax.test VALUES (29, \'hello\');',
    'INSERT INTO banjax.test VALUES (30, \'hello\');',
    'SELECT COUNT(*) FROM banjax.test;'
  ])
  test2.forEach(s => { s.postStatementHook = postInsert })

  it('Fire off some sql statements', async () => {
    await client.run(sqlf(setupScript))
    const result = await client.run(test1)
    expect(result).to.equal('20')
  })

  it('Fire them off twice in a row', async () => {
    await client.run(sqlf(setupScript))

    const result1 = await client.run(test1)
    const result2 = await client.run(test2)

    expect(result1).to.equal('20')
    expect(result2).to.equal('40')
  })

  it('Fire them off simultaneously', async () => {
    await client.run(sqlf(setupScript))

    const results = [ ]

    const q1 = client.run(test1)
      .then(r => results.push(r))
      .catch(err => results.push(err.toString()))
    const q2 = client.run(test2)
      .then(r => results.push(r))
      .catch(err => results.push(err.toString()))

    await Promise.all([q1, q2])

    // valid results are ['20', '20'] or ['20', '40'] depending on how things where scheduled
    if (results[0] === '20' && results[1] === '20') {
      return true
    }

    expect(results).to.have.all.members(['20', '40'])
  })

  it('Fire conflicting statements simultaneously', async () => {
    await client.run(sqlf(setupScript))

    const results = [ ]

    const q1 = client.run(test2)
      .then(r => results.push(r))
      .catch(err => results.push(err.toString()))
    const q2 = client.run(test2)
      .then(r => results.push(r))
      .catch(err => results.push(err.toString()))

    await Promise.all([q1, q2])

    expect(results).to.have.all.members([
      '20',
      'error: duplicate key value violates unique constraint "test_pkey"'
    ])
  })

  it('Tear down', () => {
    client.run(sqlf(tearDown))
  })
})
