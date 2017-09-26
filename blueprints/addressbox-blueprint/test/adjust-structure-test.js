/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const adjustStructure = require('../functions/utils/adjust-structure')

describe('Process adjust structure tests', function () {
  it('Should get the organisation', function () {
    const data = {
      laOrganisation: 'organisation',
      rmOrganisationName: 'organisation'
    }

    const adjusted = adjustStructure(data)
    const org = adjusted.get('organisation')
    expect(org).to.be.eql('Organisation')
  })
  it('Should get the organisation from royal mail (la_organisation is empty)', function () {
    const data = {
      laOrganisation: '',
      rmOrganisationName: ' RM organisation'
    }

    expect(adjustStructure(data).get('organisation')).to.be.eql('Rm Organisation')
  })
  it('Should get the organisation from royal mail (la_organisation is null)', function () {
    const data = {
      laOrganisation: null,
      rmOrganisationName: ' RM organisation'
    }
    expect(adjustStructure(data).get('organisation')).to.be.eql('Rm Organisation')
  })
  it('Should retire organisation', function () {
    const data = {
      laOrganisation: 'organisation',
      rmOrganisationName: '',
      saoText: 'hello you! ',
      paoText: 'organisation again. '
    }

    expect(adjustStructure(data).get('organisation')).to.be.eql(null)
  })
  it('Should get the organisation, sao and pao fields, street details, town, postcode', function () {
    const data = {
      laOrganisation: 'organisation',
      rmOrganisationName: '',
      saoStartNumber: 1,
      saoStartSuffix: ' sao_start_suffix',
      saoEndNumber: 1,
      saoEndSuffix: ' sao_end_suffix',
      saoText: 'hello you! ',
      paoStartNumber: 121,
      paoStartSuffix: ' ',
      paoEndNumber: null,
      paoEndSuffix: '',
      paoText: 'organisation again. ',
      streetDescription: 'ALPHINGTON ROAD',
      locality: '',
      postTown: 'EXETER',
      townName: 'EXETER',
      postcode: 'EX2 8JD'
    }

    expect(adjustStructure(data).get('organisation')).to.be.eql(null)
    expect(adjustStructure(data).get('sao_start_number')).to.be.eql(1)
    expect(adjustStructure(data).get('sao_start_suffix')).to.be.eql('sao_start_suffix')
    expect(adjustStructure(data).get('sao_end_number')).to.be.eql(1)
    expect(adjustStructure(data).get('sao_end_suffix')).to.be.eql('sao_end_suffix')
    expect(adjustStructure(data).get('sao_text')).to.be.eql('Hello You!')
    expect(adjustStructure(data).get('pao_start_number')).to.be.eql(121)
    expect(adjustStructure(data).get('pao_start_suffix')).to.be.eql(null)
    expect(adjustStructure(data).get('pao_end_number')).to.be.eql(null)
    expect(adjustStructure(data).get('pao_end_suffix')).to.be.eql(null)
    expect(adjustStructure(data).get('pao_text')).to.be.eql('Organisation Again.')
    expect(adjustStructure(data).get('street_description')).to.be.eql('Alphington Road')
    expect(adjustStructure(data).get('street_locality')).to.be.eql(null)
    expect(adjustStructure(data).get('post_town')).to.be.eql('Exeter')
    expect(adjustStructure(data).get('street_town')).to.be.eql('Exeter')
    expect(adjustStructure(data).get('postcode')).to.be.eql('EX2 8JD')
  })
})
