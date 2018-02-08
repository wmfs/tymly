/* eslint-env mocha */

'use strict'

const expect = require('chai').expect
const tymly = require('tymly')
const path = require('path')

describe('Audit service tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, models, rewindIdToDestroy

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

  it('should check the dog', (done) => {
    models['tymlyTest_animalWithAge'].find({})
      .then(res => {
        expect(res[0].colour).to.eql('brown')
        done()
      })
      .catch(err => done(err))
  })

  it('should update the dog', (done) => {
    models['tymlyTest_animalWithAge'].update({
      animal: 'dog',
      colour: 'black'
    }, {})
      .then(() => done())
      .catch(err => done(err))
  })

  it('should check the dog', (done) => {
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
        expect(res[0].diff.colour.from).to.eql('brown')
        expect(res[0].diff.colour.to).to.eql('black')
        rewindIdToDestroy = res[0].id
        done()
      })
      .catch(err => done(err))
  })

  it('should clean up animal-with-age', (done) => {
    models['tymlyTest_animalWithAge'].destroyById('dog')
      .then(() => done())
      .catch(err => done(err))
  })

  it('should clean up rewind', (done) => {
    models['tymly_rewind'].destroyById(rewindIdToDestroy)
      .then(() => done())
      .catch(err => done(err))
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
