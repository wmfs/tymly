/* eslint-env mocha */

const chai = require('chai')
const chaiSubset = require('chai-subset')
chai.use(chaiSubset)
const expect = chai.expect
const path = require('path')
const smithereens = require('./../lib')

describe('Basic Smithereens tests', function () {
  it('should smash a simple CSV to smithereens', function (done) {
    smithereens(
      [
        path.join(__dirname, 'fixtures', 'people.csv')

        // people.csv:
        //   personNo,firstName,LastName,personType,action
        //   10,"Lisa","Simpson","c","u"
        //   20,"Homer","Simpson","a","u"
        //   30,"Bart","Simpson","c","d"
        //   40,"Marge","Simpson","a","d"
        //   50,"Maggie","Simpson","c","x"
        //   60,"Grampa","Simpson","x","u"
        //   70,"Milhouse","Van Houten","c","u"

      ],
      {
        outputDirRootPath: path.resolve(__dirname, './output'),

        parser: {
          quote: '"',
          delimiter: ',',
          newline: '\n',
          skipFirstLine: true,
          trimWhitespace: true
        },
        dirSplits: [
          {
            columnIndex: 3,
            valueToDirMap: {
              'c': 'children',
              'a': 'adults'
            }
          }
        ],
        fileSplits: {
          columnIndex: 4,
          valueToFileMap: {
            'i&u': {
              filename: 'changes',
              outputColumns: [
                {name: 'person_no', columnIndex: 0},
                {name: 'first_name', columnIndex: 1},
                {name: 'last_name', columnIndex: 2},
                {name: 'hash_sum', type: 'hash'}
              ]

            },
            'd': {
              filename: 'deletes',
              outputColumns: [
                {name: 'person_no', columnIndex: 0}
              ]
            }
          }
        }
      },

      function (err, manifest) {
        expect(err).to.eql(null)
        expect(manifest).to.containSubset(
          {
            filenamePaths:
            {
              changes:
              [
                'children/changes.csv',
                'adults/changes.csv',
                'unknown/changes.csv' ],
              deletes:
              [
                'children/deletes.csv',
                'adults/deletes.csv'
              ],
              unknown:
              [
                'children/unknown.csv'
              ]
            },
            counts:
            {
              totalFileCount: 6,
              totalLineCount: 7,
              byFilename:
              {
                changes: 4,
                deletes: 2,
                unknown: 1
              },
              byDir:
              {
                children: 4,
                adults: 2,
                unknown: 1
              },
              byFile:
              {
                'children/changes.csv': 2,
                'adults/changes.csv': 1,
                'children/deletes.csv': 1,
                'adults/deletes.csv': 1,
                'children/unknown.csv': 1,
                'unknown/changes.csv': 1
              }
            }
          }
        )

        done()
      }
    )
  })
})
