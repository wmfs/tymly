/* eslint-env mocha */

'use strict'

const chai = require('chai')
const chaiSubset = require('chai-subset')
chai.use(chaiSubset)
const expect = chai.expect
const MemoryModel = require('../lib/plugin/components/services/storage/Memory-model')

describe('Run some basic tests', function () {
  let planetsModel
  let personModel
  let phobosId
  let stickneyId

  it('should get some model instances', function () {
    planetsModel = new MemoryModel(
      {
        'id': 'planets',
        'name': 'planets',
        'namespace': 'test',
        'primaryKey': ['name'],
        'properties': {
          'name': 'string'
        }
      }
    )
    personModel = new MemoryModel(
      {
        'id': 'people',
        'name': 'people',
        'namespace': 'test',
        'primaryKey': ['employeeNo'],
        'properties': {
          'employeeNo': 'number'
        }
      }
    )
  })

  it('should create a new person', function (done) {
    personModel.create(
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
            idProperties:
            {
              employeeNo: 1
            }
          }
        )
        done()
      }
    )
  })

  it('should create multiple new people', function (done) {
    personModel.create(
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

  it('should fail creating a new person with an already-used primary key', function (done) {
    personModel.create(
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
            'name': 'DuplicatePrimaryKey'
          }
        )
        done()
      }
    )
  })

  it('should fail creating new people with an already-used primary key', function (done) {
    personModel.create(
      [
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
            'name': 'DuplicatePrimaryKey'
          }
        )
        done()
      }
    )
  })

  it('should find a person via primary key', function (done) {
    personModel.findById(
      3,
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.containSubset(
          {
            'employeeNo': 3,
            'firstName': 'Lisa',
            'lastName': 'Simpson',
            'age': 8
          }
        )
        done()
      }
    )
  })

  it("should fail finding a person that's not there", function (done) {
    personModel.findById(
      6,
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.equal(undefined)
        done()
      }
    )
  })

  it('should find 5 people', function (done) {
    personModel.find(
      { },
      function (err, doc) {
        expect(err).to.equal(null)

        expect(doc).to.containSubset(
          [
            {
              'age': 8,
              'employeeNo': 3,
              'firstName': 'Lisa',
              'lastName': 'Simpson'
            },
            {
              'age': 10,
              'employeeNo': 5,
              'firstName': 'Bart',
              'lastName': 'Simpson'
            },
            {
              'age': 36,
              'employeeNo': 4,
              'firstName': 'Marge',
              'lastName': 'Simpson'
            },
            {
              'age': 39,
              'employeeNo': 1,
              'firstName': 'Homer',
              'lastName': 'Simpson'
            },
            {
              'employeeNo': 2,
              'firstName': 'Maggie',
              'lastName': 'Simpson'
            }
          ]
        )
        done()
      }
    )
  })

  it('should find Bart by name', function (done) {
    personModel.find(
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
              'employeeNo': 5,
              'firstName': 'Bart',
              'lastName': 'Simpson'
            }
          ]
        )

        done()
      }
    )
  })

  it('should get one Homer by name', function (done) {
    personModel.findOne(
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
            'employeeNo': 1,
            'firstName': 'Homer',
            'lastName': 'Simpson'
          }
        )

        done()
      }
    )
  })

  it("shouldn't get one missing person", function (done) {
    personModel.findOne(
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

  it("should update Maggie's age to 1", (done) => {
    personModel.update(
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

  it('should find Maggie has an age now', function (done) {
    personModel.findById(
      2,
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.containSubset(
          {
            'employeeNo': 2,
            'firstName': 'Maggie',
            'lastName': 'Simpson',
            'age': 1
          }
        )
        done()
      }
    )
  })

  it('should update Maggie again, but this time without an age', function (done) {
    personModel.update(
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

  it("should find Maggie's age has gone again", function (done) {
    personModel.findById(
      2,
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.containSubset(
          {
            'employeeNo': 2,
            'firstName': 'Maggie',
            'lastName': 'Simpson'
          }
        )
        done()
      }
    )
  })

  it('should patch Maggie to Margaret', function (done) {
    personModel.patch(
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

  it('should find Maggie is now a Margaret', function (done) {
    personModel.findById(
      2,
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.containSubset(
          {
            'employeeNo': 2,
            'firstName': 'Margaret',
            'lastName': 'Simpson'
          }
        )
        done()
      }
    )
  })

  it('should delete Maggie/Margaret by via her id', function (done) {
    personModel.destroyById(
      2,
      function (err, doc) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('should fail getting a deleted record', function (done) {
    personModel.findById(
      2,
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.equal(undefined)
        done()
      }
    )
  })

  it('should upsert (insert) Grampa', function (done) {
    personModel.upsert(
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
              employeeNo: 10
            }
          }
        )
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('should find Grampa has been inserted via upsert', function (done) {
    personModel.findById(
      10,
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.containSubset(
          {
            'employeeNo': 10,
            'firstName': 'Abe',
            'lastName': 'Simpson',
            'age': 82
          }
        )
        done()
      }
    )
  })

  it('should upsert (update) Grampa', function (done) {
    personModel.upsert(
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

  it('should find Grampa has now been updates via upsert', function (done) {
    personModel.findById(
      10,
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.containSubset(
          {
            'employeeNo': 10,
            'firstName': 'Abraham',
            'lastName': 'Simpson',
            'age': 83
          }
        )
        done()
      }
    )
  })

  it('should now upsert (update) Grampa, resetting his name', function (done) {
    personModel.upsert(
      {
        employeeNo: 10,
        firstName: 'Abe'
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

  it('should find Grampa again, with his age preserved and an updated name', function (done) {
    personModel.findById(
      10,
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.containSubset(
          {
            'employeeNo': 10,
            'firstName': 'Abe',
            'lastName': 'Simpson',
            'age': 83
          }
        )
        done()
      }
    )
  })

  it('should upsert (update) Grampa again, but turn age to null', function (done) {
    personModel.upsert(
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

  it('should find Grampa again, but now with a null age', function (done) {
    personModel.findById(
      10,
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.containSubset(
          {
            'employeeNo': 10,
            'firstName': 'Abraham',
            'lastName': 'Simpson'
          }
        )
        done()
      }
    )
  })

  it('should create mars, with two moons and a few craters', function (done) {
    planetsModel.create(
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

  it('should find Mars via primary key', function (done) {
    planetsModel.findById(
      'mars',
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.containSubset(
          {
            'name': 'mars',
            'title': 'Mars',
            'type': 'Terrestrial',
            'diameter': 6700,
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
                'discoveryYear': 1800
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

  it('should update Mars with more accurate info', function (done) {
    planetsModel.update(
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

  it('should find updated Mars via primary key', function (done) {
    planetsModel.findById(
      'mars',
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc.moons).to.have.length(1)
        expect(doc).to.containSubset(
          {
            'name': 'mars',
            'title': 'Mars',
            'type': 'Terrestrial',
            'diameter': 6779,
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

  it('should delete Mars', function (done) {
    planetsModel.destroyById(
      'mars',
      function (err, doc) {
        expect(err).to.equal(null)
        done()
      }
    )
  })

  it('should now fail to find Mars', function (done) {
    planetsModel.findById('mars',
      function (err, doc) {
        expect(err).to.equal(null)
        expect(doc).to.equal(undefined)
        done()
      }
    )
  })
})
