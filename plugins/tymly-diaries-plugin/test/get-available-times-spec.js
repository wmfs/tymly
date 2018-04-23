/* eslint-env mocha */

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect
const moment = require('moment')

const GET_TIMES_STATE_MACHINE_NAME = 'test_getAvailableTimes'
const CREATE_ENTRY_STATE_MACHINE_NAME = 'test_createDiaryEntry'
const CANCEL_ENTRY_STATE_MACHINE_NAME = 'test_cancelDiaryEntry'

const DATE = '2018-04-23T07:11:04.915Z'
const DURATION = 60

describe('Test the get available times state resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, statebox, diaryService, entryId, entryModel

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  it('should run the tymly service', done => {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './..')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/test-blueprint')
        ]
      },
      (err, tymlyServices) => {
        expect(err).to.eql(null)
        tymlyService = tymlyServices.tymly
        statebox = tymlyServices.statebox
        diaryService = tymlyServices.diaries
        entryModel = tymlyServices.storage.models['tymly_diaryEntry']
        done()
      }
    )
  })

  it('should check the diary has been picked up in the diary service via the blueprint', () => {
    expect(Object.keys(diaryService.diaries).includes('test_doctors')).to.eql(true)
  })

  it('should start the get available times state machine', done => {
    statebox.startExecution(
      {
        date: DATE
      },
      GET_TIMES_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (err) return done(err)
        expect(executionDescription.currentStateName).to.eql('GetAvailableTimes')
        expect(executionDescription.currentResource).to.eql('module:getAvailableDiarySlots')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should start the get available times state machine', done => {
    statebox.startExecution(
      {
        startDateTime: DATE
      },
      CREATE_ENTRY_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (err) return done(err)
        expect(executionDescription.currentStateName).to.eql('CreateEntry')
        expect(executionDescription.currentResource).to.eql('module:createDiaryEntry')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        entryId = executionDescription.ctx.idProperties.id
        done()
      }
    )
  })

  it('should check the upserted record', async () => {
    const doc = await entryModel.findById(entryId)
    expect(doc.diaryId).to.eql('doctors')
    expect(doc.originId).to.eql(CREATE_ENTRY_STATE_MACHINE_NAME)
    expect(doc.startDateTime).to.eql(DATE)
    expect(doc.endDateTime).to.eql(moment(doc.startDateTime).add(DURATION, 'minutes').format())
  })

  it('should start the cancel-diary-entry state machine', done => {
    statebox.startExecution(
      {
        id: entryId
      },
      CANCEL_ENTRY_STATE_MACHINE_NAME,
      {
        sendResponse: 'COMPLETE'
      },
      (err, executionDescription) => {
        if (err) return done(err)
        console.log(JSON.stringify(executionDescription, null, 2))
        expect(executionDescription.currentStateName).to.eql('CancelEntry')
        expect(executionDescription.currentResource).to.eql('module:cancelDiaryEntry')
        expect(executionDescription.status).to.eql('SUCCEEDED')
        done()
      }
    )
  })

  it('should fail to find deleted record', async () => {
    const doc = await entryModel.findById(entryId)
    expect(doc).to.eql(undefined)
    // expect(doc.endDateTime).to.eql()
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
