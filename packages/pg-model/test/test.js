/* eslint-env mocha */

'use strict'

const process = require('process')
const pgModel = require('./../lib')
const HlPgClient = require('hl-pg-client')
const empty = require('./fixtures/empty.json')
const planets = require('./fixtures/people-and-planets.json')
const pgDiffSync = require('pg-diff-sync')
const async = require('async')
const path = require('path')
const chai = require('chai')
const chaiSubset = require('chai-subset')
chai.use(chaiSubset)
const expect = chai.expect

describe('Callback API', function () {
  this.timeout(process.env.TIMEOUT || 5000)
  let client
  let models
  let phobosId
  let stickneyId

  before(function () {
    if (process.env.PG_CONNECTION_STRING && !/^postgres:\/\/[^:]+:[^@]+@(?:localhost|127\.0\.0\.1).*$/.test(process.env.PG_CONNECTION_STRING)) {
      console.log(`Skipping tests due to unsafe PG_CONNECTION_STRING value (${process.env.PG_CONNECTION_STRING})`)
      this.skip()
    }
  })

  describe('setup', () => {
    it('create a new pg client', function () {
      client = new HlPgClient(process.env.PG_CONNECTION_STRING)
    })

    it('initially drop-cascade the pg_model_test schema, if one exists', async () => {
      for (const filename of ['uninstall.sql', 'install.sql']) { await client.runFile(path.resolve(__dirname, path.join('fixtures', 'scripts', filename))) }
    })
    it('install test database objects', function (done) {
      async.eachSeries(
        pgDiffSync(
          empty,
          planets
        ),
        function (statement, cb) {
          client.query(
            statement,
            function (e) {
              if (e) {
                console.error(statement)
                cb(e)
              } else {
                cb()
              }
            }
          )
        },
        function (err) {
          expect(err).to.equal(null)
          done()
        }
      )
    })

    it('get some model instances', function () {
      models = pgModel(
        {
          client: client,
          dbStructure: planets
        }
      )
    })
  })

  describe('simple object', () => {
    describe('creation', () => {
      it('create a new person', function (done) {
        models.pgmodelTest.person.create(
          {
            employeeNo: 1,
            firstName: 'Homer',
            lastName: 'Simpson',
            age: 39
          },
          {},
          function (err, idProperties) {
            expect(err).to.equal(null)
            expect(idProperties).to.eql(
              {
                idProperties: {employeeNo: '1'}
              }
            )
            done()
          }
        )
      })

      it('create multiple new people', function (done) {
        models.pgmodelTest.person.create(
          [
            {
              employeeNo: 2,
              firstName: 'Maggie',
              lastName: 'Simpson'
            },
            {
              employeeNo: 3,
              firstName: 'Lisa',
              lastName: 'Simpson',
              age: 8
            },
            {
              employeeNo: 4,
              firstName: 'Marge',
              lastName: 'Simpson',
              age: 36
            },
            {
              employeeNo: 5,
              firstName: 'Bart',
              lastName: 'Simpson',
              age: 10
            }

          ],
          {},
          function (err) {
            expect(err).to.equal(null)
            done()
          }
        )
      })

      it('fail creating a new person with an already-used primary key', function (done) {
        models.pgmodelTest.person.create(
          {
            employeeNo: 1,
            firstName: 'Ned',
            lastName: 'Flanders',
            age: 60
          },
          {},
          function (err, doc) {
            expect(err).to.containSubset(
              {
                'code': '23505',
                'constraint': 'person_pkey',
                'detail': 'Key (employee_no)=(1) already exists.',
                'name': 'error',
                'schema': 'pgmodel_test',
                'severity': 'ERROR',
                'table': 'person'
              }
            )
            done()
          }
        )
      })

      it('fail creating new people with an already-used primary key', function (done) {
        models.pgmodelTest.person.create(
          [
            {
              employeeNo: 6,
              firstName: 'Ned',
              lastName: 'Flanders',
              age: 60
            },
            {
              employeeNo: 2,
              firstName: 'Maude',
              lastName: 'Flanders'
            }
          ],
          {},
          function (err, doc) {
            expect(err).to.containSubset(
              {
                'code': '23505',
                'constraint': 'person_pkey',
                'detail': 'Key (employee_no)=(2) already exists.',
                'name': 'error',
                'schema': 'pgmodel_test',
                'severity': 'ERROR',
                'table': 'person'
              }
            )
            done()
          }
        )
      })
    })

    describe('find', () => {
      it('find who is older than 36', function (done) {
        models.pgmodelTest.person.find(
          {
            where: {
              age: {moreThan: 36}
            }
          },
          function (err, doc) {
            expect(doc.length).to.eql(1)
            expect(doc[0].firstName).to.eql('Homer')
            done(err)
          }
        )
      })

      it('find who is older than or equal to 36', function (done) {
        models.pgmodelTest.person.find(
          {
            where: {
              age: {moreThanEquals: 36}
            }
          },
          function (err, doc) {
            expect(doc.length).to.eql(2)
            expect(doc[0].firstName).to.eql('Homer')
            expect(doc[1].firstName).to.eql('Marge')
            done(err)
          }
        )
      })

      it('find who is younger than 36', function (done) {
        models.pgmodelTest.person.find(
          {
            where: {
              age: {lessThan: 36}
            }
          },
          function (err, doc) {
            expect(doc.length).to.eql(2)
            expect(doc[0].firstName).to.eql('Lisa')
            expect(doc[1].firstName).to.eql('Bart')
            done(err)
          }
        )
      })

      it('find who is younger than or equal to 36', function (done) {
        models.pgmodelTest.person.find(
          {
            where: {
              age: {lessThanEquals: 36}
            }
          },
          function (err, doc) {
            expect(doc.length).to.eql(3)
            expect(doc[0].firstName).to.eql('Lisa')
            expect(doc[1].firstName).to.eql('Marge')
            expect(doc[2].firstName).to.eql('Bart')
            done(err)
          }
        )
      })

      it('find who\'s name contains \'Mar\'', function (done) {
        models.pgmodelTest.person.find(
          {
            where: {
              firstName: {like: 'Mar'}
            }
          },
          function (err, doc) {
            expect(doc.length).to.eql(1)
            expect(doc[0].firstName).to.eql('Marge')
            done(err)
          }
        )
      })
    })

    describe('find by id', () => {
      it('find a person via primary key', function (done) {
        models.pgmodelTest.person.findById(
          3,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'employeeNo': '3',
                'firstName': 'Lisa',
                'lastName': 'Simpson',
                'age': 8
              }
            )
            done()
          }
        )
      })

      it('fail finding a person that\'s not there', function (done) {
        models.pgmodelTest.person.findById(
          6,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.equal(undefined)
            done()
          }
        )
      })
    })

    describe('find with ordering', () => {
      it('find 5 people, youngest first', function (done) {
        models.pgmodelTest.person.find(
          {
            orderBy: ['age']
          },
          function (err, doc) {
            expect(err).to.equal(null)

            expect(doc[0].age).to.equal(8)
            expect(doc[1].age).to.equal(10)
            expect(doc[2].age).to.equal(36)
            expect(doc[3].age).to.equal(39)
            expect(doc[4].age).to.equal(null)
            expect(doc).to.containSubset(
              [
                {
                  'age': 8,
                  'employeeNo': '3',
                  'firstName': 'Lisa',
                  'lastName': 'Simpson'
                },
                {
                  'age': 10,
                  'employeeNo': '5',
                  'firstName': 'Bart',
                  'lastName': 'Simpson'
                },
                {
                  'age': 36,
                  'employeeNo': '4',
                  'firstName': 'Marge',
                  'lastName': 'Simpson'
                },
                {
                  'age': 39,
                  'employeeNo': '1',
                  'firstName': 'Homer',
                  'lastName': 'Simpson'
                },
                {
                  'age': null,
                  'employeeNo': '2',
                  'firstName': 'Maggie',
                  'lastName': 'Simpson'
                }
              ]
            )
            done()
          }
        )
      })

      it('find 3 people, eldest first', function (done) {
        models.pgmodelTest.person.find(
          {
            orderBy: ['-age'],
            nullsLast: true
          },
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc[0].age).to.equal(39)
            expect(doc[1].age).to.equal(36)
            expect(doc[2].age).to.equal(10)
            expect(doc[3].age).to.equal(8)
            expect(doc[4].age).to.equal(null)
            done()
          }
        )
      })
    })

    describe('more complex finds', () => {
      it('find Bart by name', function (done) {
        models.pgmodelTest.person.find(
          {
            where: {
              firstName: {equals: 'Bart'},
              lastName: {equals: 'Simpson'}
            }
          },
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.have.length(1)
            expect(doc).to.containSubset(
              [
                {
                  'age': 10,
                  'employeeNo': '5',
                  'firstName': 'Bart',
                  'lastName': 'Simpson'
                }
              ]
            )

            done()
          }
        )
      })

      it('find Bart and Lisa (eldest with limit 2/offset 2)', function (done) {
        models.pgmodelTest.person.find(
          {
            orderBy: ['-age'],
            nullsLast: true,
            limit: 2,
            offset: 2
          },
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.have.length(2)
            expect(doc[0].employeeNo).to.eql('5')
            expect(doc[1].employeeNo).to.eql('3')
            expect(doc).to.containSubset(
              [
                {
                  'age': 10,
                  'employeeNo': '5',
                  'firstName': 'Bart',
                  'lastName': 'Simpson'
                },
                {
                  'age': 8,
                  'employeeNo': '3',
                  'firstName': 'Lisa',
                  'lastName': 'Simpson'
                }
              ]
            )
            done()
          }
        )
      })
    })

    describe('find one', () => {
      it('get the second youngest known person (Marge)', function (done) {
        models.pgmodelTest.person.findOne(
          {
            orderBy: ['age'],
            nullsLast: true,
            offset: 1
          },
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'age': 10,
                'employeeNo': '5',
                'firstName': 'Bart',
                'lastName': 'Simpson'
              }
            )

            done()
          }
        )
      })

      it('get one Homer by name', function (done) {
        models.pgmodelTest.person.findOne(
          {
            where: {
              firstName: {equals: 'Homer'},
              lastName: {equals: 'Simpson'}
            }
          },
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'age': 39,
                'employeeNo': '1',
                'firstName': 'Homer',
                'lastName': 'Simpson'
              }
            )

            done()
          }
        )
      })

      it('shouldn\'t get one missing person', function (done) {
        models.pgmodelTest.person.findOne(
          {
            where: {
              firstName: {equals: 'Ned'},
              lastName: {equals: 'Flanders'}
            }
          },
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.equal(undefined)
            done()
          }
        )
      })
    })

    describe('update', () => {
      it('update Maggie\'s age to 1', function (done) {
        models.pgmodelTest.person.update(
          {
            employeeNo: 2,
            age: 1,
            firstName: 'Maggie',
            lastName: 'Simpson'
          },
          {},
          function (err) {
            expect(err).to.equal(null)
            done()
          }
        )
      })

      it('find Maggie has an age now', function (done) {
        models.pgmodelTest.person.findById(
          2,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'employeeNo': '2',
                'firstName': 'Maggie',
                'lastName': 'Simpson',
                'age': 1
              }
            )
            done()
          }
        )
      })

      it('update Maggie again, but this time without an age', function (done) {
        models.pgmodelTest.person.update(
          {
            employeeNo: 2,
            firstName: 'Maggie',
            lastName: 'Simpson'
          },
          {},
          function (err, doc) {
            expect(err).to.equal(null)
            done()
          }
        )
      })

      it('find Maggie\'s age has gone again', function (done) {
        models.pgmodelTest.person.findById(
          2,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'employeeNo': '2',
                'firstName': 'Maggie',
                'lastName': 'Simpson',
                'age': null
              }
            )
            done()
          }
        )
      })

      it('patch Maggie to Margaret', function (done) {
        models.pgmodelTest.person.patch(
          {
            employeeNo: 2,
            firstName: 'Margaret'
          },
          {},
          function (err, doc) {
            expect(err).to.equal(null)
            done()
          }
        )
      })

      it('find Maggie is now a Margaret', function (done) {
        models.pgmodelTest.person.findById(
          2,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'employeeNo': '2',
                'firstName': 'Margaret',
                'lastName': 'Simpson',
                'age': null
              }
            )
            done()
          }
        )
      })
    })

    describe('destroy', () => {
      it('delete Maggie/Margaret by via her id', function (done) {
        models.pgmodelTest.person.destroyById(
          2,
          function (err, doc) {
            expect(err).to.equal(null)
            done()
          }
        )
      })

      it('fail getting a deleted record', function (done) {
        models.pgmodelTest.person.findById(
          2,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.equal(undefined)
            done()
          }
        )
      })
    })

    describe('upsert', () => {
      it('upsert (insert) Grampa', function (done) {
        models.pgmodelTest.person.upsert(
          {
            employeeNo: 10,
            firstName: 'Abe',
            lastName: 'Simpson',
            age: 82
          },
          {},
          function (err, idProperties) {
            expect(idProperties).to.eql(
              {
                idProperties: {
                  employeeNo: '10'
                }
              }
            )
            expect(err).to.equal(null)
            done()
          }
        )
      })

      it('find Grampa has been inserted via upsert', function (done) {
        models.pgmodelTest.person.findById(
          10,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'employeeNo': '10',
                'firstName': 'Abe',
                'lastName': 'Simpson',
                'age': 82
              }
            )
            done()
          }
        )
      })

      it('upsert (update) Grampa', function (done) {
        models.pgmodelTest.person.upsert(
          {
            employeeNo: 10,
            firstName: 'Abraham',
            lastName: 'Simpson',
            age: 83
          },
          {},
          function (err, doc) {
            expect(err).to.equal(null)
            done()
          }
        )
      })

      it('find Grampa has now been updates via upsert', function (done) {
        models.pgmodelTest.person.findById(
          10,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'employeeNo': '10',
                'firstName': 'Abraham',
                'lastName': 'Simpson',
                'age': 83
              }
            )
            done()
          }
        )
      })

      it('now upsert (update) Grampa, resetting his name', function (done) {
        models.pgmodelTest.person.upsert(
          {
            employeeNo: 10,
            firstName: 'Abe',
            lastName: 'Simpson'
          },
          {
            setMissingPropertiesToNull: false
          },
          function (err, doc) {
            expect(err).to.equal(null)
            done()
          }
        )
      })

      it('find Grampa again, with his age preserved and an updated name', function (done) {
        models.pgmodelTest.person.findById(
          10,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'employeeNo': '10',
                'firstName': 'Abe',
                'lastName': 'Simpson',
                'age': 83
              }
            )
            done()
          }
        )
      })

      it('upsert (update) Grampa again, but turn age to null', function (done) {
        models.pgmodelTest.person.upsert(
          {
            employeeNo: 10,
            firstName: 'Abraham',
            lastName: 'Simpson'
          },
          {},
          function (err, doc) {
            expect(err).to.equal(null)
            done()
          }
        )
      })

      it('find Grampa again, but now with a null age', function (done) {
        models.pgmodelTest.person.findById(
          10,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'employeeNo': '10',
                'firstName': 'Abraham',
                'lastName': 'Simpson',
                'age': null
              }
            )
            done()
          }
        )
      })
    })
  })

  describe('complex object with children', () => {
    describe('create parent and children', () => {
      it('create mars, with two moons and a few craters', function (done) {
        models.pgmodelTest.planets.create(
          {
            name: 'mars',
            title: 'Mars',
            type: 'Terrestrial',
            diameter: 6700,
            color: 'red',
            url: 'http://en.wikipedia.org/wiki/Mars',
            otherFacts: {
              radius: 3390,
              surfacePressure: '0.636 (0.4–0.87) kPa; 0.00628 atm',
              equatorialRotationVelocity: '868.22 km/h (241.17 m/s)'
            },
            moons: [
              {
                title: 'Phobos',
                discoveredBy: 'Asaph Hall',
                discoveryYear: 1800,
                craters: [
                  {
                    title: 'Stickney',
                    diameter: 9
                  }
                ]
              },
              {
                title: 'Deimos',
                discoveredBy: 'Asaph Hall',
                discoveryYear: 1800
              }
            ]
          },
          {},
          function (err, idProperties) {
            expect(err).to.equal(null)
            expect(idProperties).to.eql(
              {
                idProperties: {
                  name: 'mars'
                }
              }
            )
            done()
          }
        )
      })
    })

    describe('find', () => {
      it('find Mars via primary key', function (done) {
        models.pgmodelTest.planets.findById(
          'mars',
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'name': 'mars',
                'title': 'Mars',
                'type': 'Terrestrial',
                'diameter': '6700',
                'color': 'red',
                'url': 'http://en.wikipedia.org/wiki/Mars',
                'otherFacts': {
                  'radius': 3390,
                  'surfacePressure': '0.636 (0.4–0.87) kPa; 0.00628 atm',
                  'equatorialRotationVelocity': '868.22 km/h (241.17 m/s)'
                },
                'moons': [
                  {
                    'title': 'Phobos',
                    'discoveredBy': 'Asaph Hall',
                    'discoveryYear': 1800,
                    'planetsName': 'mars',
                    'craters': [
                      {
                        'title': 'Stickney',
                        'diameter': 9
                      }
                    ]
                  },
                  {
                    'title': 'Deimos',
                    'discoveredBy': 'Asaph Hall',
                    'discoveryYear': 1800,
                    'planetsName': 'mars'
                  }
                ]
              }
            )

            const moons = {}
            moons[doc.moons[0].title] = doc.moons[0]
            moons[doc.moons[1].title] = doc.moons[1]
            phobosId = moons['Phobos'].id
            stickneyId = moons['Phobos'].craters[0].id
            done()
          }
        )
      })

      it('find Phobos and its Stickney crater', function (done) {
        models.pgmodelTest.moons.findOne(
          {
            where: {
              title: {'equals': 'Phobos'}
            }
          },
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'title': 'Phobos',
                'discoveredBy': 'Asaph Hall',
                'discoveryYear': 1800,
                'planetsName': 'mars',
                'craters': [
                  {
                    'title': 'Stickney',
                    'diameter': 9
                  }
                ]
              }
            )
            done()
          }
        )
      })

      it('find Deimos and no craters', function (done) {
        models.pgmodelTest.moons.findOne(
          {
            where: {
              title: {'equals': 'Deimos'}
            }
          },
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'title': 'Deimos',
                'discoveredBy': 'Asaph Hall',
                'discoveryYear': 1800,
                'planetsName': 'mars',
                'craters': []
              }
            )
            done()
          }
        )
      })
    })

    describe('update', () => {
      it('update Mars with more accurate info', function (done) {
        models.pgmodelTest.planets.update(
          {
            name: 'mars',
            title: 'Mars',
            type: 'Terrestrial',
            diameter: 6779,
            color: 'red',
            url: 'http://en.wikipedia.org/wiki/Mars',
            'otherFacts': {
              'radius': 3390,
              'surfacePressure': '0.636 (0.4–0.87) kPa; 0.00628 atm',
              'equatorialRotationVelocity': '868.22 km/h (241.17 m/s)',
              'lengthOfDay': '1d 0h 40m'
            },
            moons: [
              {
                id: phobosId,
                title: 'Phobos',
                discoveredBy: 'Asaph Hall',
                discoveryYear: 1875,
                craters: [
                  {
                    id: stickneyId,
                    title: 'Stickney',
                    diameter: 10
                  }
                ]
              }
            ]
          },
          {},
          function (err, doc) {
            expect(err).to.equal(null)
            done()
          }
        )
      })

      it('find updated Mars via primary key', function (done) {
        models.pgmodelTest.planets.findById(
          'mars',
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc.moons).to.have.length(1)
            expect(doc).to.containSubset(
              {
                'name': 'mars',
                'title': 'Mars',
                'type': 'Terrestrial',
                'diameter': '6779',
                'color': 'red',
                'url': 'http://en.wikipedia.org/wiki/Mars',
                'otherFacts': {
                  'radius': 3390,
                  'surfacePressure': '0.636 (0.4–0.87) kPa; 0.00628 atm',
                  'equatorialRotationVelocity': '868.22 km/h (241.17 m/s)',
                  'lengthOfDay': '1d 0h 40m'
                },
                'moons': [
                  {
                    id: phobosId,
                    'title': 'Phobos',
                    'discoveredBy': 'Asaph Hall',
                    'discoveryYear': 1875,
                    'planetsName': 'mars',
                    'craters': [
                      {
                        id: stickneyId,
                        'title': 'Stickney',
                        'diameter': 10
                      }
                    ]
                  }
                ]
              }
            )
            done()
          }
        )
      })

      it('find Stickney crater directly', function (done) {
        models.pgmodelTest.craters.findById(
          stickneyId,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.containSubset(
              {
                'diameter': 10,
                'id': stickneyId,
                'moonsId': phobosId,
                'title': 'Stickney'
              }
            )
            done()
          }
        )
      })
    })

    describe('destroy', () => {
      it('delete Mars, and in-turn Phobos and Stickney', function (done) {
        models.pgmodelTest.planets.destroyById(
          'mars',
          function (err, doc) {
            expect(err).to.equal(null)
            done()
          }
        )
      })

      it('now fail to find Phobos', function (done) {
        models.pgmodelTest.moons.findOne(
          {
            filter: {
              where: {
                title: {'equals': 'Phobos'}
              }
            }
          },
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.equal(undefined)
            done()
          }
        )
      })

      it('now fail to find Stickney crater directly', function (done) {
        models.pgmodelTest.craters.findById(
          stickneyId,
          function (err, doc) {
            expect(err).to.equal(null)
            expect(doc).to.equal(undefined)
            done()
          }
        )
      })
    })
  })

  describe('cleanup', () => {
    it('finally drop-cascade the pg_model_test schema', async () => {
      await client.runFile(path.resolve(__dirname, path.join('fixtures', 'scripts', 'uninstall.sql')))
    })

    it('close database connections', function (done) {
      client.end()
      done()
    })
  })
})
