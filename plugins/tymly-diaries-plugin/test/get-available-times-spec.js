/* eslint-env mocha */

const tymly = require('tymly')
const path = require('path')
const expect = require('chai').expect

const GET_TIMES_STATE_MACHINE_NAME = 'test_getAvailableTimes'

const DATE_TIME = '2018-04-23'

const initialData = [
  {
    originId: 'test',
    diaryId: 'doctors',
    startDateTime: '2018-04-23T08:30:00',
    endDateTime: '2018-04-23T09:30:00',
    info: {},
    id: '6d7fdfe8-46d3-11e8-842f-0ed5f89f718b'
  },
  {
    originId: 'test',
    diaryId: 'doctors',
    startDateTime: '2018-04-23T09:30:00',
    endDateTime: '2018-04-23T10:30:00',
    info: {},
    id: '6d7fdb4c-46d3-11e8-842f-0ed5f89f718b'
  },
  {
    originId: 'test',
    diaryId: 'doctors',
    startDateTime: '2018-04-23T14:30:00',
    endDateTime: '2018-04-23T15:30:00',
    info: {},
    id: '6d7fde94-46d3-11e8-842f-0ed5f89f718b'
  }
] // booked: 8:30-9:30, 9:30-10:30, 14:30-15:30

const additionalData = [
  {
    originId: 'test',
    diaryId: 'doctors',
    startDateTime: '2018-04-23T08:30:00',
    endDateTime: '2018-04-23T09:30:00',
    info: {},
    id: '426b87a8-46f1-11e8-842f-0ed5f89f718b'
  },
  {
    originId: 'test',
    diaryId: 'doctors',
    startDateTime: '2018-04-23T08:30:00',
    endDateTime: '2018-04-23T09:30:00',
    info: {},
    id: 'b0250512-46f6-11e8-842f-0ed5f89f718b'
  },
  {
    originId: 'test',
    diaryId: 'doctors',
    startDateTime: '2018-04-23T10:30:00',
    endDateTime: '2018-04-23T11:30:00',
    info: {},
    id: '426b8be0-46f1-11e8-842f-0ed5f89f718b'
  },
  {
    originId: 'test',
    diaryId: 'doctors',
    startDateTime: '2018-04-23T20:30:00',
    endDateTime: '2018-04-23T21:30:00',
    info: {},
    id: '426b8e06-46f1-11e8-842f-0ed5f89f718b'
  }
]

describe('Test the get available times state resource', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, statebox, diaryService, entryModel

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

  it('should setup some test initialData in the entries model', done => {
    Object.values(initialData).map(datum => {
      entryModel.upsert(datum, {}, (err, doc) => {
        expect(err).to.eql(null)
        expect(doc).to.not.eql(undefined)
      })
    })
    done()
  })

  it('should start the get available times state machine', done => {
    statebox.startExecution(
      {
        date: DATE_TIME
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
        expect(executionDescription.ctx.availableTimes).to.eql(
          [['08:30:00', 1],
            ['09:30:00', 1],
            ['10:30:00', 0],
            ['11:30:00', 0],
            ['12:30:00', 0],
            ['13:30:00', 0],
            ['14:30:00', 1],
            ['15:30:00', 0],
            ['16:30:00', 0],
            ['17:30:00', 0],
            ['18:30:00', 0],
            ['19:30:00', 0],
            ['20:30:00', 0],
            ['21:30:00', 0]]
        )
        done()
      }
    )
  })

  it('should setup some test additionalData in the entries model to remove/change the availableTimes return', done => {
    Object.values(additionalData).map(datum => {
      entryModel.upsert(datum, {}, (err, doc) => {
        expect(err).to.eql(null)
        expect(doc).to.not.eql(undefined)
      })
    })
    done()
  })

  it('should start a second get available times state machine', done => {
    statebox.startExecution(
      {
        date: DATE_TIME
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
        expect(executionDescription.ctx.availableTimes).to.eql(
          [['09:30:00', 1],
            ['10:30:00', 1],
            ['11:30:00', 0],
            ['12:30:00', 0],
            ['13:30:00', 0],
            ['14:30:00', 1],
            ['15:30:00', 0],
            ['16:30:00', 0],
            ['17:30:00', 0],
            ['18:30:00', 0],
            ['19:30:00', 0],
            ['20:30:00', 1],
            ['21:30:00', 0]]
        )
        done()
      }
    )
  })

  it('should shutdown Tymly', async () => {
    await tymlyService.shutdown()
  })
})
