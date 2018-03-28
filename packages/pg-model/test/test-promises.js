/* eslint-env mocha */

const process = require('process')
const pgModel = require('./../lib')
const HlPgClient = require('hl-pg-client')
const empty = require('./fixtures/empty.json')
const planets = require('./fixtures/people-and-planets.json')
const pgDiffSync = require('pg-diff-sync')
const chai = require('chai')
const path = require('path')
const chaiSubset = require('chai-subset')
chai.use(chaiSubset)
const expect = chai.expect
const assert = require('assert')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

describe('Promise API', function () {
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
    it('create a new pg client', () => {
      client = new HlPgClient(process.env.PG_CONNECTION_STRING)
    })

    it('initially drop-cascade the pg_model_test schema, if one exists', async () => {
      for (const filename of ['uninstall.sql', 'install.sql']) {
        await client.runFile(path.resolve(__dirname, path.join('fixtures', 'scripts', filename)))
      }
    })

    it('install test database objects', async () => {
      const statements = pgDiffSync(empty, planets)
      for (const s of statements) {
        await client.query(s)
      }
    })

    it('get some model instances', () => {
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
      it('create a new person', async () => {
        const idProperties = await models.pgmodelTest.person.create(
          {
            employeeNo: 1,
            firstName: 'Homer',
            lastName: 'Simpson',
            age: 39
          },
          {}
        )

        expect(idProperties).to.eql({
          idProperties: {
            employeeNo: '1'
          }
        })
      })

      it('create multiple new people', async () => {
        await models.pgmodelTest.person.create(
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
          ]
        )
      })

      it('fail creating a new person with an already-used primary key', async () => {
        try {
          await models.pgmodelTest.person.create({
            employeeNo: 1,
            firstName: 'Ned',
            lastName: 'Flanders',
            age: 60
          },
          {}
          )
        } catch (err) {
          expect(err).to.containSubset({
            'code': '23505',
            'constraint': 'person_pkey',
            'detail': 'Key (employee_no)=(1) already exists.',
            'name': 'error',
            'schema': 'pgmodel_test',
            'severity': 'ERROR',
            'table': 'person'
          })
          return
        }

        // didn't throw :o
        assert(false)
      })

      it('fail creating new people with an already-used primary key', async () => {
        try {
          await models.pgmodelTest.person.create(
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
            {}
          )
        } catch (err) {
          expect(err).to.containSubset({
            'code': '23505',
            'constraint': 'person_pkey',
            'detail': 'Key (employee_no)=(2) already exists.',
            'name': 'error',
            'schema': 'pgmodel_test',
            'severity': 'ERROR',
            'table': 'person'
          })
          return
        } // catch

        // didn't throw!
        assert(false)
      })

      it('fail creating new peep - views are read-only', async () => {
        try {
          await models.pgmodelTest.peeps.create({
            employeeNo: 1,
            name: 'Ned Flanders'
          },
          {}
          )
        } catch (err) {
          expect(err).to.containSubset({
            'schema': 'pgmodel_test',
            'view': 'peeps'
          })
          return
        }

        // didn't throw :o
        assert(false)
      })
    })

    describe('find by id', () => {
      it('find a person via primary key', () => {
        return models.pgmodelTest.person.findById(3)
          .then(doc =>
            expect(doc).to.containSubset(
              {
                'employeeNo': '3',
                'firstName': 'Lisa',
                'lastName': 'Simpson',
                'age': 8
              }
            )
          )
      })

      it('can\'t find a peep via primary key', async () => {
        try {
          await models.pgmodelTest.peeps.findById(3)
        } catch (err) {
          expect(err).to.containSubset({
            'schema': 'pgmodel_test',
            'view': 'peeps'
          })
          return
        }

        // didn't throw :o
        assert(false)
      })

      it("fail finding a person that's not there", () => {
        return models.pgmodelTest.person.findById(6)
          .then(doc =>
            expect(doc).to.equal(undefined)
          )
      })
    })

    describe('find with ordering', () => {
      it('find 5 people, youngest first', async () => {
        const doc = await models.pgmodelTest.person.find(
          {
            orderBy: ['age']
          }
        )

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
      })

      it('find 3 people, eldest first', async () => {
        const doc = await models.pgmodelTest.person.find(
          {
            orderBy: ['-age'],
            nullsLast: true
          }
        )

        expect(doc).to.have.length(5)
        expect(doc[0].age).to.equal(39)
        expect(doc[1].age).to.equal(36)
        expect(doc[2].age).to.equal(10)
        expect(doc[3].age).to.equal(8)
        expect(doc[4].age).to.equal(null)
      })
    })

    describe('more complex finds', () => {
      it('find Bart by first name & last name', async () => {
        const doc = await models.pgmodelTest.person.find(
          {
            where: {
              firstName: {equals: 'Bart'},
              lastName: {equals: 'Simpson'}
            }
          }
        )

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
      })

      it('find Bart by name', async () => {
        const doc = await models.pgmodelTest.peeps.find(
          {
            where: {
              name: {equals: 'Bart Simpson'}
            }
          }
        )

        expect(doc).to.have.length(1)
        expect(doc).to.containSubset(
          [
            {
              'employeeNo': '5',
              'name': 'Bart Simpson'
            }
          ]
        )
      })

      it('find Bart and Lisa (eldest with limit 2/offset 2)', async () => {
        const doc = await models.pgmodelTest.person.find(
          {
            orderBy: ['-age'],
            nullsLast: true,
            limit: 2,
            offset: 2
          }
        )

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
      })
    })

    describe('find one', () => {
      it('get the second youngest known person (Marge)', async () => {
        const doc = await models.pgmodelTest.person.findOne(
          {
            orderBy: ['age'],
            nullsLast: true,
            offset: 1
          }
        )

        expect(doc).to.containSubset(
          {
            'age': 10,
            'employeeNo': '5',
            'firstName': 'Bart',
            'lastName': 'Simpson'
          }
        )
      })

      it('get one Homer by first name and last name', () => {
        return models.pgmodelTest.person.findOne(
          {
            where: {
              firstName: {equals: 'Homer'},
              lastName: {equals: 'Simpson'}
            }
          }
        ).then(doc =>
          expect(doc).to.containSubset(
            {
              'age': 39,
              'employeeNo': '1',
              'firstName': 'Homer',
              'lastName': 'Simpson'
            }
          )
        )
      })

      it('get one Homer by name', async () => {
        const doc = await models.pgmodelTest.peeps.findOne(
          {
            where: {
              name: {equals: 'Homer Simpson'}
            }
          }
        )
        expect(doc).to.containSubset({
          'employeeNo': '1',
          'name': 'Homer Simpson'
        })
      })

      it("shouldn't get one missing person", async () => {
        const doc = await models.pgmodelTest.person.findOne(
          {
            where: {
              firstName: {equals: 'Ned'},
              lastName: {equals: 'Flanders'}
            }
          }
        )

        expect(doc).to.equal(undefined)
      })

      it("shouldn't get one missing peep", async () => {
        const doc = await models.pgmodelTest.peep.findOne(
          {
            where: {
              name: {equals: 'Ned Flanders'}
            }
          }
        )

        expect(doc).to.equal(undefined)
      })
    })

    describe('update', () => {
      it("update Maggie's age to 1", () => {
        return models.pgmodelTest.person.update(
          {
            employeeNo: 2,
            age: 1,
            firstName: 'Maggie',
            lastName: 'Simpson'
          },
          {}
        )
      })

      it('find Maggie has an age now', () => {
        models.pgmodelTest.person.findById(2)
          .then(doc =>
            expect(doc).to.containSubset(
              {
                'employeeNo': '2',
                'firstName': 'Maggie',
                'lastName': 'Simpson',
                'age': 1
              }
            )
          )
      })

      it('update Maggie again, but this time without an age', async () => {
        await models.pgmodelTest.person.update(
          {
            employeeNo: 2,
            firstName: 'Maggie',
            lastName: 'Simpson'
          },
          {}
        )
      })

      it("find Maggie's age has gone again", async () => {
        const doc = await models.pgmodelTest.person.findById(2)

        expect(doc).to.containSubset({
          'employeeNo': '2',
          'firstName': 'Maggie',
          'lastName': 'Simpson',
          'age': null
        })
      })

      it('patch Maggie to Margaret', async () => {
        await models.pgmodelTest.person.patch(
          {
            employeeNo: 2,
            firstName: 'Margaret'
          },
          {}
        )
      })

      it('find Maggie is now a Margaret', async () => {
        const doc = await models.pgmodelTest.person.findById(2)

        expect(doc).to.containSubset({
          'employeeNo': '2',
          'firstName': 'Margaret',
          'lastName': 'Simpson',
          'age': null
        })
      })

      it('fail to update Maggie through view', async () => {
        try {
          await models.pgmodelTest.peeps.update({
            employeeNo: 2,
            name: 'Magritte Simpson'
          },
          {}
          )
        } catch (err) {
          expect(err).to.containSubset({
            'schema': 'pgmodel_test',
            'view': 'peeps'
          })
          return
        }

        // didn't throw :o
        assert(false)
      })
    })

    describe('destroy', () => {
      it('delete Maggie/Margaret by via her id', () => {
        return models.pgmodelTest.person.destroyById(2)
      })

      it('fail getting a deleted record', async () => {
        const doc = await models.pgmodelTest.person.findById(2)

        expect(doc).to.equal(undefined)
      })

      it('fail to delete Bart through view', async () => {
        try {
          await models.pgmodelTest.peeps.destroyById(3)
        } catch (err) {
          expect(err).to.containSubset({
            'schema': 'pgmodel_test',
            'view': 'peeps'
          })
          return
        }

        // didn't throw :o
        assert(false)
      })
    })

    describe('upsert', () => {
      it('upsert (insert) Grampa', async () => {
        const idProperties = await models.pgmodelTest.person.upsert(
          {
            employeeNo: 10,
            firstName: 'Abe',
            lastName: 'Simpson',
            age: 82
          },
          {}
        )

        expect(idProperties).to.eql({
          idProperties: { employeeNo: '10' }
        })
      })

      it('find Grampa has been inserted via upsert', async () => {
        const doc = await models.pgmodelTest.person.findById(10)

        expect(doc).to.containSubset({
          'employeeNo': '10',
          'firstName': 'Abe',
          'lastName': 'Simpson',
          'age': 82
        })
      })

      it('upsert (update) Grampa', () => {
        return models.pgmodelTest.person.upsert(
          {
            employeeNo: 10,
            firstName: 'Abraham',
            lastName: 'Simpson',
            age: 83
          },
          {}
        )
      })

      it('find Grampa has now been updates via upsert', async () => {
        const doc = await models.pgmodelTest.person.findById(10)

        expect(doc).to.containSubset({
          'employeeNo': '10',
          'firstName': 'Abraham',
          'lastName': 'Simpson',
          'age': 83
        })
      })

      it('now upsert (update) Grampa, resetting his name', () => {
        return models.pgmodelTest.person.upsert(
          {
            employeeNo: 10,
            firstName: 'Abe',
            lastName: 'Simpson'
          },
          {
            setMissingPropertiesToNull: false
          }
        )
      })

      it('find Grampa again, with his age preserved and an updated name', async () => {
        const doc = await models.pgmodelTest.person.findById(10)

        expect(doc).to.containSubset({
          'employeeNo': '10',
          'firstName': 'Abe',
          'lastName': 'Simpson',
          'age': 83
        })
      })

      it('upsert (update) Grampa again, but turn age to null', () => {
        return models.pgmodelTest.person.upsert(
          {
            employeeNo: 10,
            firstName: 'Abraham',
            lastName: 'Simpson'
          },
          {}
        )
      })

      it('find Grampa again, but now with a null age', async () => {
        const doc = await models.pgmodelTest.person.findById(10)

        expect(doc).to.containSubset({
          'employeeNo': '10',
          'firstName': 'Abraham',
          'lastName': 'Simpson',
          'age': null
        })
      })

      it('fail to upsert Maggie through view', async () => {
        try {
          await models.pgmodelTest.peeps.upsert({
            employeeNo: 2,
            name: 'Magritte Simpson'
          },
          {}
          )
        } catch (err) {
          expect(err).to.containSubset({
            'schema': 'pgmodel_test',
            'view': 'peeps'
          })
          return
        }

        // didn't throw :o
        assert(false)
      })
    })
  })

  describe('complex object with children', () => {
    describe('create parent and children', () => {
      it('create mars, with two moons and a few craters', async () => {
        const idProperties = await models.pgmodelTest.planets.create(
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
          {}
        )

        expect(idProperties).to.eql({
          idProperties: {
            name: 'mars'
          }
        })
      })
    })

    describe('find', () => {
      it('find Mars via primary key', async () => {
        const doc = await models.pgmodelTest.planets.findById('mars')

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
      })

      it('find Phobos and its Stickney crater', async () => {
        const doc = await models.pgmodelTest.moons.findOne(
          {
            where: {
              title: {'equals': 'Phobos'}
            }
          }
        )

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
      })

      it('find Deimos and no craters', async () => {
        const doc = await models.pgmodelTest.moons.findOne(
          {
            where: {
              title: {'equals': 'Deimos'}
            }
          }
        )

        expect(doc).to.containSubset(
          {
            'title': 'Deimos',
            'discoveredBy': 'Asaph Hall',
            'discoveryYear': 1800,
            'planetsName': 'mars',
            'craters': []
          }
        )
      })
    })

    describe('update', () => {
      it('update Mars with more accurate info', () => {
        return models.pgmodelTest.planets.update(
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
          {}
        )
      })

      it('find updated Mars via primary key', async () => {
        const doc = await models.pgmodelTest.planets.findById('mars')

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
      })

      it('find Stickney crater directly', async () => {
        const doc = await models.pgmodelTest.craters.findById(stickneyId)

        expect(doc).to.containSubset({
          'diameter': 10,
          'id': stickneyId,
          'moonsId': phobosId,
          'title': 'Stickney'
        })
      })
    })

    describe('destroy', () => {
      it('delete Mars, and in-turn Phobos and Stickney', () => {
        return models.pgmodelTest.planets.destroyById('mars')
      })

      it('now fail to find Phobos', async () => {
        const doc = await models.pgmodelTest.moons.findOne({
          filter: {
            where: {
              title: {'equals': 'Phobos'}
            }
          }
        })

        expect(doc).to.equal(undefined)
      })

      it('now fail to find Stickney crater directly', async () => {
        const doc = await models.pgmodelTest.craters.findById(stickneyId)

        expect(doc).to.equal(undefined)
      })
    })
  })

  describe('cleanup', () => {
    it('finally drop-cascade the pg_model_test schema', async () => {
      await client.runFile(path.resolve(__dirname, path.join('fixtures', 'scripts', 'uninstall.sql')))
    })

    it('close database connections', async () => {
      await client.end()
    })
  })
})
