'use strict'

const turnEmptyNone = require('./turn-empty-none')
const processString = require('./process-string')
const processPostCode = require('./process-postcode')
const _ = require('lodash')
module.exports = function adjustStructure (data) {
  let adjustedData = new Map()
  let organisation = processString(String(data.laOrganisation))
  if (organisation === null || organisation === '' || organisation === 'Null') {
    organisation = processString(String(data.rmOrganisationName))
  }
  const saoStartNumber = data.saoStartNumber
  let saoStartSuffix = turnEmptyNone(String(data.saoStartSuffix))
  const saoEndNumber = data.saoEndNumber
  let saoEndSuffix = turnEmptyNone(String(data.saoEndSuffix))
  let saoText = turnEmptyNone(processString(String(data.saoText)))
  const paoStartNumber = data.paoStartNumber
  let paoStartSuffix = turnEmptyNone(String(data.paoStartSuffix))
  const paoEndNumber = data.paoEndNumber
  let paoEndSuffix = turnEmptyNone(String(data.paoEndSuffix))
  let paoText = turnEmptyNone(processString(String(data.paoText)))
  let streetDescriptor = turnEmptyNone(processString(String(data.streetDescription)))
  let streetLocality = turnEmptyNone(processString(String(data.locality)))
  let postTown = turnEmptyNone(processString(String(data.postTown)))
  let streetTown = turnEmptyNone(processString(String(data.townName)))
  let postCode = processPostCode(turnEmptyNone(String(data.postcode)))
  organisation = turnEmptyNone(organisation)
  let capOrg = _.toUpper(organisation)
  let retireOrg = false
  if (organisation !== null) {
    if (paoText !== null) {
      if ((_.toUpper(paoText).indexOf(capOrg) !== -1) || (_.toUpper(paoText) === _.toUpper(organisation))) {
        retireOrg = true
      }
    }
    if (retireOrg === false && saoText !== null) {
      if ((_.toUpper(saoText).indexOf(capOrg) !== -1) || (_.toUpper(saoText) === _.toUpper(organisation))) {
        retireOrg = true
      }
    }
    if (retireOrg === true) {
      organisation = null
    }
  }
  adjustedData.set('organisation', organisation)
  adjustedData.set('sao_start_number', saoStartNumber)
  adjustedData.set('sao_start_suffix', saoStartSuffix)
  adjustedData.set('sao_end_number', saoEndNumber)
  adjustedData.set('sao_end_suffix', saoEndSuffix)
  adjustedData.set('sao_text', saoText)
  adjustedData.set('pao_start_number', paoStartNumber)
  adjustedData.set('pao_start_suffix', paoStartSuffix)
  adjustedData.set('pao_end_number', paoEndNumber)
  adjustedData.set('pao_end_suffix', paoEndSuffix)
  adjustedData.set('pao_text', paoText)
  adjustedData.set('street_description', streetDescriptor)
  adjustedData.set('street_locality', streetLocality)
  adjustedData.set('post_town', postTown)
  adjustedData.set('street_town', streetTown)
  adjustedData.set('postcode', postCode)
  return adjustedData
}
