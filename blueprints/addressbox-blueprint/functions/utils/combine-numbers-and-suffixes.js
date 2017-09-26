'use strict'

module.exports = function combineNumbersAndSuffixes (startNumber, startSuffix, endNumber, endSuffix) {
  console.log(startNumber, startSuffix, endNumber, endSuffix)
  let label = null

  if (startNumber === undefined) {
    startNumber = null
  }
  if (startSuffix === undefined) {
    startSuffix = null
  }
  if (endNumber === undefined) {
    endNumber = null
  }
  if (endSuffix === undefined) {
    endSuffix = null
  }
  if ((startNumber === null && startSuffix === null) && (endNumber !== null || endSuffix !== null)) {
    startNumber = endNumber
    startSuffix = endSuffix
    endNumber = null
    endSuffix = null
  }
  if (startNumber !== null) {
    label = startNumber.toString()
  }
  if (startSuffix !== null) {
    if (label === null) {
      label = startSuffix
    } else {
      label += startSuffix
    }
  }
  if (endNumber !== null || endSuffix !== null) {
    if (label !== null) {
      label += '-'
    }
    if (endNumber !== null) {
      if (label === null) {
        label = endNumber.toString()
      } else {
        label += endNumber.toString()
      }
      if (endSuffix !== null) {
        if (label === null) {
          label = endSuffix
        } else {
          label += endSuffix
        }
      }
    }
  }
  return label
}
