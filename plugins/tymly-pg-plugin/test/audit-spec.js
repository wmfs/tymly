/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')
const sqlScriptRunner = require('./fixtures/sql-script-runner')
const process = require('process')

describe('Audit service tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, models, rewindIdToDestroy, client

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  it('should create some tymly services', (done) => {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/animal-blueprint')
        ],
        config: {}
      },
      (err, tymlyServices) => {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        client = tymlyServices.storage.client
        models = tymlyServices.storage.models
        done(err)
      }
    )
  })

  it('should insert a dog to animal-with-age', (done) => {
    models['tymlyTest_animalWithAge'].create({
      animal: 'dog',
      colour: 'brown'
    })
      .then(() => done())
      .catch(err => done(err))
  })

  it('should check the dog is brown', (done) => {
    models['tymlyTest_animalWithAge'].find({})
      .then(res => {
        expect(res[0].colour).to.eql('brown')
        done()
      })
      .catch(err => done(err))
  })

  it('should update the dog\'s colour to black', (done) => {
    models['tymlyTest_animalWithAge'].update({
      animal: 'dog',
      colour: 'black'
    }, {})
      .then(() => done())
      .catch(err => done(err))
  })

  it('should check the dog is black', (done) => {
    models['tymlyTest_animalWithAge'].find({})
      .then(res => {
        expect(res[0].colour).to.eql('black')
        done()
      })
      .catch(err => done(err))
  })

  it('should check the change has been documented in tymly.rewind', (done) => {
    models['tymly_rewind'].find({
      where: {
        modelName: {equals: 'tymly_test.animal_with_age'}
      }
    })
      .then(res => {
        expect(res.length).to.eql(1)
        expect(res[0].diff.colour.from).to.eql('brown')
        expect(res[0].diff.colour.to).to.eql('black')
        rewindIdToDestroy = res[0].id
        done()
      })
      .catch(err => done(err))
  })

  it('should insert a cat to animal-with-year', (done) => {
    models['tymlyTest_animalWithYear'].create({
      animal: 'cat',
      colour: 'ginger'
    })
      .then(() => done())
      .catch(err => done(err))
  })

  it('should check the cat is ginger', (done) => {
    models['tymlyTest_animalWithYear'].find({})
      .then(res => {
        expect(res[0].colour).to.eql('ginger')
        done()
      })
      .catch(err => done(err))
  })

  it('should update the cat update the cat\'s colour to white', (done) => {
    models['tymlyTest_animalWithYear'].update({
      animal: 'cat',
      colour: 'white'
    }, {})
      .then(() => done())
      .catch(err => done(err))
  })

  it('should check the cat is white', (done) => {
    models['tymlyTest_animalWithYear'].find({})
      .then(res => {
        expect(res[0].colour).to.eql('white')
        done()
      })
      .catch(err => done(err))
  })

  it('should check the change has NOT been documented in tymly.rewind', (done) => {
    models['tymly_rewind'].find({
      where: {
        modelName: {equals: 'tymly_test.animal_with_year'}
      }
    })
      .then(res => {
        expect(res.length).to.eql(0)
        done()
      })
      .catch(err => done(err))
  })

  it('should clean up animal-with-age', (done) => {
    models['tymlyTest_animalWithAge'].destroyById('dog')
      .then(() => done())
      .catch(err => done(err))
  })

  it('should clean up animal-with-year', (done) => {
    models['tymlyTest_animalWithYear'].destroyById('cat')
      .then(() => done())
      .catch(err => done(err))
  })

  it('should clean up rewind', (done) => {
    models['tymly_rewind'].destroyById(rewindIdToDestroy)
      .then(() => done())
      .catch(err => done(err))
  })

  it('Should uninstall test schemas', async () => {
    sqlScriptRunner.uninstall(client)
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
