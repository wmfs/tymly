'use strict'

const addressLabelClosure = require('./address-label-generator')

module.exports = function (ctx) {
  const addressLabelGenerator = addressLabelClosure(ctx)
  return function addressbasePlusConverter (sourceRow, callback) {
    const output = {
      uprn: sourceRow.uprn,
      counter: 1,
      class: sourceRow.class,
      actualX: sourceRow.x,
      actualY: sourceRow.y,
      businessName: sourceRow.legalName,
      buildingName: sourceRow.buildingName,
      buildingNumber: sourceRow.buildingNumber,
      streetName1: sourceRow.streetDescription,
      areaName1: sourceRow.areaName,
      postTown: sourceRow.postTown,
      postcode: sourceRow.postcode
    }
    output.addressLabel = addressLabelGenerator(output)
    output.addressDescription = sourceRow.uprn
    callback(null, output)
  }
}
