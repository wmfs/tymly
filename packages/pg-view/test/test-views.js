const HlPgClient = require('hl-pg-client')
const path = require('path')

describe('Test Views', () => {
  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  let fixturesDir = path.resolve(__dirname, 'fixtures')
  let client;

  function sqlFile(filename) {
    return client.runFile(path.join(fixturesDir, 'scripts', filename))
  }

  describe('setup', () => {
    it('database client', () => {
      client = new HlPgClient(process.env.PG_CONNECTION_STRING)
    })

    it('install test tables and data', async () => {
      await sqlFile('setup.sql')
    })
  }) // setup

  describe('cleanup', () => {
    it('teardown database', async () => {
      await sqlFile('cleanup.sql')
    })
  })
})