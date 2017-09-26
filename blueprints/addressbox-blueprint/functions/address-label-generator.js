'use strict'

module.exports = function (ctx) {
  return function generateAddressLabel (addressBoxGazetteerProperty) {
    const _ = ctx.utils._
    return _.compact([
      addressBoxGazetteerProperty.businessName,
      addressBoxGazetteerProperty.buildingName,
      addressBoxGazetteerProperty.buildingNumber,
      addressBoxGazetteerProperty.streetName1,
      addressBoxGazetteerProperty.areaName1,
      addressBoxGazetteerProperty.postTown,
      addressBoxGazetteerProperty.postcode
    ]).join(', ')
  }
}
