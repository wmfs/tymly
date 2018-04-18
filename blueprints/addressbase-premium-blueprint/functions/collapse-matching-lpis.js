const deepmerge = require('deepmerge')

function collapseMatchingLpis (uprnNode) {
  // In the addressbase premium data, we can have two LandPropertyIdentifier objects with
  // the same LPI Key and Status if, and only if, it has an address in both English and Welsh.
  // In that case, we merge the two LandPropertyIdentifiers together
  const lpiCount = uprnNode.landPropertyIdentifierMember.length
  if (lpiCount === 1) return uprnNode // nothing to do, so bail

  const dupes = duplicateKeys(uprnNode)
  if (dupes.length === 0) return uprnNode

  for (const lpiKey of dupes) {
    const [engI, englishLpi] = findEnglish(uprnNode, lpiKey)
    const [welshI, welshLpi] = findWelsh(uprnNode, lpiKey)

    // remove the welsh lpiM
    uprnNode.landPropertyIdentifierMember.splice(welshI, 1)
    // strip out stuff which isn't welsh text
    for (const k of Object.keys(welshLpi)) {
      if (welshLpi[k][0]['#text']) {
        delete welshLpi[k]
      }
    }
    // merge into English. This is not a commentary on the history of our two great nations.
    const combinedLpi = deepmerge(englishLpi, welshLpi)
    uprnNode.landPropertyIdentifierMember[engI].LandPropertyIdentifier[0] = combinedLpi
    console.log(englishLpi)
  }

  return uprnNode
} // collapseMatchingLpis

function lpiKeyValue (lpiM) {
  return lpiM.LandPropertyIdentifier[0].lpiKey[0]['#text']
} // lpiKeyValue

function findLpi (uprnNode, lpiKey, langLabel) {
  const lpiMs = uprnNode.landPropertyIdentifierMember
  for (let i = 0; i !== lpiMs.length; ++i) {
    const lpiM = lpiMs[i]
    if (lpiKeyValue(lpiM) !== lpiKey) {
      continue
    }
    // aha! now, does it have the right language?
    // search down for language label
    if (hasLanguage(lpiM, langLabel)) {
      return [i, lpiM.LandPropertyIdentifier[0]]
    }
  } // for ...

  throw new Error(`Could not find LPI with key ${lpiKey} and language ${langLabel}`)
} // findLpi

function hasLanguage (lpiM, langLabel) {
  const lpi = lpiM.LandPropertyIdentifier[0]
  for (const va of Object.values(lpi)) {
    // all the values are arrays of length 1
    // containing an object with either a '#text' member or a language member
    if (va[0][langLabel]) {
      return true
    }
  } // for ...
  return false
} // hasLanguage

function findEnglish (uprnNode, lpiKey) {
  return findLpi(uprnNode, lpiKey, 'en')
} // findEnglish

function findWelsh (uprnNode, lpiKey) {
  return findLpi(uprnNode, lpiKey, 'cy')
} // findWelsh

function duplicateKeys (uprnNode) {
  const lpiKeys = uprnNode.landPropertyIdentifierMember.map(lpiM => lpiKeyValue(lpiM)).sort()
  const dupes = lpiKeys.reduce((dupes, key) => {
    if (dupes[dupes.length - 1] !== key) dupes.pop()
    dupes.push(key)
    return dupes
  }, [null])
  dupes.pop()
  return dupes
} // duplicateKeys

module.exports = function (ctx) {
  return collapseMatchingLpis
}
