/* eslint-env mocha */

const path = require('path')
const fs = require('fs')
const expect = require('chai').expect
const convertToCsv = require('../lib/convert-to-csv.js')
const RecordHandler = convertToCsv.RecordHandler
const createParser = convertToCsv.createParser
const getHeaders = convertToCsv.getHeaders
const supercopy = require('../lib/index.js')
const pg = require('pg')
const sqlScriptRunner = require('./fixtures/sql-script-runner')

class TextStream {
  constructor () {
    this.data = ''
  }

  get text () { return this.data }

  write (data) {
    this.data += data
  }
  end () {
  }
}

describe('XML to CSV conversion, for that lovely crunchy FSA data', () => {
  describe('RecordHandler', () => {
    it('capture text within child elements of EstablishmentDetail', () => {
      const outStream = new TextStream()
      const rh = new RecordHandler('EstablishmentDetail', outStream)
      rh.startHandler('Wrapper')
      rh.startHandler('EstablishmentDetail')
      rh.startHandler('Name')
      rh.text('Top Chip Shop')
      rh.endHandler('Name')
      rh.startHandler('Address')
      rh.text('The Street')
      rh.endHandler('Address')
      rh.endHandler('EstablishmentDetail')
      rh.startHandler('Footer')
      rh.text('blurb')
      rh.endHandler('Footer')
      rh.endHandler('Wrapper')

      const csv = outStream.text
      expect(csv).to.equal('Top Chip Shop,The Street\n')
    })

    it('drive handler from expat', () => {
      const outStream = new TextStream()

      const parser = createParser('EstablishmentDetail', outStream)
      parser.write("<Wrapper><EstablishmentDetail><Name>Bill's Kebabs</Name><Address>Corner of Big Street</Address></EstablishmentDetail><Footer>Copyright</Footer></Wrapper>")

      const csv = outStream.text
      expect(csv).to.equal("Bill's Kebabs,Corner of Big Street\n")
    })

    it('line break b/w two records', () => {
      const outStream = new TextStream()

      const parser = createParser('EstablishmentDetail', outStream)
      parser.write("<Wrapper><EstablishmentDetail><Name>Bill's Kebabs</Name><Address>Corner of Big Street</Address></EstablishmentDetail>" +
        '<EstablishmentDetail><Name>The Shop</Name><Address>The Road</Address></EstablishmentDetail><Footer>Copyright</Footer></Wrapper>')

      const csv = outStream.text
      expect(csv).to.equal("Bill's Kebabs,Corner of Big Street\nThe Shop,The Road\n")
    })

    it('strip extra whitespace ', () => {
      const outStream = new TextStream()

      const parser = createParser('EstablishmentDetail', outStream)
      parser.write("<Wrapper><EstablishmentDetail><Name>Bill's Kebabs</Name><Address>Corner of Big Street</Address></EstablishmentDetail>" +
        '<EstablishmentDetail>\n           <Name>The Shop</Name>    \n      <Address>The Road</Address>            </EstablishmentDetail><Footer>Copyright</Footer></Wrapper>')

      const csv = outStream.text
      expect(csv).to.equal("Bill's Kebabs,Corner of Big Street\nThe Shop,The Road\n")
    })

    it('handled nested markup', () => {
      const outStream = new TextStream()

      const parser = createParser('EstablishmentDetail', outStream)
      parser.write("<EstablishmentDetail><Name>Bill's Kebabs</Name><Address>     <Line1>Corner of Big Street</Line1>               </Address><Score>0</Score></EstablishmentDetail>")

      const csv = outStream.text
      expect(csv).to.equal("Bill's Kebabs,Corner of Big Street,0\n")
    })
  })

  describe('header generator', () => {
    const headerTests = [
      [
        'simple one line',
        "<EstablishmentDetail><Name>Bill's Kebabs</Name><Address>The Street</Address><Footer>0</Footer></EstablishmentDetail>",
        'Name,Address,Footer\n'
      ],
      [
        'two lines',
        '<Wrap>' +
        "<EstablishmentDetail><Name>Bill's Kebabs</Name><Address>The Street</Address><Footer>0</Footer></EstablishmentDetail>" +
        "<EstablishmentDetail><Name>Bill's Kebabs</Name><Address>The Street</Address><Footer>0</Footer></EstablishmentDetail>" +
        '</Wrap>',
        'Name,Address,Footer\n'
      ],
      [
        'nested markup',
        "<EstablishmentDetail><Name>Bill's Kebabs</Name><Address><Line1>The Street</Line1></Address><Footer>0</Footer></EstablishmentDetail>",
        'Name,Line1,Footer\n'
      ]
    ]

    for (const test of headerTests) {
      it(test[0], () => {
        const outStream = new TextStream()
        const parser = getHeaders('EstablishmentDetail', outStream)
        parser.write(test[1])
        const csv = outStream.text
        expect(csv).to.equal(test[2])
      })
    }
  })

  it('combine header get, and data get', () => {
    const outStream = new TextStream()
    const headerParser = getHeaders('EstablishmentDetail', outStream)
    const contentParser = createParser('EstablishmentDetail', outStream)
    headerParser.write("<EstablishmentDetail><Name>Bill's Kebabs</Name><Address><Line1>The Street</Line1></Address></EstablishmentDetail>")
    contentParser.write("<EstablishmentDetail><Name>Bill's Kebabs</Name><Address><Line1>The Street</Line1></Address></EstablishmentDetail>")
    const csv = outStream.text
    expect(csv).to.equal("Name,Line1\nBill's Kebabs,The Street\n")
  })

  describe('chewing FSA data', () => {
    it('convert XML to csv', (done) => {
      let xmlPath = path.join(__dirname, '..', 'test', 'fixtures', 'test-data.xml')
      let csvPath = path.join(__dirname, '..', 'test', 'fixtures', 'output.csv')
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath)
      }

      convertToCsv('EstablishmentDetail', xmlPath, csvPath, () => {
        expect(fs.existsSync(csvPath)).to.equal(true)
        expect(fs.statSync(csvPath).size).to.not.equal(0)

        const wholeFile = fs.readFileSync(csvPath, 'utf-8')
        const lines = wholeFile.split('\n')
        expect(lines.length).to.equal(5)

        expect(lines[0].startsWith('FHRSID,LocalAuthorityBusinessID')).to.equal(true)
        expect(lines[1].startsWith('584976,32556')).to.equal(true)

        done()
      })
    })

    const connectionString = process.env.PG_CONNECTION_STRING
    let client
    it('Should initially drop-cascade the pg_model_test schema, if one exists', function (done) {
      client = new pg.Client(connectionString)
      client.connect()

      sqlScriptRunner(
        [
          'uninstall.sql',
          'install.sql'
        ],
        client,
        function (err) {
          expect(err).to.equal(null)
          done()
        }
      )
    })
    it('Should supercopy some people with XML conversion', function (done) {
      supercopy(
        {
          sourceDir: path.resolve(__dirname, './fixtures/xml-examples/people'),
          topDownTableOrder: ['adults', 'children'],
          headerColumnNamePkPrefix: '.',
          client: client,
          schemaName: 'supercopy_test',
          debug: true,
          truncateFirstTables: true,
          triggerElement: 'person',
          xmlSourceFile: path.resolve(__dirname, './fixtures/test-people.xml')
        },
        function (err) {
          expect(err).to.equal(null)
          done()
        }
      )
    })

    it('Should return correctly populated rows', function (done) {
      client.query(
        'select adult_no,first_name,last_name from supercopy_test.adults order by adult_no',
        function (err, result) {
          expect(err).to.equal(null)
          expect(result.rows).to.eql(
            [
              { adult_no: 10, first_name: 'Homer', last_name: 'Simpson' },
              { adult_no: 20, first_name: 'Marge', last_name: 'Simpson' },
              { adult_no: 30, first_name: 'Maud', last_name: 'Flanders' },
              { adult_no: 40, first_name: 'Ned', last_name: 'Flanderz' },
              { adult_no: 50, first_name: 'Seymour', last_name: 'Skinner' },
              { adult_no: 60, first_name: 'Charles', last_name: 'Burns' },
              { adult_no: 70, first_name: 'Waylon', last_name: 'Smithers' },
              { adult_no: 80, first_name: 'Clancy', last_name: 'Wigum' }
            ]
          )
          done()
        }
      )
    })
  })
})
