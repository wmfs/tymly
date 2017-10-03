/* eslint-env mocha */

'use strict'

const fs = require('fs')
const path = require('path')
const expect = require('chai').expect
const endOfLine = require('os').EOL
const convertToCsv = require('../lib/convert-to-csv.js')
const RecordHandler = convertToCsv.RecordHandler
const createParser = convertToCsv.createParser
const getHeaders = convertToCsv.getHeaders

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

describe('XML Parser Tests', function () {
  describe('RecordHandler', function () {
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
      expect(csv).to.equal('Top Chip Shop,The Street' + endOfLine)
    })

    it('drive handler from expat', () => {
      const outStream = new TextStream()

      const parser = createParser('EstablishmentDetail', outStream)
      parser.write('<Wrapper><EstablishmentDetail><Name>Bill\'s Kebabs</Name><Address>Corner of Big Street</Address></EstablishmentDetail><Footer>Copyright</Footer></Wrapper>')

      const csv = outStream.text
      expect(csv).to.equal('Bill\'s Kebabs,Corner of Big Street' + endOfLine)
    })

    it('line break b/w two records', () => {
      const outStream = new TextStream()

      const parser = createParser('EstablishmentDetail', outStream)
      parser.write('<Wrapper><EstablishmentDetail><Name>Bill\'s Kebabs</Name><Address>Corner of Big Street</Address></EstablishmentDetail>' +
        '<EstablishmentDetail><Name>The Shop</Name><Address>The Road</Address></EstablishmentDetail><Footer>Copyright</Footer></Wrapper>')

      const csv = outStream.text
      expect(csv).to.equal(`Bill's Kebabs,Corner of Big Street${endOfLine}The Shop,The Road${endOfLine}`)
    })

    it('strip extra whitespace ', () => {
      const outStream = new TextStream()

      const parser = createParser('EstablishmentDetail', outStream)
      parser.write('<Wrapper><EstablishmentDetail><Name>Bill\'s Kebabs</Name><Address>Corner of Big Street</Address></EstablishmentDetail>' +
        `<EstablishmentDetail>${endOfLine}           <Name>The Shop</Name>    ${endOfLine}      <Address>The Road</Address>            </EstablishmentDetail><Footer>Copyright</Footer></Wrapper>`)

      const csv = outStream.text
      expect(csv).to.equal(`Bill's Kebabs,Corner of Big Street${endOfLine}The Shop,The Road${endOfLine}`)
    })

    it('handled nested markup', () => {
      const outStream = new TextStream()

      const parser = createParser('EstablishmentDetail', outStream)
      parser.write('<EstablishmentDetail><Name>Bill\'s Kebabs</Name><Address>     <Line1>Corner of Big Street</Line1>               </Address><Score>0</Score></EstablishmentDetail>')

      const csv = outStream.text
      expect(csv).to.equal('Bill\'s Kebabs,Corner of Big Street,0' + endOfLine)
    })
  })

  describe('header generator', () => {
    const headerTests = [
      [
        'simple one line',
        '<EstablishmentDetail><Name>Bill\'s Kebabs</Name><Address>The Street</Address><Footer>0</Footer></EstablishmentDetail>',
        'Name,Address,Footer' + endOfLine
      ],
      [
        'two lines',
        '<Wrap>' +
        '<EstablishmentDetail><Name>Bill\'s Kebabs</Name><Address>The Street</Address><Footer>0</Footer></EstablishmentDetail>' +
        '<EstablishmentDetail><Name>Bill\'s Kebabs</Name><Address>The Street</Address><Footer>0</Footer></EstablishmentDetail>' +
        '</Wrap>',
        'Name,Address,Footer' + endOfLine
      ],
      [
        'nested markup',
        '<EstablishmentDetail><Name>Bill\'s Kebabs</Name><Address><Line1>The Street</Line1></Address><Footer>0</Footer></EstablishmentDetail>',
        'Name,Line1,Footer' + endOfLine
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
    headerParser.write('<EstablishmentDetail><Name>Bill\'s Kebabs</Name><Address><Line1>The Street</Line1></Address></EstablishmentDetail>')
    contentParser.write('<EstablishmentDetail><Name>Bill\'s Kebabs</Name><Address><Line1>The Street</Line1></Address></EstablishmentDetail>')
    const csv = outStream.text
    expect(csv).to.equal(`Name,Line1${endOfLine}Bill's Kebabs,The Street${endOfLine}`)
  })

  it('convert an XML file to a CSV file', (done) => {
    let xmlPath = path.join(__dirname, 'fixtures', 'input-data', 'establishment.xml')
    let csvPath = path.join(__dirname, 'output', 'establishment.csv')
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath)
    }

    convertToCsv('EstablishmentDetail', xmlPath, csvPath, () => {
      expect(fs.existsSync(csvPath)).to.equal(true)
      expect(fs.statSync(csvPath).size).to.not.equal(0)

      const wholeFile = fs.readFileSync(csvPath, 'utf-8')
      const lines = wholeFile.split(endOfLine)
      expect(lines.length).to.equal(5)

      expect(lines[0].startsWith('FHRSID,LocalAuthorityBusinessID')).to.equal(true)
      expect(lines[1].startsWith('584976,32556')).to.equal(true)

      done()
    })
  })
})
