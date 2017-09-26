'use strict'
const adjustStructure = require('./utils/adjust-structure')
const combineNumbersAndSuffixes = require('./utils/combine-numbers-and-suffixes')
module.exports = function getBlpuLabel (addressbasePlusProperties) {
  console.log(addressbasePlusProperties)
  let addressLines = []
  let adjustedData = adjustStructure(addressbasePlusProperties)
  if (adjustedData.get('organisation') !== null) {
    addressLines.push(adjustedData.get('organisation'))
  }
  let saoText = adjustedData.get('sao_text')
  if (saoText === undefined) {
    saoText = null
  }
  let saoStartNumber = adjustedData.get('sao_start_number')
  if (saoStartNumber === undefined) {
    saoStartNumber = null
  }
  let saoStartSuffix = adjustedData.get('sao_start_suffix')
  if (saoStartSuffix === undefined) {
    saoStartSuffix = null
  }
  let saoEndNumber = adjustedData.get('sao_end_number')
  if (saoEndNumber === undefined) {
    saoEndNumber = null
  }
  let saoEndSuffix = adjustedData.get('sao_end_suffix')
  if (saoEndSuffix === undefined) {
    saoEndSuffix = null
  }
  let combined = combineNumbersAndSuffixes(saoStartNumber, saoStartSuffix, saoEndNumber, saoEndSuffix)
  if (saoText !== null && saoText !== 'Null') {
    if (combined === null) {
      addressLines.push(saoText)
    } else {
      addressLines.push(saoText + ' ' + combined)
    }
  }
  combined = combineNumbersAndSuffixes(adjustedData.get('pao_start_number'), adjustedData.get('pao_start_suffix'), adjustedData.get('pao_end_number'), adjustedData.get('pao_end_suffix'))
  let streetLine = combined
  let streetDesc = adjustedData.get('street_description')
  if (streetDesc === undefined) {
    streetDesc = null
  }
  if (streetLine === null) {
    streetLine = streetDesc
  } else {
    streetLine = streetLine + ' ' + streetDesc
  }
  if (streetLine !== null) {
    addressLines.push(streetLine)
  }
  let streetLocality = adjustedData.get('street_locality')
  if (streetLocality === undefined) {
    streetLocality = null
  }
  let town = adjustedData.get('post_town')
  if (town === undefined) {
    town = null
  }
  if (town === 'Null' || town === null) {
    town = adjustedData.get('street_town')
  }
  if (streetLocality !== null && streetLocality !== 'Null') {
    if (town !== null) {
      if (town !== streetLocality) {
        addressLines.push(streetLocality)
      }
    } else {
      addressLines.push(streetLocality)
    }
  }
  if (town !== null || town !== 'Null') {
    addressLines.push(town)
  }
  let postCode = adjustedData.get('postcode')
  if (postCode === undefined) {
    postCode = null
  }
  if (postCode !== null && postCode !== 'null') {
    addressLines.push(postCode)
  }
  let label = addressLines.join(', ')
  if (label === null) {
    throw new Error('Property label will be None')
  }
  return label
}
