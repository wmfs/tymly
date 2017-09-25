/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const getBlpuLabel = require('../functions/get-blpu-label')

describe('Process label tests', function () {
  it('Should get a label with organisation', function () {
    const data = {
      laOrganisation: 'organisation',
      rmOrganisationName: '',
      saoStartNumber: 1,
      saoStartSuffix: ' A',
      saoEndNumber: 2,
      saoEndSuffix: ' B',
      saoText: 'hello you! ',
      paoStartNumber: 121,
      paoStartSuffix: ' ',
      paoEndNumber: null,
      paoEndSuffix: '',
      paoText: '',
      streetDescription: 'ALPHINGTON ROAD',
      locality: '',
      postTown: 'EXETER',
      townName: 'EXETER',
      postcode: 'EX2 8JD'
    }
    expect(getBlpuLabel(data)).to.be.eql('Organisation, Hello You! 1A-2B, 121 Alphington Road, Exeter, EX2 8JD')
  })
  it('Should get a label with retired organisation, post town and post code null', function () {
    const data = {
      laOrganisation: '',
      rmOrganisationName: '',
      saoStartNumber: 1,
      saoStartSuffix: ' A',
      saoEndNumber: 2,
      saoEndSuffix: ' B',
      saoText: 'hello you! ',
      paoStartNumber: 121,
      paoStartSuffix: ' ',
      paoEndNumber: null,
      paoEndSuffix: '',
      paoText: '',
      streetDescription: 'ALPHINGTON ROAD',
      locality: '',
      postTown: null,
      townName: 'EXETER',
      postcode: null
    }
    expect(getBlpuLabel(data)).to.be.eql('Hello You! 1A-2B, 121 Alphington Road, Exeter')
  })
  it('Should get a label with organisation when street_locality and sao_text are null (not empty!)', function () {
    const data = {
      laOrganisation: 'organisation',
      rmOrganisationName: '',
      saoStartNumber: 1,
      saoStartSuffix: ' A',
      saoEndNumber: 2,
      saoEndSuffix: ' B',
      saoText: null,
      paoStartNumber: 121,
      paoStartSuffix: ' ',
      paoEndNumber: null,
      paoEndSuffix: '',
      paoText: '',
      streetDescription: 'ALPHINGTON ROAD',
      locality: null,
      postTown: null,
      townName: 'EXETER',
      postcode: 'EX2 8JD'
    }
    expect(getBlpuLabel(data)).to.be.eql('Organisation, 121 Alphington Road, Exeter, EX2 8JD')
  })
})
